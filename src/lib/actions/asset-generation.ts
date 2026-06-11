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
import type { Json } from "@/lib/supabase/database.types";

type Result = { ok: true; message?: string } | { ok: false; error: string };

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

    const { error } = await supabase.from("generated_assets").insert({
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
    });
    if (error) {
      return { ok: false, error: isMissingTableError(error) ? MIGRATION_HINT : error.message };
    }

    revalidatePath("/images");
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

    revalidatePath("/images");
    return { ok: true, message: "Image generated — review it below" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Generation failed" };
  }
}

/** Founder reviews the finished image: approve / reject / request revision with feedback. */
export async function reviewGeneratedAsset(input: {
  assetId: string;
  decision: "approve" | "reject" | "request_revision";
  feedbackCategory?: string;
  note?: string;
}): Promise<Result> {
  try {
    const supabase = createServerClient();
    const note = (input.note ?? "").trim();
    const category = input.feedbackCategory || (input.decision === "approve" ? "approved as-is" : "needs better visual");
    const status =
      input.decision === "approve" ? "approved" : input.decision === "reject" ? "rejected" : "needs_revision";

    const { error } = await supabase
      .from("generated_assets")
      .update({
        status,
        review_feedback: note || category,
        ...(input.decision === "request_revision" ? { revision_notes: note || category } : {}),
        selected: input.decision === "approve",
      })
      .eq("id", input.assetId);
    if (error) {
      return { ok: false, error: isMissingTableError(error) ? MIGRATION_HINT : error.message };
    }

    await tryFeedback({
      source_table: "generated_assets",
      source_id: input.assetId,
      content_id: input.assetId,
      content_type: "image_asset",
      agent_id: "fern",
      feedback_type: "image_review",
      decision: input.decision === "approve" ? "approved" : input.decision === "reject" ? "rejected" : "revision_requested",
      feedback_category: category,
      feedback_text: note,
      sent_back_to_agent: input.decision === "request_revision" ? "fern" : "",
      created_by: "founder",
    });

    if (input.decision === "request_revision") {
      await recordHandoff({
        fromAgent: "gate",
        toAgent: "fern",
        workflowName: "Gate → Fern",
        triggerType: "asset_revision",
        triggerId: input.assetId,
        taskType: "asset_revision",
        taskDescription: `Regenerate image asset (${category}). Founder notes: ${note || "see category"}`,
        priority: "high",
        messageTitle: `Image revision requested — ${category}`,
        messageBody: `Founder asked for a new version.\n\nFeedback: ${note || category}`,
        activityDetail: `Founder sent an image asset back to Fern — ${category}`,
      });
    }

    revalidatePath("/images");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Review failed" };
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
    }

    revalidatePath("/images");
    revalidatePath("/calendar");
    return { ok: true, message: "Attached to calendar" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Attach failed" };
  }
}
