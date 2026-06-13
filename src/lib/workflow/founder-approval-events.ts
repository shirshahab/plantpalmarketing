import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import type { WorkflowStage } from "@/lib/workflow/types";

export async function recordFounderApprovalEvent(input: {
  itemId: string;
  sourceTable: string;
  fromStage: WorkflowStage;
  toStage: WorkflowStage;
  fromOwner: string;
  toOwner: string;
  destinationUrl: string;
}): Promise<void> {
  const now = new Date().toISOString();
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("hq_workflow_events").insert({
      workflow_name: "FOUNDERS_APPROVED_IDEA",
      source_agent: input.fromOwner,
      target_agent: input.toOwner,
      trigger_type: "FOUNDERS_APPROVED_IDEA",
      trigger_id: input.itemId,
      status: "completed",
      started_at: now,
      completed_at: now,
      metadata: {
        item_id: input.itemId,
        source_table: input.sourceTable,
        from_stage: input.fromStage,
        to_stage: input.toStage,
        from_owner: input.fromOwner,
        to_owner: input.toOwner,
        destination_url: input.destinationUrl,
        created_at: now,
      },
    });
    if (error && !isMissingTableError(error)) {
      console.error("[FOUNDERS_APPROVED_IDEA]", error.message);
    }
  } catch {
    // non-blocking
  }
}
