import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import type { Json } from "@/lib/supabase/database.types";
import {
  CREATIVE_CLEANUP_REJECTION,
  isBadCreativeQueueRow,
  type CreativeQueueMetadata,
} from "@/lib/content/creative-routing-guard";
import { deleteOrRejectDemoRows } from "@/lib/pipeline/demo-audit";

export interface HqCleanupResult {
  badVideoRowsRejected: number;
  badImageRowsRejected: number;
  demoRowsDeleted: number;
  rawCreativeRowsBlocked: number;
  errors: string[];
}

function parseMetadata(raw: unknown): CreativeQueueMetadata {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as CreativeQueueMetadata;
  }
  return {};
}

export async function rejectBadVideoRows(): Promise<{ rejected: number; error?: string }> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("video_generation_queue")
      .select("*")
      .neq("status", "rejected")
      .limit(500);

    if (error) {
      if (isMissingTableError(error)) return { rejected: 0, error: "video_generation_queue missing." };
      return { rejected: 0, error: error.message };
    }

    let rejected = 0;
    for (const row of data ?? []) {
      const r = row as Record<string, unknown>;
      const title = String(r.title ?? "");
      const table = String(r.source_table ?? "").toLowerCase();
      const meta = parseMetadata(r.metadata);
      if (!isBadCreativeQueueRow("video", title, table, meta)) continue;

      const { error: updateError } = await supabase
        .from("video_generation_queue")
        .update({
          status: "rejected",
          metadata: { ...meta, rejected_reason: CREATIVE_CLEANUP_REJECTION } as Json,
          updated_at: new Date().toISOString(),
        })
        .eq("id", String(r.id));

      if (!updateError) rejected += 1;
    }
    return { rejected };
  } catch (e) {
    return { rejected: 0, error: e instanceof Error ? e.message : "Video cleanup failed" };
  }
}

export async function rejectBadImageRows(): Promise<{ rejected: number; error?: string }> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("image_prompts")
      .select("*")
      .neq("status", "rejected")
      .limit(500);

    if (error) {
      if (isMissingTableError(error)) return { rejected: 0, error: "image_prompts missing." };
      return { rejected: 0, error: error.message };
    }

    let rejected = 0;
    for (const row of data ?? []) {
      const r = row as Record<string, unknown>;
      const title = String(r.title ?? "");
      const table = String(r.source_table ?? "").toLowerCase();
      const meta = parseMetadata(r.metadata);
      if (!isBadCreativeQueueRow("image", title, table, meta)) continue;

      const { error: updateError } = await supabase
        .from("image_prompts")
        .update({
          status: "rejected",
          metadata: { ...meta, rejected_reason: CREATIVE_CLEANUP_REJECTION } as Json,
          updated_at: new Date().toISOString(),
        })
        .eq("id", String(r.id));

      if (!updateError) rejected += 1;
    }
    return { rejected };
  } catch (e) {
    return { rejected: 0, error: e instanceof Error ? e.message : "Image cleanup failed" };
  }
}

export async function runHqCleanup(): Promise<HqCleanupResult> {
  const errors: string[] = [];
  const [video, image, demo] = await Promise.all([
    rejectBadVideoRows(),
    rejectBadImageRows(),
    deleteOrRejectDemoRows(),
  ]);

  if (video.error) errors.push(video.error);
  if (image.error) errors.push(image.error);
  errors.push(...demo.errors);

  return {
    badVideoRowsRejected: video.rejected,
    badImageRowsRejected: image.rejected,
    demoRowsDeleted: demo.deleted + demo.rejected,
    rawCreativeRowsBlocked: video.rejected + image.rejected,
    errors,
  };
}
