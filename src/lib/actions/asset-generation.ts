"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import {
  generateImageWithProvider,
  isImageGenerationConfigured,
} from "@/lib/integrations/providers/image-generation-provider";
import { upsertCalendarItem } from "@/lib/content-calendar/sync";
import { recordHandoff } from "@/lib/collaboration/handoff";
import { buildCampaignContext, getCampaignContext } from "@/lib/assets/campaign-context";
import {
  ensureContentWorkflow,
  logWorkflowEvent,
  transitionContentWorkflow,
} from "@/lib/workflow/engine";
import { createNotification } from "@/lib/notifications/create";
import { destinationForImageApprove, destinationForKill } from "@/lib/workflow/destinations";
import { mossGateContent } from "@/lib/agents/moss";
import { founderSafeError } from "@/lib/integrations/founder-safe-error";
import type { Json } from "@/lib/supabase/database.types";

type Result = { ok: true; message?: string; destination?: string; nextOwner?: string; nextStep?: string } | { ok: false; error: string };

/** Phase 39 — image approval actions (Reject replaced with regeneration options). */
export type ImageWorkflowDecision =
  | "approve"
  | "regenerate_image"
  | "regenerate_caption"
  | "regenerate_both"
  | "kill_campaign"
  | "reject"
  | "request_revision";

const MIGRATION_HINT =
  "System setup is still finishing. This section will populate once the backend is ready.";

async function tryFeedback(row: Record<string, unknown>) {
  try {
    const supabase = createServerClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from("content_feedback").insert(row as any);
  } catch {
    // non-blocking
  }
}

/**
 * Part 2 — after a prompt is approved, create the asset package row.
 * Workflow: prompt → approve prompt → generate image → review → approve → calendar.
 */
