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
