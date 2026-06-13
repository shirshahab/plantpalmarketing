import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import type { Json } from "@/lib/supabase/database.types";
import {
  canEnqueueToCreativeQueue,
  isPollutedCreativeTitle,
  validateCleanConcept,
  type CreativeQueueMetadata,
} from "@/lib/content/creative-routing-guard";
import {
  CREATIVE_REJECTION_MESSAGE,
  logCreativeRoutingRejection,
} from "@/lib/content/creative-rejection-log";
import type { CleanContentConcept } from "@/lib/content/createCleanContentConcept";
import type { ImagePromptCategory } from "@/lib/types";

function buildMetadata(concept: CleanContentConcept, queue: "video" | "image"): CreativeQueueMetadata {
  return {
    source_type: concept.source_type,
    original_title: concept.original_title,
    original_url: concept.original_url,
    plant_relevance_score: concept.plant_relevance_score,
    approved_for_creative: true,
    angle: concept.angle,
    ...(queue === "video"
      ? { video_ready: true, approved_for_video: true }
      : { image_ready: true, approved_for_image: true }),
  };
}

export async function enqueueVideoFromCleanConcept(
  concept: CleanContentConcept | null,
  fallbackSource?: { sourceTable: string; sourceId?: string; title: string }
): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!concept) {
    if (fallbackSource) {
      await logCreativeRoutingRejection({
        sourceTable: fallbackSource.sourceTable,
        sourceId: fallbackSource.sourceId,
        title: fallbackSource.title,
        targetQueue: "video",
      });
    }
    return { ok: false, error: CREATIVE_REJECTION_MESSAGE };
  }

  const validationError = validateCleanConcept({
    title: concept.title,
    angle: concept.angle,
    hook: concept.hook,
    source_type: concept.source_type,
    approved_for_creative: concept.approved_for_creative,
  });
  if (validationError) {
    await logCreativeRoutingRejection({
      sourceTable: concept.source_table,
      sourceId: concept.source_id,
      title: concept.original_title,
      targetQueue: "video",
      reason: validationError,
    });
    return { ok: false, error: CREATIVE_REJECTION_MESSAGE };
  }

  const metadata = buildMetadata(concept, "video");
  if (!canEnqueueToCreativeQueue("video", concept.source_table, metadata)) {
    await logCreativeRoutingRejection({
      sourceTable: concept.source_table,
      sourceId: concept.source_id,
      title: concept.original_title,
      targetQueue: "video",
    });
    return { ok: false, error: CREATIVE_REJECTION_MESSAGE };
  }

  if (isPollutedCreativeTitle(concept.title)) {
    await logCreativeRoutingRejection({
      sourceTable: concept.source_table,
      sourceId: concept.source_id,
      title: concept.original_title,
      targetQueue: "video",
      reason: "Polluted title after transformation",
    });
    return { ok: false, error: CREATIVE_REJECTION_MESSAGE };
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("video_generation_queue")
      .insert({
        title: concept.title,
        concept: concept.angle,
        hook: concept.hook,
        platform: concept.platform ?? "tiktok",
        status: "pending",
        priority: concept.priority ?? 75,
        source_table: concept.source_table,
        source_id: concept.source_id,
        metadata: metadata as Json,
      })
      .select("id")
      .single();

    if (error) {
      if (isMissingTableError(error)) return { ok: false, error: "video_generation_queue missing." };
      return { ok: false, error: error.message };
    }
    return { ok: true, id: String(data.id) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Insert failed" };
  }
}

export async function enqueueImageFromCleanConcept(
  concept: CleanContentConcept | null,
  fallbackSource?: { sourceTable: string; sourceId?: string; title: string }
): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!concept) {
    if (fallbackSource) {
      await logCreativeRoutingRejection({
        sourceTable: fallbackSource.sourceTable,
        sourceId: fallbackSource.sourceId,
        title: fallbackSource.title,
        targetQueue: "image",
      });
    }
    return { ok: false, error: CREATIVE_REJECTION_MESSAGE };
  }

  const validationError = validateCleanConcept({
    title: concept.title,
    angle: concept.angle,
    hook: concept.hook,
    source_type: concept.source_type,
    approved_for_creative: concept.approved_for_creative,
  });
  if (validationError) {
    await logCreativeRoutingRejection({
      sourceTable: concept.source_table,
      sourceId: concept.source_id,
      title: concept.original_title,
      targetQueue: "image",
      reason: validationError,
    });
    return { ok: false, error: CREATIVE_REJECTION_MESSAGE };
  }

  const metadata = buildMetadata(concept, "image");
  if (!canEnqueueToCreativeQueue("image", concept.source_table, metadata)) {
    await logCreativeRoutingRejection({
      sourceTable: concept.source_table,
      sourceId: concept.source_id,
      title: concept.original_title,
      targetQueue: "image",
    });
    return { ok: false, error: CREATIVE_REJECTION_MESSAGE };
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("image_prompts")
      .insert({
        title: concept.title,
        category: (concept.category ?? "social_graphic") as ImagePromptCategory,
        prompt: concept.prompt ?? concept.angle,
        style: concept.style ?? "Bloom gate",
        status: "pending",
        source_table: concept.source_table,
        source_id: concept.source_id,
        metadata: metadata as Json,
      })
      .select("id")
      .single();

    if (error) {
      if (isMissingTableError(error)) return { ok: false, error: "image_prompts missing." };
      return { ok: false, error: error.message };
    }
    return { ok: true, id: String(data.id) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Insert failed" };
  }
}
