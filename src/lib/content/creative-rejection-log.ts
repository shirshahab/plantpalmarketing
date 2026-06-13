import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import type { Json } from "@/lib/supabase/database.types";

export const CREATIVE_REJECTION_MESSAGE = "Raw signal blocked. Send to Bloom first.";

export async function logCreativeRoutingRejection(input: {
  sourceTable: string;
  sourceId?: string;
  title: string;
  targetQueue: "video" | "image";
  reason?: string;
  rawPayload?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("intelligence_rejected").insert({
      source: input.sourceTable,
      source_type: "creative_routing",
      title: input.title.slice(0, 500),
      body: input.reason ?? CREATIVE_REJECTION_MESSAGE,
      url: "",
      reject_reason: input.reason ?? CREATIVE_REJECTION_MESSAGE,
      reject_category: "creative_routing_blocked",
      alert_name: input.targetQueue,
      detected_keywords: [input.targetQueue, input.sourceTable],
      raw_payload: {
        target_queue: input.targetQueue,
        source_table: input.sourceTable,
        source_id: input.sourceId,
        ...(input.rawPayload ?? {}),
      } as Json,
    });
    if (error && !isMissingTableError(error)) {
      console.warn("[creative-routing] rejection log failed:", error.message);
    }
  } catch {
    console.warn("[creative-routing] rejection log failed");
  }
}
