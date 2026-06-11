import { getOpenAIClient } from "@/lib/openai/client";
import { isOpenAIConfigured } from "@/lib/openai/config";
import { createServerClient } from "@/lib/supabase/server";
import type { StoredVideoResult, VideoGenerationJob } from "@/lib/video/types";

/**
 * OpenAI (Sora) video provider — real generation via the official SDK:
 *
 *   openai.videos.create({ model, prompt, size, seconds })  → job
 *   openai.videos.retrieve(jobId)                           → poll status
 *   openai.videos.downloadContent(jobId)                    → MP4 bytes
 *
 * Models: sora-2 (default) or sora-2-pro via OPENAI_VIDEO_MODEL.
 * Download links expire ~1 hour after completion, so completed videos are
 * persisted to the `generated-videos` Supabase bucket immediately.
 */

type SoraSeconds = "4" | "8" | "12";
type SoraSize = "720x1280" | "1280x720" | "1024x1792" | "1792x1024";

export function getOpenAIVideoModel(): string {
  return (
    process.env.OPENAI_VIDEO_MODEL?.trim() ||
    process.env.VIDEO_GENERATION_MODEL?.trim() ||
    "sora-2"
  );
}

export function isOpenAIVideoConfigured(): boolean {
  return isOpenAIConfigured();
}

/**
 * The Videos API only accepts fixed resolutions. For vertical (9:16) content
 * the closest supported sizes are 720x1280 (sora-2) and 1024x1792 (sora-2-pro)
 * — 1080x1920 is not an accepted value, so requests for it map down.
 */
function resolveSize(model: string, requested?: string): SoraSize {
  const supported: SoraSize[] = ["720x1280", "1280x720", "1024x1792", "1792x1024"];
  if (requested && supported.includes(requested as SoraSize)) return requested as SoraSize;

  const wantsLandscape = requested ? /^(1920x1080|1792x1024|1280x720)$/.test(requested) : false;
  const pro = model.includes("pro");
  if (wantsLandscape) return pro ? "1792x1024" : "1280x720";
  return pro ? "1024x1792" : "720x1280";
}

/** Accepted durations are 4, 8, or 12 seconds — anything longer clamps to 12. */
function resolveSeconds(requested?: string | number): SoraSeconds {
  const n = Number(requested ?? 8);
  if (!Number.isFinite(n) || n <= 4) return "4";
  if (n <= 8) return "8";
  return "12";
}

function errorMessage(e: unknown): string {
  if (e && typeof e === "object" && "status" in e && "message" in e) {
    return `OpenAI Videos API ${(e as { status: unknown }).status}: ${String((e as { message: unknown }).message).slice(0, 300)}`;
  }
  return e instanceof Error ? e.message : "Video generation request failed";
}

function normalizeStatus(status?: string): "queued" | "in_progress" | "completed" | "failed" {
  if (status === "completed" || status === "succeeded") return "completed";
  if (status === "failed" || status === "cancelled") return "failed";
  if (status === "in_progress" || status === "processing") return "in_progress";
  return "queued";
}

/** Step 1 — submit the generation job. */
export async function createOpenAIVideoJob(
  prompt: string,
  opts?: { seconds?: string; size?: string }
): Promise<VideoGenerationJob> {
  if (!isOpenAIVideoConfigured()) {
    return { ok: false, error: "Video provider not connected — add OPENAI_API_KEY" };
  }

  const model = getOpenAIVideoModel();
  try {
    const client = getOpenAIClient();
    const video = await client.videos.create({
      model,
      prompt: prompt.slice(0, 4000),
      size: resolveSize(model, opts?.size),
      seconds: resolveSeconds(opts?.seconds),
    });
    if (!video.id) return { ok: false, error: "No job id returned by the video API" };
    return { ok: true, jobId: video.id, status: normalizeStatus(video.status) };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}

/** Step 4 — poll the job until completed/failed. */
export async function retrieveOpenAIVideoJob(jobId: string): Promise<VideoGenerationJob> {
  if (!isOpenAIVideoConfigured()) {
    return { ok: false, error: "Video provider not connected — add OPENAI_API_KEY" };
  }
  try {
    const client = getOpenAIClient();
    const video = await client.videos.retrieve(jobId);
    return {
      ok: true,
      jobId,
      status: normalizeStatus(video.status),
      progress: typeof video.progress === "number" ? video.progress : undefined,
      error: video.error?.message,
    };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}

async function storeBinary(bucketPath: string, bytes: Buffer, contentType: string): Promise<string | null> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.storage
      .from("generated-videos")
      .upload(bucketPath, bytes, { contentType, upsert: false });
    if (error) return null;
    const { data } = supabase.storage.from("generated-videos").getPublicUrl(bucketPath);
    return data?.publicUrl ?? null;
  } catch {
    return null;
  }
}

/**
 * Step 5 — once completed, download the MP4 (and thumbnail) and persist to
 * the `generated-videos` bucket so the preview survives OpenAI's 1-hour
 * download expiry.
 */
export async function downloadAndStoreOpenAIVideo(jobId: string): Promise<StoredVideoResult> {
  if (!isOpenAIVideoConfigured()) {
    return { ok: false, error: "Video provider not connected — add OPENAI_API_KEY" };
  }

  try {
    const client = getOpenAIClient();
    const videoRes = await client.videos.downloadContent(jobId);
    if (!videoRes.ok) {
      return { ok: false, error: `Video download failed (${videoRes.status})` };
    }
    const videoBytes = Buffer.from(await videoRes.arrayBuffer());
    const stamp = `${Date.now()}-${jobId.slice(-8)}`;
    const videoUrl = await storeBinary(`videos/${stamp}.mp4`, videoBytes, "video/mp4");
    if (!videoUrl) {
      return {
        ok: false,
        storageFailed: true,
        error:
          "Video generated successfully, but the storage upload failed. Use the direct download link, or fix storage (see /admin/video-diagnostics) and check status again.",
      };
    }

    let thumbnailUrl: string | undefined;
    try {
      const thumbRes = await client.videos.downloadContent(jobId, { variant: "thumbnail" });
      if (thumbRes.ok) {
        const thumbBytes = Buffer.from(await thumbRes.arrayBuffer());
        thumbnailUrl = (await storeBinary(`thumbnails/${stamp}.webp`, thumbBytes, "image/webp")) ?? undefined;
      }
    } catch {
      // thumbnail is best-effort
    }

    return { ok: true, videoUrl, thumbnailUrl };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}
