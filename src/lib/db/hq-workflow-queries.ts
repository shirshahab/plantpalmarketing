import { createServerClient } from "@/lib/supabase";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import type { WorkflowChoreography } from "@/lib/hq/activity-to-choreography";
import { hqIdToSlug } from "@/lib/agents/agent-slugs";

export async function logHQWorkflowEvent(workflow: WorkflowChoreography) {
  const supabase = createServerClient();
  const now = new Date().toISOString();

  const row = {
    workflow_name: workflow.workflowName,
    source_agent: hqIdToSlug(workflow.sourceAgentId),
    target_agent: hqIdToSlug(workflow.targetAgentId),
    trigger_type: workflow.triggerType,
    trigger_id: workflow.triggerId,
    status: "active" as const,
    started_at: now,
    completed_at: null,
    metadata: {
      pathLabel: workflow.pathLabel,
      feedLabel: workflow.feedLabel,
    },
  };

  const { error } = await supabase.from("hq_workflow_events").insert(row);
  if (error) {
    if (isMissingTableError(error)) return { ok: false as const, reason: "table_missing" };
    console.error("[hq_workflow_events]", error.message);
    return { ok: false as const, reason: error.message };
  }

  return { ok: true as const };
}
