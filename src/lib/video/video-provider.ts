import {
  createOpenAIVideoJob,
  downloadAndStoreOpenAIVideo,
  getOpenAIVideoModel,
  isOpenAIVideoConfigured,
  retrieveOpenAIVideoJob,
} from "@/lib/video/openai-video-provider";
import type {
  StoredVideoResult,
  VideoGenerationJob,
  VideoProviderMode,
  VideoProviderStatus,
} from "@/lib/video/types";

export type { StoredVideoResult, VideoGenerationJob, VideoProviderMode, VideoProviderStatus };

/**
 * Phase 34 — video provider abstraction.
 *
 * VIDEO_PROVIDER=manual  → complete video package, no API calls (default)
 * VIDEO_PROVIDER=openai  → real generation via the OpenAI SDK (Sora):
 *                          videos.create → videos.retrieve → downloadContent
 *                          (see src/lib/video/openai-video-provider.ts)
 * runway / veo / pika    → reserved; reported as "not connected"
 */

export function getVideoProviderStatus(): VideoProviderStatus {
  const raw = (process.env.VIDEO_PROVIDER?.trim().toLowerCase() || "manual") as VideoProviderMode;
  const provider: VideoProviderMode = ["manual", "openai", "runway", "veo", "pika"].includes(raw)
    ? raw
    : "manual";

  if (provider === "openai") {
    const model = getOpenAIVideoModel();
    if (isOpenAIVideoConfigured()) {
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
      message: "Video provider not connected — add OPENAI_API_KEY",
    };
  }

  if (provider === "runway" || provider === "veo" || provider === "pika") {
    return {
      provider,
      model: process.env.VIDEO_GENERATION_MODEL?.trim() ?? "",
      canGenerate: false,
      packagingAvailable: true,
      message: `Video provider not connected (${provider} integration not implemented yet)`,
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

/** Submit a generation job to the configured provider (vertical 9:16 by default). */
export async function generateVideo(
  prompt: string,
  opts?: { seconds?: string; size?: string }
): Promise<VideoGenerationJob> {
  const status = getVideoProviderStatus();
  if (!status.canGenerate) {
    return { ok: false, error: status.message };
  }
  return createOpenAIVideoJob(prompt, opts);
}

/** Poll a generation job. */
export async function getVideoJobStatus(jobId: string): Promise<VideoGenerationJob> {
  return retrieveOpenAIVideoJob(jobId);
}

/** Download a completed video + thumbnail into the `generated-videos` bucket. */
export async function downloadAndStoreVideo(jobId: string): Promise<StoredVideoResult> {
  return downloadAndStoreOpenAIVideo(jobId);
}