export async function prepareAssetForPrompt(promptId: string): Promise<Result> {
  try {
    const supabase = createServerClient();
    const { data: prompt, error: promptError } = await supabase
      .from("image_prompts")
      .select("*")
      .eq("id", promptId)
      .maybeSingle();
    if (promptError || !prompt) return { ok: false, error: promptError?.message ?? "Prompt not found" };

    // One package per prompt — reuse if it already exists
    const { data: existing, error: existingError } = await supabase
      .from("generated_assets")
      .select("id")
      .eq("prompt_id", promptId)
      .limit(1)
      .maybeSingle();
    if (existingError && isMissingTableError(existingError)) return { ok: false, error: MIGRATION_HINT };
    if (existing) return { ok: true, message: "Asset package already exists" };

    // Phase 34 — store full campaign context so the founder sees WHY the
    // image exists before approving, and the calendar item is publish-ready.
    const campaign = buildCampaignContext({
      title: prompt.title,
      category: prompt.category,
      style: prompt.style,
    });

    const { data: inserted, error } = await supabase.from("generated_assets").insert({
      prompt_id: promptId,
      platform: campaign.platform,
      asset_type: "image",
      prompt: prompt.prompt,
      status: "pending_generation",
      generation_provider: isImageGenerationConfigured() ? "openai" : "none",
      metadata: {
        title: prompt.title,
        category: prompt.category,
        style: prompt.style,
        campaign,
      } as unknown as Json,
    }).select("id").single();
    if (error || !inserted) {
      return { ok: false, error: isMissingTableError(error) ? MIGRATION_HINT : (error?.message ?? "Insert failed") };
    }

    await ensureContentWorkflow({
      sourceTable: "generated_assets",
      sourceId: inserted.id,
      contentType: "image",
      title: prompt.title,
      stage: "IN_PRODUCTION",
      assignedAgent: "fern",
      initialEvent: "Asset package created — entering production",
      actor: "fern",
    });

    revalidatePath("/images");
    revalidatePath("/inbox");
    return { ok: true, message: "Asset package created — ready to generate" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to prepare asset" };
  }
}

/** Generate (or regenerate) the final image for an asset package. */
export async function generateImageAsset(assetId: string): Promise<Result> {
  try {
    const supabase = createServerClient();
    const { data: asset, error: assetError } = await supabase
      .from("generated_assets")
      .select("*")
      .eq("id", assetId)
      .maybeSingle();
    if (assetError || !asset) {
      return {
        ok: false,
        error: assetError && isMissingTableError(assetError) ? MIGRATION_HINT : (assetError?.message ?? "Asset not found"),
      };
    }

    await supabase.from("generated_assets").update({ status: "generating" }).eq("id", assetId);

    const result = await generateImageWithProvider(asset.prompt);

    if (!result.ok) {
      // Provider missing or call failed — keep the package usable.
      // Save the error in metadata so the founder can see it and regenerate.
      const providerMissing = result.provider === "none";
      await supabase
        .from("generated_assets")
        .update({
          status: providerMissing ? "generated" : "pending_generation",
          generation_provider: result.provider,
          generation_model: result.model,
          metadata: {
            ...(asset.metadata as Record<string, unknown>),
            placeholder: true,
            lastError: result.error ?? "",
            lastErrorAt: new Date().toISOString(),
            providerNote: result.error ?? "Image generation provider not connected yet.",
          } as Json,
        })
        .eq("id", assetId);
      revalidatePath("/images");
      return {
        ok: true,
        message: providerMissing
          ? "Image generation provider not connected yet — placeholder package created."
          : "Generation didn't go through this time — the package is still usable. Try Regenerate.",
      };
    }

    const cleanMeta = { ...(asset.metadata as Record<string, unknown>) };
    delete cleanMeta.lastError;
    delete cleanMeta.lastErrorAt;
    await supabase
      .from("generated_assets")
      .update({
        status: "generated",
        image_url: result.url ?? "",
        thumbnail_url: result.url ?? "",
        generation_provider: result.provider,
        generation_model: result.model,
        metadata: {
          ...cleanMeta,
          placeholder: false,
          generatedAt: new Date().toISOString(),
        } as Json,
      })
      .eq("id", assetId);

    const campaign = getCampaignContext(cleanMeta);
    const mossResult = await mossGateContent({
      text: campaign.caption,
      contentType: "image_post",
      sourceTable: "generated_assets",
      sourceId: assetId,
      producingAgent: "fern",
    });
    if (!mossResult.passed) {
      await supabase
        .from("generated_assets")
        .update({ status: "needs_revision", review_feedback: "Failed Moss voice check" })
        .eq("id", assetId);
      await transitionContentWorkflow({
        sourceTable: "generated_assets",
        sourceId: assetId,
        toStage: "WITH_AGENT",
        event: "Moss rejected caption — sent back to Fern",
        actor: "moss",
        agent: "fern",
        destinationLabel: "Waiting on Moss → Fern",
      });
      revalidatePath("/images");
      return { ok: true, message: "Moss rejected the caption (score too low). Sent back to Fern." };
    }

    await transitionContentWorkflow({
      sourceTable: "generated_assets",
      sourceId: assetId,
      toStage: "PENDING_FOUNDER_ASSET_APPROVAL",
      event: "Fern generated image — Moss approved",
      actor: "fern",
      agent: "gate",
      destinationLabel: "Waiting on founder",
    });

    await createNotification({
      type: "asset_ready",
      title: "Image ready for review",
      message: "Fern generated an image. Moss approved the caption.",
      targetRoute: `/images?asset=${assetId}`,
      targetTable: "generated_assets",
      targetId: assetId,
      priority: "high",
    });

    revalidatePath("/images");
    revalidatePath("/inbox");
    return { ok: true, message: "Image generated — review it below" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Generation failed" };
  }
}

/** Phase 39 — founder reviews image: approve sends to calendar immediately. */
export async function reviewGeneratedAsset(input: {
  assetId: string;
  decision: ImageWorkflowDecision;
  feedbackCategory?: string;
  note?: string;
}): Promise<Result> {
  try {
    const supabase = createServerClient();
    const note = (input.note ?? "").trim();
    const { data: asset } = await supabase
      .from("generated_assets")
      .select("*")
      .eq("id", input.assetId)
      .maybeSingle();
    if (!asset) return { ok: false, error: "Asset not found" };

    const meta = (asset.metadata as Record<string, unknown>) ?? {};
    const category = input.feedbackCategory || input.decision;

    if (input.decision === "approve") {
      const dest = destinationForImageApprove();
      await supabase
        .from("generated_assets")
        .update({ status: "approved", review_feedback: note || "approved as-is", selected: true })
        .eq("id", input.assetId);

      const cal = await attachAssetToCalendar(input.assetId);
      if (!cal.ok) return cal;

      await transitionContentWorkflow({
        sourceTable: "generated_assets",
        sourceId: input.assetId,
        toStage: dest.stage,
        event: "Founder approved asset — sent to calendar",
        actor: "founder",
        agent: "atlas",
        title: String(meta.title ?? "Image asset"),
        contentType: "image",
        destinationLabel: dest.strip,
        currentOwner: dest.nextOwner,
      });

      await createNotification({
        type: "calendar_ready",
        title: "Image moved to Calendar",
        message: dest.toast,
        targetRoute: "/calendar",
        targetTable: "generated_assets",
        targetId: input.assetId,
      });

      await tryFeedback({
        source_table: "generated_assets",
        source_id: input.assetId,
        content_id: input.assetId,
        content_type: "image_asset",
        agent_id: "fern",
        feedback_type: "image_review",
        decision: "approved",
        feedback_category: "approved as-is",
        feedback_text: note,
        created_by: "founder",
      });

      revalidatePath("/images");
      revalidatePath("/inbox");
      revalidatePath("/calendar");
      return {
        ok: true,
        message: dest.toast,
        destination: dest.destination,
        nextOwner: dest.nextOwner,
        nextStep: dest.nextStep,
      };
    }

    if (input.decision === "kill_campaign" || input.decision === "reject") {
      const dest = destinationForKill();
      await supabase
        .from("generated_assets")
        .update({ status: "rejected", review_feedback: note || "Campaign killed" })
        .eq("id", input.assetId);
      await transitionContentWorkflow({
        sourceTable: "generated_assets",
        sourceId: input.assetId,
        toStage: "KILLED",
        event: "Kill campaign",
        actor: "founder",
        note: note || category,
        destinationLabel: dest.strip,
      });
      revalidatePath("/images");
      revalidatePath("/inbox");
      return { ok: true, message: dest.toast, destination: dest.destination };
    }

    if (input.decision === "regenerate_caption" || input.decision === "regenerate_both") {
      const campaign = buildCampaignContext({
        title: String(meta.title ?? ""),
        category: String(meta.category ?? ""),
        style: String(meta.style ?? ""),
      });
      await supabase
        .from("generated_assets")
        .update({
          metadata: { ...meta, campaign } as unknown as Json,
          review_feedback: note || "Regenerate caption",
        })
        .eq("id", input.assetId);
      await logWorkflowEvent({
        sourceTable: "generated_assets",
        sourceId: input.assetId,
        event: "Regenerate caption",
        actor: "founder",
        agent: "bloom",
        note,
      });
    }

    if (
      input.decision === "regenerate_image" ||
      input.decision === "regenerate_both" ||
      input.decision === "request_revision"
    ) {
      await supabase
        .from("generated_assets")
        .update({
          status: "needs_revision",
          revision_notes: note || category,
          review_feedback: note || category,
        })
        .eq("id", input.assetId);

      await transitionContentWorkflow({
        sourceTable: "generated_assets",
        sourceId: input.assetId,
        toStage: "REVISION_REQUESTED",
        event:
          input.decision === "regenerate_both"
            ? "Regenerate image and caption"
            : "Regenerate image",
        actor: "founder",
        agent: "fern",
        note,
        destinationLabel: "Sent to Fern",
        currentOwner: "fern",
      });

      await recordHandoff({
        fromAgent: "gate",
        toAgent: "fern",
        workflowName: "Gate → Fern",
        triggerType: "asset_revision",
        triggerId: input.assetId,
        taskType: "asset_revision",
        taskDescription: `${input.decision}: ${note || category}`,
        priority: "high",
        messageTitle: `Image revision — ${input.decision}`,
        messageBody: note || category,
        activityDetail: `Founder requested ${input.decision}`,
      });

      if (input.decision === "regenerate_image" || input.decision === "regenerate_both") {
        await generateImageAsset(input.assetId);
      }
    }

    revalidatePath("/images");
    revalidatePath("/inbox");
    return { ok: true, message: "Sent back to production." };
  } catch (e) {
    return { ok: false, error: founderSafeError(e instanceof Error ? e.message : "Review failed") };
  }
}

/** Attach an approved asset to a calendar item (creates one if needed). */
export async function attachAssetToCalendar(assetId: string): Promise<Result> {
  try {
    const supabase = createServerClient();
    const { data: asset, error: assetError } = await supabase
      .from("generated_assets")
      .select("*")
      .eq("id", assetId)
      .maybeSingle();
    if (assetError || !asset) return { ok: false, error: assetError?.message ?? "Asset not found" };

    const meta = (asset.metadata as Record<string, unknown>) ?? {};
    const title = String(meta.title ?? "Generated visual asset");

    // Phase 34 — calendar items must be fully publish-ready: caption,
    // hashtags, CTA, platform, campaign objective and posting notes included.
    const campaign = getCampaignContext(meta);
    const hashtags = campaign.hashtags.join(" ");
    const fullCaption = `${campaign.caption}\n\n${campaign.cta}\n\n${hashtags}`.trim();

    let calendarId = asset.calendar_item_id;
    if (calendarId) {
      await supabase
        .from("content_calendar")
        .update({
          asset_url: asset.image_url,
          asset_type: "image",
          asset_prompt: asset.prompt,
          caption: fullCaption,
          cta: campaign.cta,
          notes: `${campaign.objective}\n\n${campaign.postingNotes}`,
        })
        .eq("id", calendarId);
    } else {
      calendarId = await upsertCalendarItem({
        title,
        platform: (campaign.platform || asset.platform || "instagram") as never,
        contentType: "image_post",
        caption: fullCaption,
        hook: campaign.hook,
        cta: campaign.cta,
        copyText: fullCaption,
        assetUrl: asset.image_url,
        assetType: "image",
        assetPrompt: asset.prompt,
        status: "approved",
        approvalStatus: "approved",
        sourceAgent: "fern",
        sourceTable: "generated_assets",
        sourceId: asset.id,
        notes: `${campaign.objective}\n\n${campaign.postingNotes}`,
        metadata: {
          generationProvider: asset.generation_provider,
          placeholder: meta.placeholder === true,
          campaign: campaign as unknown as Record<string, unknown>,
          hashtags: campaign.hashtags,
          objective: campaign.objective,
          targetAudience: campaign.targetAudience,
        },
      });
    }

    if (calendarId) {
      await supabase
        .from("generated_assets")
        .update({ calendar_item_id: calendarId, status: "scheduled" })
        .eq("id", assetId);

      await transitionContentWorkflow({
        sourceTable: "generated_assets",
        sourceId: assetId,
        toStage: "CALENDAR_READY",
        event: "Sent to calendar",
        actor: "atlas",
        agent: "sprout",
        calendarItemId: calendarId,
      });
      await ensureContentWorkflow({
        sourceTable: "content_calendar",
        sourceId: calendarId,
        contentType: "image_post",
        title,
        stage: "CALENDAR_READY",
        initialEvent: "Sent to calendar",
        actor: "atlas",
        assignedAgent: "atlas",
      });
    }

    revalidatePath("/images");
    revalidatePath("/calendar");
    revalidatePath("/inbox");
    return { ok: true, message: "Attached to calendar" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Attach failed" };
  }
}
