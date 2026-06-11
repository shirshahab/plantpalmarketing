import { createServerClient } from "@/lib/supabase";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import type { Json } from "@/lib/supabase/database.types";

export interface GeneratedAsset {
  id: string;
  promptId: string | null;
  calendarItemId: string | null;
  platform: string;
  assetType: string;
  imageUrl: string;
  thumbnailUrl: string;
  generationProvider: string;
  generationModel: string;
  prompt: string;
  status: string;
  reviewFeedback: string;
  revisionNotes: string;
  selected: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedVideo {
  id: string;
  scriptId: string | null;
  calendarItemId: string | null;
  platform: string;
  videoUrl: string;
  thumbnailUrl: string;
  script: string;
  hook: string;
  scenes: { label: string; description: string }[];
  voiceover: string;
  onScreenText: string[];
  caption: string;
  cta: string;
  status: string;
  reviewFeedback: string;
  revisionNotes: string;
  generationProvider: string;
  generationModel: string;
  jobId: string;
  errorMessage: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

function asRecord(value: Json): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asScenes(value: Json): { label: string; description: string }[] {
  if (!Array.isArray(value)) return [];
  return value.map((s) => {
    const o = (s && typeof s === "object" ? s : {}) as Record<string, unknown>;
    return { label: String(o.label ?? ""), description: String(o.description ?? "") };
  });
}

function asStringArray(value: Json): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

export async function getGeneratedAssets(): Promise<GeneratedAsset[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("generated_assets")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    promptId: row.prompt_id,
    calendarItemId: row.calendar_item_id,
    platform: row.platform,
    assetType: row.asset_type,
    imageUrl: row.image_url,
    thumbnailUrl: row.thumbnail_url,
    generationProvider: row.generation_provider,
    generationModel: row.generation_model,
    prompt: row.prompt,
    status: row.status,
    reviewFeedback: row.review_feedback,
    revisionNotes: row.revision_notes,
    selected: row.selected,
    metadata: asRecord(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/** Latest generated asset per image prompt id. */
export async function getAssetsByPrompt(): Promise<Map<string, GeneratedAsset>> {
  const assets = await getGeneratedAssets();
  const byPrompt = new Map<string, GeneratedAsset>();
  for (const asset of assets) {
    if (asset.promptId && !byPrompt.has(asset.promptId)) byPrompt.set(asset.promptId, asset);
  }
  return byPrompt;
}

export async function getGeneratedVideos(): Promise<GeneratedVideo[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("generated_videos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    scriptId: row.script_id,
    calendarItemId: row.calendar_item_id,
    platform: row.platform,
    videoUrl: row.video_url,
    thumbnailUrl: row.thumbnail_url,
    script: row.script,
    hook: row.hook,
    scenes: asScenes(row.scenes),
    voiceover: row.voiceover,
    onScreenText: asStringArray(row.on_screen_text),
    caption: row.caption,
    cta: row.cta,
    status: row.status,
    reviewFeedback: row.review_feedback,
    revisionNotes: row.revision_notes,
    generationProvider: row.generation_provider,
    generationModel: row.generation_model,
    jobId: row.job_id ?? "",
    errorMessage: row.error_message ?? "",
    metadata: asRecord(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/** Latest generated video per video script id. */
export async function getVideosByScript(): Promise<Map<string, GeneratedVideo>> {
  const videos = await getGeneratedVideos();
  const byScript = new Map<string, GeneratedVideo>();
  for (const video of videos) {
    if (video.scriptId && !byScript.has(video.scriptId)) byScript.set(video.scriptId, video);
  }
  return byScript;
}
