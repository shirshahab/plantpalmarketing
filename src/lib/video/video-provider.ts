import { getOpenAIConfig, isOpenAIConfigured } from "@/lib/openai/config";
import { createServerClient } from "@/lib/supabase/server";

/**
 * Phase 34 — video provider abstraction.
 *
 * VIDEO_PROVIDER=manual  → complete video package, no API calls (default)
 * VIDEO_PROVIDER=openai  → real generation via the OpenAI Videos API (Sora):
 *                          POST /v1/videos → poll GET /v1/videos/{id} →
 *                          download GET /v1/videos/{id}/content
 * runway / veo / pika    → reserved; reported as "not connected"
 */

export type VideoProviderMode = "manual" | "openai" | "runway" | "veo" | "pika";

export interface VideoProviderStatus {
  provider: VideoProviderMode;
  model: string;
  /** True when the provider can actually generate a video file. */
  canGenerate: boolean;
  /** Manual packaging always works, so the pipeline is never blocked. */
  packagingAvailable: true;
  message: string;
}

export interface VideoGenerationJob {
  ok: boolean;
  jobId?: string;
  status?: "queued" | "in_progress" | "completed" | "failed";
  progress?: number;
  error?: string;
}

export interface StoredVideoResult {
  ok: boolean;
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

const OPENAI_VIDEOS_URL = "https://api.openai.com/v1/videos";

function getVideoModel(): string {
  return (
    process.env.OPENAI_VIDEO_MODEL?.trim() ||
    process.env.VIDEO_GENERATION_MODEL?.trim() ||
    "sora-2"
  );
}

export function getVideoProviderStatus(): VideoProviderStatus {
  const raw = (process.env.VIDEO_PROVIDER?.trim().toLowerCase() || "manual") as VideoProviderMode;
  const provider: VideoProviderMode = ["manual", "openai", "runway", "veo", "pika"].includes(raw)
    ? raw
    : "manual";

  if (provider === "openai") {
    const model = getVideoModel();
    if (isOpenAIConfigured()) {
      return {
        provider,
        model,
        canGenerate: true,
        packagingAvailable: true,
        message: `OpenAI video generation ready (${model})`,
      };
    }
    return {
      provider,
      model,
      canGenerate: false,
      packagingAvailable: true,
      message: "Video generation provider not connected — add OPENAI_API_KEY",
    };
  }

  if (provider === "runway" || provider === "veo" || provider === "pika") {
    return {
      provider,
      model: process.env.VIDEO_GENERATION_MODEL?.trim() ?? "",
      canGenerate: false,
      packagingAvailable: true,
      message: `Video generation provider not connected (${provider} integration not implemented yet)`,
    };
  }

  return {
    provider: "manual",
    model: "",
    canGenerate: false,
    packagingAvailable: true,
    message: "Manual mode — full video packages, upload the final cut yourself",
  };
}

export interface VideoPackageInput {
  title: string;
  hook: string;
  sceneDescriptions: string[];
  voiceover: string;
  cta: string;
}

export interface VideoPackage {
  fullScript: string;
  visualDirection: string;
  bRollList: string[];
  hashtags: string[];
  thumbnailPrompt: string;
  uploadChecklist: string[];
}

/** Manual provider — builds the complete shoot-ready package for any script. */
export function generateVideoPackage(input: VideoPackageInput): VideoPackage {
  const fullScript = [
    `HOOK: ${input.hook}`,
    ...input.sceneDescriptions.map((d, i) => `SCENE ${i + 1}: ${d}`),
    `VOICEOVER: ${input.voiceover}`,
    `CTA: ${input.cta}`,
  ].join("\n\n");

  return {
    fullScript,
    visualDirection:
      "Vertical 9:16. Warm natural light, real plants in frame, hook text on screen for the first 3 seconds.",
    bRollList: [
      "Close-up of leaves (healthy + struggling for contrast)",
      "Phone screen showing the PlantPal scan flow",
      "Hands repotting / watering",
      "Reaction shot after the diagnosis result",
    ],
    hashtags: ["#plantcare", "#planttok", "#houseplants", "#plantpal"],
    thumbnailPrompt: `Bright, cozy thumbnail for: ${input.title}. A healthy plant + phone with the PlantPal app, bold readable title text.`,
    uploadChecklist: [
      "Record or assemble the video from the scene list",
      "Add on-screen text and captions",
      "Export vertical 1080×1920",
      "Paste caption + hashtags",
      "Upload manually, then mark as posted on the calendar",
    ],
  };
}

/** Submit a generation job to the configured provider. */
export async function generateVideo(prompt: string, opts?: { seconds?: string; size?: string }): Promise<VideoGenerationJob> {
  const status = getVideoProviderStatus();
  if (!status.canGenerate) {
    return { ok: false, error: status.message };
  }

  const { apiKey } = getOpenAIConfig();
  try {
    const res = await fetch(OPENAI_VIDEOS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: status.model,
        prompt: prompt.slice(0, 4000),
        size: opts?.size ?? "720x1280",
        seconds: opts?.seconds ?? "8",
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `OpenAI Videos API ${res.status}: ${body.slice(0, 300)}` };
    }

    const json = (await res.json()) as { id?: string; status?: string };
    if (!json.id) return { ok: false, error: "No job id returned by the video API" };
    return { ok: true, jobId: json.id, status: normalizeJobStatus(json.status) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Video generation request failed" };
  }
}

function normalizeJobStatus(status?: string): "queued" | "in_progress" | "completed" | "failed" {
  if (status === "completed" || status === "succeeded") return "completed";
  if (status === "failed" || status === "cancelled") return "failed";
  if (status === "in_progress" || status === "processing") return "in_progress";
  return "queued";
}

/** Poll a generation job. */
export async function getVideoJobStatus(jobId: string): Promise<VideoGenerationJob> {
  const { apiKey } = getOpenAIConfig();
  if (!apiKey) return { ok: false, error: "OPENAI_API_KEY not configured" };

  try {
    const res = await fetch(`${OPENAI_VIDEOS_URL}/${jobId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `OpenAI Videos API ${res.status}: ${body.slice(0, 300)}` };
    }
    const json = (await res.json()) as { id?: string; status?: string; progress?: number; error?: { message?: string } };
    return {
      ok: true,
      jobId,
      status: normalizeJobStatus(json.status),
      progress: typeof json.progress === "number" ? json.progress : undefined,
      error: json.error?.message,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Status check failed" };
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
 * Download a completed video (and thumbnail) from OpenAI and store it in the
 * `generated-videos` bucket. OpenAI download links expire ~1 hour after
 * completion, so we persist the file immediately.
 */
export async function downloadAndStoreVideo(jobId: string): Promise<StoredVideoResult> {
  const { apiKey } = getOpenAIConfig();
  if (!apiKey) return { ok: false, error: "OPENAI_API_KEY not configured" };

  try {
    const videoRes = await fetch(`${OPENAI_VIDEOS_URL}/${jobId}/content`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!videoRes.ok) {
      const body = await videoRes.text();
      return { ok: false, error: `Video download failed (${videoRes.status}): ${body.slice(0, 200)}` };
    }
    const videoBytes = Buffer.from(await videoRes.arrayBuffer());
    const stamp = `${Date.now()}-${jobId.slice(-8)}`;
    const videoUrl = await storeBinary(`videos/${stamp}.mp4`, videoBytes, "video/mp4");
    if (!videoUrl) {
      return {
        ok: false,
        error:
          "Video generated but storage upload failed — finish setup (see /admin/setup-health), then check status again within 1 hour.",
      };
    }

    let thumbnailUrl: string | undefined;
    try {
      const thumbRes = await fetch(`${OPENAI_VIDEOS_URL}/${jobId}/content?variant=thumbnail`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: "no-store",
      });
      if (thumbRes.ok) {
        const thumbBytes = Buffer.from(await thumbRes.arrayBuffer());
        thumbnailUrl = (await storeBinary(`thumbnails/${stamp}.webp`, thumbBytes, "image/webp")) ?? undefined;
      }
    } catch {
      // thumbnail is best-effort
    }

    return { ok: true, videoUrl, thumbnailUrl };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Video download failed" };
  }
}
