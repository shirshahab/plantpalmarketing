import {
  createCleanContentConcept,
  type CleanContentSource,
} from "@/lib/content/createCleanContentConcept";
import { enqueueVideoFromCleanConcept } from "@/lib/pipeline/creative-enqueue";

/** @deprecated Prefer createCleanContentConcept + enqueueVideoFromCleanConcept */
export type VideoConceptSource = CleanContentSource;
export type VideoConceptSourceType = CleanContentSource["sourceType"];

export interface VideoConceptOutput {
  title: string;
  concept: string;
  hook: string;
  platform: string;
  source_table: string;
  source_id: string;
  status: "pending";
  priority: number;
  metadata: Record<string, unknown>;
}

export function createVideoConceptFromSource(source: CleanContentSource): VideoConceptOutput | null {
  const concept = createCleanContentConcept(source, "video");
  if (!concept) return null;

  return {
    title: concept.title,
    concept: concept.angle,
    hook: concept.hook,
    platform: concept.platform ?? "tiktok",
    source_table: concept.source_table,
    source_id: concept.source_id,
    status: "pending",
    priority: concept.priority ?? 75,
    metadata: {
      source_type: concept.source_type,
      original_title: concept.original_title,
      original_url: concept.original_url,
      plant_relevance_score: concept.plant_relevance_score,
      approved_for_creative: true,
      approved_for_video: true,
      video_ready: true,
    },
  };
}

export async function enqueueVideoConceptFromSource(
  source: CleanContentSource
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const concept = createCleanContentConcept(source, "video");
  return enqueueVideoFromCleanConcept(concept, {
    sourceTable: source.sourceTable,
    sourceId: source.sourceId,
    title: source.rawTitle,
  });
}
