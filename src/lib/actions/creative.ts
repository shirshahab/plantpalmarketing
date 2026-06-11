"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import { generateCreativeVariants } from "@/lib/creative/creative-engine";
import { generateImageWithProvider } from "@/lib/integrations/providers/image-generation-provider";
import { rememberLesson } from "@/lib/agents/memory-hints";
import { recordHandoff } from "@/lib/collaboration/handoff";
import { createCompanyOutput, recordCompanyDecision } from "@/lib/company-os/company-os";

type Result = { ok: true; message?: string } | { ok: false; error: string };

const MIGRATION_HINT = "System setup is still finishing. This section will populate once the backend is ready.";

/** Create a creative project from an approved calendar item or a manual brief. */
export async function createCreativeProject(input: {
  calendarItemId?: string;
  title?: string;
  brief?: string;
  projectType: string;
  variants?: number;
}): Promise<Result> {
  try {
    const supabase = createServerClient();
    let title = input.title?.trim() ?? "";
    let brief = input.brief?.trim() ?? "";
    let platform = "";

    if (input.calendarItemId) {
      const { data: item } = await supabase
        .from("content_calendar")
        .select("title, hook, caption, cta, platform")
        .eq("id", input.calendarItemId)
        .maybeSingle();
      if (item) {
        title = title || item.title;
        brief = brief || [item.hook, item.caption, item.cta].filter(Boolean).join("\n\n");
        platform = item.platform;
      }
    }

    if (!title) return { ok: false, error: "Project needs a title or a calendar item" };

    const { data: project, error } = await supabase
      .from("creative_projects")
      .insert({
        title,
        brief: brief || title,
        project_type: input.projectType,
        calendar_item_id: input.calendarItemId ?? null,
        platform,
        status: "queued",
        variants_requested: Math.min(5, Math.max(1, input.variants ?? 3)),
      })
      .select("id")
      .single();
    if (error) {
      if (isMissingTableError(error)) return { ok: false, error: MIGRATION_HINT };
      return { ok: false, error: error.message };
    }

    await recordHandoff({
      fromAgent: "gate",
      toAgent: "fern",
      workflowName: "Gate → Fern",
      triggerType: "creative_project",
      triggerId: project.id,
      taskType: "creative_package",
      taskDescription: `Generate ${input.projectType} creative package for "${title}"`,
      priority: "medium",
      messageTitle: `Creative request — ${title}`,
      messageBody: `Approved content needs ${input.projectType} creative.\n\nBrief:\n${brief || title}`,
      activityDetail: `Creative project queued for Fern: "${title}" (${input.projectType})`,
    });

    revalidatePath("/creative");
    return { ok: true, message: "Project queued for Fern" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to create project" };
  }
}

/** Fern generates the variant concepts for a project. */
export async function generateProjectVariants(projectId: string): Promise<Result> {
  try {
    const supabase = createServerClient();
    const { data: project, error } = await supabase
      .from("creative_projects")
      .select("*")
      .eq("id", projectId)
      .maybeSingle();
    if (error || !project) return { ok: false, error: error?.message ?? "Project not found" };

    await supabase.from("creative_projects").update({ status: "generating" }).eq("id", projectId);

    const { variants, aiUsed } = await generateCreativeVariants(
      project.brief,
      project.project_type,
      project.variants_requested
    );

    // Replace any prior concept variants
    await supabase.from("creative_assets").delete().eq("project_id", projectId).eq("status", "concept");

    for (let i = 0; i < variants.length; i++) {
      await supabase.from("creative_assets").insert({
        project_id: projectId,
        variant_number: i + 1,
        asset_type: project.project_type,
        concept: variants[i].concept,
        prompt: variants[i].prompt,
        status: "concept",
        metadata: { aiUsed },
      });
    }

    await supabase.from("creative_projects").update({ status: "in_review" }).eq("id", projectId);

    // Phase 31A — register the creative package as a company output
    await createCompanyOutput({
      agentId: "fern",
      outputType: "creative_package",
      title: project.title,
      summary: `${variants.length} ${project.project_type} variants ready for review`,
      sourceTable: "creative_projects",
      sourceId: projectId,
      status: "pending_approval",
      approvalRequired: true,
    });

    revalidatePath("/creative");
    return {
      ok: true,
      message: `${variants.length} variants ready for review${aiUsed ? "" : " (template concepts — no OpenAI key)"}`,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Variant generation failed" };
  }
}

/** Render an actual image for a variant (image-type assets). */
export async function renderAssetImage(assetId: string): Promise<Result> {
  try {
    const supabase = createServerClient();
    const { data: asset, error } = await supabase
      .from("creative_assets")
      .select("id, prompt")
      .eq("id", assetId)
      .maybeSingle();
    if (error || !asset) return { ok: false, error: error?.message ?? "Asset not found" };

    const result = await generateImageWithProvider(asset.prompt);
    if (!result.ok || !result.url) {
      return { ok: false, error: result.error ?? "Image generation failed" };
    }

    await supabase
      .from("creative_assets")
      .update({ asset_url: result.url, status: "generated", metadata: { provider: result.provider, model: result.model } })
      .eq("id", assetId);

    revalidatePath("/creative");
    return { ok: true, message: "Image rendered" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Render failed" };
  }
}

/**
 * Founder review: approve / reject / regenerate (+ feedback).
 * Every decision becomes Fern memory so future packages improve.
 */
export async function reviewCreativeAsset(
  assetId: string,
  decision: "approve" | "reject" | "regenerate",
  feedback: string
): Promise<Result> {
  try {
    const supabase = createServerClient();
    const { data: asset, error } = await supabase
      .from("creative_assets")
      .select("id, project_id, concept, asset_type, status")
      .eq("id", assetId)
      .maybeSingle();
    if (error || !asset) return { ok: false, error: error?.message ?? "Asset not found" };

    const newStatus = decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "regenerate";
    await supabase.from("creative_assets").update({ status: newStatus }).eq("id", assetId);

    await supabase.from("creative_reviews").insert({
      project_id: asset.project_id,
      asset_id: assetId,
      decision,
      feedback: feedback || "",
    });

    // Fern learns from every decision
    await rememberLesson({
      agentId: "fern",
      memoryType: decision === "approve" ? "approved_style" : "rejected_style",
      memoryKey: `${decision}_${asset.asset_type}_${assetId.slice(0, 8)}`,
      memoryValue: `${decision === "approve" ? "Founder approved" : "Founder rejected"} ${asset.asset_type} concept: "${asset.concept}"${feedback ? `. Feedback: ${feedback}` : ""}`,
      importance: decision === "approve" ? 70 : 65,
    });

    if (decision === "approve") {
      await supabase.from("creative_projects").update({ status: "approved" }).eq("id", asset.project_id);
    }

    // Phase 31A — founder creative decision lands in Company OS
    await recordCompanyDecision({
      decisionType: "creative_review",
      decisionMaker: "founder",
      decision,
      reason: `${asset.asset_type} variant ${decision}d`,
      feedback: feedback || "",
      impactScore: decision === "approve" ? 65 : 45,
    });

    if (decision === "regenerate") {
      const { data: project } = await supabase
        .from("creative_projects")
        .select("brief, project_type")
        .eq("id", asset.project_id)
        .maybeSingle();
      if (project) {
        const { variants } = await generateCreativeVariants(
          `${project.brief}\n\nFounder feedback on the last attempt: ${feedback || "try a different direction"}`,
          project.project_type,
          1
        );
        if (variants[0]) {
          await supabase
            .from("creative_assets")
            .update({ concept: variants[0].concept, prompt: variants[0].prompt, status: "concept", asset_url: "" })
            .eq("id", assetId);
        }
      }
    }

    revalidatePath("/creative");
    return { ok: true, message: decision === "regenerate" ? "Regenerated — new concept ready" : `Asset ${newStatus}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Review failed" };
  }
}

/** Attach the approved variant to the source calendar item. */
export async function attachProjectToCalendar(projectId: string, assetId: string): Promise<Result> {
  try {
    const supabase = createServerClient();
    const [{ data: project }, { data: asset }] = await Promise.all([
      supabase.from("creative_projects").select("calendar_item_id, title").eq("id", projectId).maybeSingle(),
      supabase.from("creative_assets").select("asset_url, prompt").eq("id", assetId).maybeSingle(),
    ]);
    if (!project?.calendar_item_id) return { ok: false, error: "Project has no linked calendar item" };
    if (!asset) return { ok: false, error: "Asset not found" };

    await supabase
      .from("content_calendar")
      .update({
        asset_url: asset.asset_url,
        asset_type: "image",
        asset_prompt: asset.prompt,
      })
      .eq("id", project.calendar_item_id);

    await supabase.from("creative_projects").update({ status: "attached" }).eq("id", projectId);

    revalidatePath("/creative");
    revalidatePath("/calendar");
    return { ok: true, message: "Attached to calendar item" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Attach failed" };
  }
}
