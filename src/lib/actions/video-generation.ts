"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import { upsertCalendarItem } from "@/lib/content-calendar/sync";
import { recordHandoff } from "@/lib/collaboration/handoff";
import {
  ensureContentWorkflow,
  transitionContentWorkflow,
} from "@/lib/workflow/engine";
import {
  generateVideo,
  generateVideoPackage,
  getVideoJobStatus,
  getVideoProviderStatus,
  downloadAndStoreVideo,
} from "@/lib/video/video-provider";
import type { Json } from "@/lib/supabase/database.types";

type Result = { ok: true; message?: string } | { ok: false; error: string };

/** Phase 39 — video approval actions. */
export type VideoWorkflowDecision =
  | "approve"
  | "improve_hook"
  | "improve_pacing"
  | "improve_visuals"
  | "improve_cta"
  | "regenerate_video"
  | "kill_campaign"
  | "reject"
  | "request_edits";

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

    const pkg = generateVideoPackage({
      title: script.title,
      hook: script.hook,
      sceneDescriptions,
      voiceover: script.voiceover,
      cta: script.cta,
    });
    const providerStatus = getVideoProviderStatus();

    const { data: inserted, error } = await supabase.from("generated_videos").insert({
      script_id: scriptId,
      platform: script.platform,
      script: pkg.fullScript,
      hook: script.hook,
      scenes: script.scenes as Json,
      voiceover: script.voiceover,
      on_screen_text: (script.on_screen_text ?? []) as unknown as Json,
      caption: `${script.hook} ${script.cta}`.trim(),
      cta: script.cta,
      status: "package_ready",
      generation_provider: providerStatus.canGenerate ? providerStatus.provider : "none",
      generation_model: providerStatus.canGenerate ? providerStatus.model : "",
      metadata: {
        title: script.title,
        visualDirection: pkg.visualDirection,
        bRollList: pkg.bRollList,
        hashtags: pkg.hashtags,
        thumbnailPrompt: pkg.thumbnailPrompt,
        uploadChecklist: pkg.uploadChecklist,
        providerNote: providerStatus.message,
      } as Json,
    }).select("id").single();
    if (error || !inserted) {
      return { ok: false, error: isMissingTableError(error) ? MIGRATION_HINT : (error?.message ?? "Insert failed") };
    }

    await ensureContentWorkflow({
      sourceTable: "generated_videos",
      sourceId: inserted.id,
      contentType: "video",
      title: script.title,
      stage: "IN_PRODUCTION",
      assignedAgent: "bloom",
      initialEvent: "Video package created — entering production",
      actor: "bloom",
    });

    revalidatePath("/video");
    revalidatePath("/inbox");
    return { ok: true, message: "Video package created" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to build package" };
  }
}

/**
 * Tolerates databases where migrations 055/057 haven't run yet: retries the
 * update without the new job_id / error_message columns (kept in metadata
 * anyway), and downgrades `generated_not_uploaded` to `generated` if the
 * status CHECK constraint hasn't been widened.
 */
