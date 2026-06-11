"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import { upsertCalendarItem } from "@/lib/content-calendar/sync";
import { recordHandoff } from "@/lib/collaboration/handoff";
import type { Json } from "@/lib/supabase/database.types";

type Result = { ok: true; message?: string } | { ok: false; error: string };

const MIGRATION_HINT =
  "generated_videos table not found — run supabase/migrations/048_phase29_missing_tables_and_assets.sql";

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
 * Part 3 — after a script is approved, build the complete video package:
 * script, scene list, visual direction, b-roll list, caption, hashtags,
 * thumbnail prompt, and an upload checklist. Final video generation is
 * placeholder until a video provider is connected.
 */
export async function buildVideoPackageFromScript(scriptId: string): Promise<Result> {
  try {
    const supabase = createServerClient();
    const { data: script, error: scriptError } = await supabase
      .from("video_scripts")
      .select("*")
      .eq("id", scriptId)
      .maybeSingle();
    if (scriptError || !script) return { ok: false, error: scriptError?.message ?? "Script not found" };

    const { data: existing, error: existingError } = await supabase
      .from("generated_videos")
      .select("id")
      .eq("script_id", scriptId)
      .limit(1)
      .maybeSingle();
    if (existingError && isMissingTableError(existingError)) return { ok: false, error: MIGRATION_HINT };
    if (existing) return { ok: true, message: "Video package already exists" };

    const scenes = Array.isArray(script.scenes) ? script.scenes : [];
    const sceneDescriptions = scenes
      .map((s) => (s && typeof s === "object" ? String((s as Record<string, unknown>).description ?? "") : ""))
      .filter(Boolean);

    const fullScript = [
      `HOOK: ${script.hook}`,
      ...sceneDescriptions.map((d, i) => `SCENE ${i + 1}: ${d}`),
      `VOICEOVER: ${script.voiceover}`,
      `CTA: ${script.cta}`,
    ].join("\n\n");

    const { error } = await supabase.from("generated_videos").insert({
      script_id: scriptId,
      platform: script.platform,
      script: fullScript,
      hook: script.hook,
      scenes: script.scenes as Json,
      voiceover: script.voiceover,
      on_screen_text: (script.on_screen_text ?? []) as unknown as Json,
      caption: `${script.hook} ${script.cta}`.trim(),
      cta: script.cta,
      status: "package_ready",
      generation_provider: "none",
      metadata: {
        title: script.title,
        visualDirection:
          "Vertical 9:16. Warm natural light, real plants in frame, hook text on screen for the first 3 seconds.",
        bRollList: [
          "Close-up of leaves (healthy + struggling for contrast)",
          "Phone screen showing the PlantPal scan flow",
          "Hands repotting / watering",
          "Reaction shot after the diagnosis result",
        ],
        hashtags: ["#plantcare", "#planttok", "#houseplants", "#plantpal"],
        thumbnailPrompt: `Bright, cozy thumbnail for: ${script.title}. A healthy plant + phone with the PlantPal app, bold readable title text.`,
        uploadChecklist: [
          "Record or assemble the video from the scene list",
          "Add on-screen text and captions",
          "Export vertical 1080×1920",
          "Paste caption + hashtags",
          "Upload manually, then mark as posted on the calendar",
        ],
        providerNote: "Final video generation not connected yet.",
      } as Json,
    });
    if (error) {
      return { ok: false, error: isMissingTableError(error) ? MIGRATION_HINT : error.message };
    }

    revalidatePath("/video");
    return { ok: true, message: "Video package created" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to build package" };
  }
}

/** Founder reviews the video (or package): approve / reject / request edits with remarks. */
export async function reviewGeneratedVideo(input: {
  videoId: string;
  decision: "approve" | "reject" | "request_edits";
  feedbackCategory?: string;
  note?: string;
}): Promise<Result> {
  try {
    const supabase = createServerClient();
    const note = (input.note ?? "").trim();
    const category =
      input.feedbackCategory || (input.decision === "approve" ? "approved as-is" : "needs better video pacing");
    const status =
      input.decision === "approve" ? "approved" : input.decision === "reject" ? "rejected" : "needs_revision";

    const { error } = await supabase
      .from("generated_videos")
      .update({
        status,
        review_feedback: note || category,
        ...(input.decision === "request_edits" ? { revision_notes: note || category } : {}),
      })
      .eq("id", input.videoId);
    if (error) {
      return { ok: false, error: isMissingTableError(error) ? MIGRATION_HINT : error.message };
    }

    await tryFeedback({
      source_table: "generated_videos",
      source_id: input.videoId,
      content_id: input.videoId,
      content_type: "video_asset",
      agent_id: "bloom",
      feedback_type: "video_review",
      decision:
        input.decision === "approve" ? "approved" : input.decision === "reject" ? "rejected" : "edit_requested",
      feedback_category: category,
      feedback_text: note,
      sent_back_to_agent: input.decision === "request_edits" ? "bloom" : "",
      created_by: "founder",
    });

    if (input.decision === "request_edits") {
      await recordHandoff({
        fromAgent: "gate",
        toAgent: "bloom",
        workflowName: "Gate → Bloom",
        triggerType: "video_revision",
        triggerId: input.videoId,
        taskType: "video_revision",
        taskDescription: `Rework video package (${category}). Founder remarks: ${note || "see category"}`,
        priority: "high",
        messageTitle: `Video edits requested — ${category}`,
        messageBody: `Founder left remarks on the video package.\n\nFeedback: ${note || category}`,
        activityDetail: `Founder requested video edits — ${category}`,
      });
    }

    revalidatePath("/video");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Review failed" };
  }
}

/** Mark an approved video package ready for the calendar (creates the item). */
export async function attachVideoToCalendar(videoId: string): Promise<Result> {
  try {
    const supabase = createServerClient();
    const { data: video, error: videoError } = await supabase
      .from("generated_videos")
      .select("*")
      .eq("id", videoId)
      .maybeSingle();
    if (videoError || !video) return { ok: false, error: videoError?.message ?? "Video not found" };

    const meta = (video.metadata as Record<string, unknown>) ?? {};
    const title = String(meta.title ?? video.hook.slice(0, 80) ?? "Video package");

    let calendarId = video.calendar_item_id;
    if (calendarId) {
      await supabase
        .from("content_calendar")
        .update({
          asset_url: video.video_url,
          asset_type: "video",
          caption: video.caption,
          hook: video.hook,
          cta: video.cta,
        })
        .eq("id", calendarId);
    } else {
      calendarId = await upsertCalendarItem({
        title,
        platform: (video.platform.includes("tiktok") ? "tiktok" : video.platform.includes("short") ? "youtube_shorts" : "instagram") as never,
        contentType: "video",
        caption: video.caption,
        hook: video.hook,
        cta: video.cta,
        assetUrl: video.video_url,
        assetType: "video",
        assetPrompt: String(meta.thumbnailPrompt ?? ""),
        status: video.video_url ? "ready_to_publish" : "needs_asset",
        approvalStatus: "approved",
        sourceAgent: "bloom",
        sourceTable: "generated_videos",
        sourceId: video.id,
        copyText: [video.hook, video.caption, video.cta].filter(Boolean).join("\n\n"),
        metadata: meta,
      });
    }

    if (calendarId) {
      await supabase
        .from("generated_videos")
        .update({ calendar_item_id: calendarId, status: "scheduled" })
        .eq("id", videoId);
    }

    revalidatePath("/video");
    revalidatePath("/calendar");
    return { ok: true, message: "Marked ready for calendar" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Attach failed" };
  }
}
