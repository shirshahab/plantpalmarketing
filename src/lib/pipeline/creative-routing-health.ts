import { createServerClient } from "@/lib/supabase/server";
import {
  isPollutedCreativeTitle,
  isRawCreativeQueueRow,
  isVisibleCreativeQueueItem,
  creativeSourceLabel,
  RAW_CREATIVE_BLOCKED_SOURCES,
  type CreativeQueueMetadata,
} from "@/lib/content/creative-routing-guard";

export interface CreativeRoutingHealth {
  status: "healthy" | "broken";
  rawVideoCount: number;
  rawImageCount: number;
  message: string;
}

function parseMetadata(raw: unknown): CreativeQueueMetadata {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as CreativeQueueMetadata;
  }
  return {};
}

export async function getCreativeRoutingHealth(): Promise<CreativeRoutingHealth> {
  try {
    const supabase = createServerClient();
    const [videoRes, imageRes] = await Promise.all([
      supabase
        .from("video_generation_queue")
        .select("source_table, title, metadata, status")
        .neq("status", "rejected")
        .limit(300),
      supabase
        .from("image_prompts")
        .select("source_table, title, metadata, status")
        .neq("status", "rejected")
        .limit(300),
    ]);

    let rawVideoCount = 0;
    let rawImageCount = 0;

    for (const row of videoRes.data ?? []) {
      const r = row as Record<string, unknown>;
      const meta = parseMetadata(r.metadata);
      const table = String(r.source_table ?? "");
      const title = String(r.title ?? "");
      if (
        isRawCreativeQueueRow(table, title, meta) ||
        RAW_CREATIVE_BLOCKED_SOURCES.has(table.toLowerCase()) ||
        isPollutedCreativeTitle(title)
      ) {
        rawVideoCount += 1;
      }
    }

    for (const row of imageRes.data ?? []) {
      const r = row as Record<string, unknown>;
      const meta = parseMetadata(r.metadata);
      const table = String(r.source_table ?? "");
      const title = String(r.title ?? "");
      if (
        isRawCreativeQueueRow(table, title, meta) ||
        RAW_CREATIVE_BLOCKED_SOURCES.has(table.toLowerCase()) ||
        isPollutedCreativeTitle(title) ||
        (!meta.image_ready && !meta.approved_for_creative && table === "")
      ) {
        rawImageCount += 1;
      }
    }

    const total = rawVideoCount + rawImageCount;
    return {
      status: total === 0 ? "healthy" : "broken",
      rawVideoCount,
      rawImageCount,
      message:
        total === 0
          ? "No raw signals in video/image queues"
          : `${rawVideoCount} video + ${rawImageCount} image rows need cleanup — send to Bloom first`,
    };
  } catch {
    return {
      status: "broken",
      rawVideoCount: 0,
      rawImageCount: 0,
      message: "Could not scan creative queues",
    };
  }
}

export function isVisibleImagePromptRow(row: {
  title: string;
  status: string;
  sourceTable?: string;
  metadata?: CreativeQueueMetadata;
}): boolean {
  return isVisibleCreativeQueueItem(
    "image",
    row.status,
    row.sourceTable ?? "",
    row.title,
    row.metadata ?? null
  );
}

export { creativeSourceLabel, isVisibleCreativeQueueItem, isPollutedCreativeTitle };