async function updateVideoRow(
  videoId: string,
  patch: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from("generated_videos").update(patch as any).eq("id", videoId);
  if (!error) return { ok: true };

  if (/column|job_id|error_message/i.test(error.message) || /check constraint|generated_videos_status_check/i.test(error.message)) {
    const fallback = { ...patch };
    delete fallback.job_id;
    delete fallback.error_message;
    if (/check constraint|generated_videos_status_check/i.test(error.message) && fallback.status === "generated_not_uploaded") {
      fallback.status = "generated";
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const retry = await supabase.from("generated_videos").update(fallback as any).eq("id", videoId);
    if (!retry.error) return { ok: true };
    return { ok: false, error: isMissingTableError(retry.error) ? MIGRATION_HINT : retry.error.message };
  }
  return { ok: false, error: isMissingTableError(error) ? MIGRATION_HINT : error.message };
}

/**
 * Phase 34 — submit a real video generation job for an existing package.
 * Only available when VIDEO_PROVIDER is configured (e.g. openai + API key).
 */
export async function generateVideoFromPackage(videoId: string): Promise<Result> {
  try {
    const supabase = createServerClient();
    const { data: video, error: videoError } = await supabase
      .from("generated_videos")
      .select("*")
      .eq("id", videoId)
      .maybeSingle();
    if (videoError || !video) {
      return {
        ok: false,
        error: videoError && isMissingTableError(videoError) ? MIGRATION_HINT : (videoError?.message ?? "Video not found"),
      };
    }

    const providerStatus = getVideoProviderStatus();
    if (!providerStatus.canGenerate) {
      await updateVideoRow(videoId, {
        status: "provider_not_configured",
        metadata: {
          ...(video.metadata as Record<string, unknown>),
          providerNote: providerStatus.message,
        } as Json,
      });
      revalidatePath("/video");
      return { ok: false, error: providerStatus.message };
    }

    const meta = (video.metadata as Record<string, unknown>) ?? {};
    const prompt = [
      `Vertical 9:16 short-form marketing video for the PlantPal plant-care app.`,
      typeof meta.visualDirection === "string" ? meta.visualDirection : "",
      video.script,
    ]
      .filter(Boolean)
      .join("\n\n");

    // Vertical 9:16 defaults — provider maps to the closest supported size
    // (720x1280 for sora-2, 1024x1792 for sora-2-pro; max duration 12s).
    const job = await generateVideo(prompt, { seconds: "8" });
    if (!job.ok || !job.jobId) {
      const updated = await updateVideoRow(videoId, {
        status: "failed",
        error_message: job.error ?? "Video generation failed",
        metadata: { ...meta, lastError: job.error ?? "", lastErrorAt: new Date().toISOString() } as Json,
      });
      revalidatePath("/video");
      return { ok: false, error: updated.ok ? (job.error ?? "Video generation failed") : (updated.error ?? "Update failed") };
    }

    const updated = await updateVideoRow(videoId, {
      status: "generating",
      job_id: job.jobId,
      error_message: "",
      generation_provider: providerStatus.provider,
      generation_model: providerStatus.model,
      metadata: {
        ...meta,
        jobId: job.jobId,
        jobSubmittedAt: new Date().toISOString(),
        providerNote: providerStatus.message,
      } as Json,
    });
    if (!updated.ok) return { ok: false, error: updated.error ?? "Update failed" };

    revalidatePath("/video");
    return { ok: true, message: "Generation started — check status in a minute or two" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Generation failed" };
  }
}

/** Phase 34 — poll the provider job; on completion store the video + thumbnail. */
export async function checkVideoGenerationStatus(videoId: string): Promise<Result> {
  try {
    const supabase = createServerClient();
    const { data: video, error: videoError } = await supabase
      .from("generated_videos")
      .select("*")
      .eq("id", videoId)
      .maybeSingle();
    if (videoError || !video) {
      return { ok: false, error: videoError?.message ?? "Video not found" };
    }

    const meta = (video.metadata as Record<string, unknown>) ?? {};
    const row = video as Record<string, unknown>;
    const jobId = String(row.job_id ?? meta.jobId ?? "");
    if (!jobId) return { ok: false, error: "No generation job for this video yet" };

    const job = await getVideoJobStatus(jobId);
    if (!job.ok) return { ok: false, error: job.error ?? "Status check failed" };

    if (job.status === "failed") {
      await updateVideoRow(videoId, {
        status: "failed",
        error_message: job.error ?? "Generation failed at the provider",
        metadata: { ...meta, lastError: job.error ?? "", lastErrorAt: new Date().toISOString() } as Json,
      });
      revalidatePath("/video");
      return { ok: false, error: job.error ?? "Generation failed at the provider" };
    }

    if (job.status !== "completed") {
      const pct = typeof job.progress === "number" ? ` (${Math.round(job.progress)}%)` : "";
      return { ok: true, message: `Still generating${pct} — check again shortly` };
    }

    const stored = await downloadAndStoreVideo(jobId);
    if (!stored.ok || !stored.videoUrl) {
      if (stored.storageFailed) {
        // Phase 38 — generation succeeded, only storage broke. Status is
        // generated_not_uploaded (NOT failed) and everything needed to
        // recover the video is persisted on the row.
        await updateVideoRow(videoId, {
          status: "generated_not_uploaded",
          error_message: stored.storageError ?? stored.error ?? "Storage upload failed — direct download available",
          metadata: {
            ...meta,
            directDownloadOnly: true,
            direct_download_url: `/api/video/download/${videoId}`,
            provider_video_url: `https://api.openai.com/v1/videos/${jobId}/content`,
            generation_metadata: {
              jobId,
              provider: video.generation_provider,
              model: video.generation_model,
              completedAt: new Date().toISOString(),
              storageError: stored.storageError ?? "",
            },
            lastError: stored.storageError ?? stored.error ?? "",
            lastErrorAt: new Date().toISOString(),
          } as Json,
        });
        await transitionContentWorkflow({
          sourceTable: "generated_videos",
          sourceId: videoId,
          toStage: "PENDING_FOUNDER_ASSET_APPROVAL",
          event: "Video generated — storage upload failed, awaiting founder review",
          actor: "bloom",
          agent: "gate",
        });

        revalidatePath("/video");
        revalidatePath("/inbox");
        return {
          ok: true,
          message:
            "Video generated! Storage upload failed, so use the Download generated video button (provider link valid ~1 hour). You can still approve and schedule it.",
        };
      }
      await updateVideoRow(videoId, {
        error_message: stored.error ?? "Download failed",
        metadata: { ...meta, lastError: stored.error ?? "", lastErrorAt: new Date().toISOString() } as Json,
      });
      return { ok: false, error: stored.error ?? "Video completed but download failed" };
    }

    const updated = await updateVideoRow(videoId, {
      status: "generated",
      video_url: stored.videoUrl,
      ...(stored.thumbnailUrl ? { thumbnail_url: stored.thumbnailUrl } : {}),
      error_message: "",
      metadata: { ...meta, generatedAt: new Date().toISOString(), lastError: "", directDownloadOnly: false } as Json,
    });
    if (!updated.ok) return { ok: false, error: updated.error ?? "Update failed" };

    await transitionContentWorkflow({
      sourceTable: "generated_videos",
      sourceId: videoId,
      toStage: "PENDING_FOUNDER_ASSET_APPROVAL",
      event: "Video generated — awaiting founder review",
      actor: "bloom",
      agent: "gate",
    });

    revalidatePath("/video");
    revalidatePath("/inbox");
    return { ok: true, message: "Video generated — review it below" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Status check failed" };
  }
}

/** Phase 39 — founder reviews video: approve sends to calendar immediately. */
export async function reviewGeneratedVideo(input: {
  videoId: string;
  decision: VideoWorkflowDecision;
  feedbackCategory?: string;
  note?: string;
}): Promise<Result> {
  try {
    const supabase = createServerClient();
    const note = (input.note ?? "").trim();
    const { data: video } = await supabase
      .from("generated_videos")
      .select("*")
      .eq("id", input.videoId)
      .maybeSingle();
    if (!video) return { ok: false, error: "Video not found" };

    const meta = (video.metadata as Record<string, unknown>) ?? {};
    const category = input.feedbackCategory || input.decision;

    if (input.decision === "approve") {
      await supabase
        .from("generated_videos")
        .update({ status: "approved", review_feedback: note || "approved as-is" })
        .eq("id", input.videoId);

      const cal = await attachVideoToCalendar(input.videoId);
      if (!cal.ok) return cal;

      await transitionContentWorkflow({
        sourceTable: "generated_videos",
        sourceId: input.videoId,
        toStage: "CALENDAR_READY",
        event: "Founder approved asset — sent to calendar",
        actor: "founder",
        agent: "atlas",
        title: String(meta.title ?? video.hook?.slice(0, 80) ?? "Video"),
        contentType: "video",
      });

      revalidatePath("/video");
      revalidatePath("/inbox");
      revalidatePath("/calendar");
      return { ok: true, message: "Approved — moved to Calendar. Removed from Creative Department." };
    }

    if (input.decision === "kill_campaign" || input.decision === "reject") {
      await supabase
        .from("generated_videos")
        .update({ status: "rejected", review_feedback: note || "Campaign killed" })
        .eq("id", input.videoId);
      await transitionContentWorkflow({
        sourceTable: "generated_videos",
        sourceId: input.videoId,
        toStage: "REJECTED",
        event: "Kill campaign",
        actor: "founder",
        note: note || category,
      });
      revalidatePath("/video");
      revalidatePath("/inbox");
      return { ok: true, message: "Campaign killed." };
    }

    const improveMap: Record<string, { agent: "bloom" | "fern"; label: string }> = {
      improve_hook: { agent: "bloom", label: "Improve hook" },
      improve_pacing: { agent: "bloom", label: "Improve pacing" },
      improve_visuals: { agent: "fern", label: "Improve visuals" },
      improve_cta: { agent: "bloom", label: "Improve CTA" },
      request_edits: { agent: "bloom", label: "Request edits" },
    };

    const improve = improveMap[input.decision];
    if (improve) {
      await supabase
        .from("generated_videos")
        .update({ status: "needs_revision", revision_notes: note || improve.label, review_feedback: note || improve.label })
        .eq("id", input.videoId);

      await transitionContentWorkflow({
        sourceTable: "generated_videos",
        sourceId: input.videoId,
        toStage: "IN_PRODUCTION",
        event: improve.label,
        actor: "founder",
        agent: improve.agent,
        note,
      });

      await recordHandoff({
        fromAgent: "gate",
        toAgent: improve.agent,
        workflowName: `Gate → ${improve.agent === "fern" ? "Fern" : "Bloom"}`,
        triggerType: "video_revision",
        triggerId: input.videoId,
        taskType: "video_revision",
        taskDescription: `${improve.label}: ${note || category}`,
        priority: "high",
        messageTitle: improve.label,
        messageBody: note || category,
        activityDetail: improve.label,
      });
    }

    if (input.decision === "regenerate_video") {
      await supabase
        .from("generated_videos")
        .update({ status: "needs_revision", revision_notes: note || "Regenerate entire video" })
        .eq("id", input.videoId);

      await transitionContentWorkflow({
        sourceTable: "generated_videos",
        sourceId: input.videoId,
        toStage: "IN_PRODUCTION",
        event: "Regenerate entire video",
        actor: "founder",
        agent: "bloom",
        note,
      });

      await generateVideoFromPackage(input.videoId);
    }

    revalidatePath("/video");
    revalidatePath("/inbox");
    return { ok: true, message: "Sent back to production." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Review failed" };
  }
}

/**
 * Phase 33 — attach the final video URL (manual upload or external host).
 * Lets the founder review the actual video, not just the package.
 */
export async function attachVideoUrl(input: {
  videoId: string;
  videoUrl: string;
  thumbnailUrl?: string;
}): Promise<Result> {
  try {
    const videoUrl = input.videoUrl.trim();
    if (!videoUrl) return { ok: false, error: "Paste a video URL first" };
    if (!/^https?:\/\//i.test(videoUrl)) return { ok: false, error: "Video URL must start with http(s)://" };

    const supabase = createServerClient();
    const { error } = await supabase
      .from("generated_videos")
      .update({
        video_url: videoUrl,
        ...(input.thumbnailUrl?.trim() ? { thumbnail_url: input.thumbnailUrl.trim() } : {}),
        status: "generated",
        generation_provider: "manual",
      })
      .eq("id", input.videoId);
    if (error) {
      return { ok: false, error: isMissingTableError(error) ? MIGRATION_HINT : error.message };
    }

    revalidatePath("/video");
    return { ok: true, message: "Final video attached — review it below" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Attach failed" };
  }
}

/** Phase 33 — send the video package to Fern for creative rework. */
export async function sendVideoToFern(videoId: string, note?: string): Promise<Result> {
  try {
    const supabase = createServerClient();
    const remarks = (note ?? "").trim() || "Creative rework requested";

    const { error } = await supabase
      .from("generated_videos")
      .update({ status: "needs_revision", revision_notes: remarks })
      .eq("id", videoId);
    if (error) {
      return { ok: false, error: isMissingTableError(error) ? MIGRATION_HINT : error.message };
    }

    await tryFeedback({
      source_table: "generated_videos",
      source_id: videoId,
      content_id: videoId,
      content_type: "video_asset",
      agent_id: "fern",
      feedback_type: "video_review",
      decision: "revision_requested",
      feedback_category: "needs better visual",
      feedback_text: remarks,
      sent_back_to_agent: "fern",
      created_by: "founder",
    });

    await recordHandoff({
      fromAgent: "gate",
      toAgent: "fern",
      workflowName: "Gate → Fern",
      triggerType: "video_revision",
      triggerId: videoId,
      taskType: "video_revision",
      taskDescription: `Rework video creative. Founder remarks: ${remarks}`,
      priority: "high",
      messageTitle: "Video sent to Fern for creative rework",
      messageBody: `Founder remarks: ${remarks}`,
      activityDetail: "Founder sent a video package to Fern",
    });

    revalidatePath("/video");
    return { ok: true, message: "Sent to Fern" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Send failed" };
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

    // Phase 38 — a video that generated but failed to upload still has a
    // usable asset: the direct-download proxy. Never block the calendar.
    const directDownloadUrl =
      typeof meta.direct_download_url === "string" && meta.direct_download_url
        ? meta.direct_download_url
        : meta.directDownloadOnly === true
          ? `/api/video/download/${video.id}`
          : "";
    const assetUrl = video.video_url || directDownloadUrl;

    let calendarId = video.calendar_item_id;
    if (calendarId) {
      await supabase
        .from("content_calendar")
        .update({
          asset_url: assetUrl,
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
        assetUrl,
        assetType: "video",
        assetPrompt: String(meta.thumbnailPrompt ?? ""),
        status: assetUrl ? "ready_to_publish" : "needs_asset",
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

      await transitionContentWorkflow({
        sourceTable: "generated_videos",
        sourceId: videoId,
        toStage: "CALENDAR_READY",
        event: "Sent to calendar",
        actor: "atlas",
        agent: "sprout",
        calendarItemId: calendarId,
      });
      await ensureContentWorkflow({
        sourceTable: "content_calendar",
        sourceId: calendarId,
        contentType: "video",
        title,
        stage: "CALENDAR_READY",
        initialEvent: "Sent to calendar",
        actor: "atlas",
        assignedAgent: "atlas",
      });
    }

    revalidatePath("/video");
    revalidatePath("/calendar");
    revalidatePath("/inbox");
    return { ok: true, message: "Marked ready for calendar" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Attach failed" };
  }
}
