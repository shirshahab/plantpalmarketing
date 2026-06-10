"use server";

import { logHQWorkflowEvent } from "@/lib/db/hq-workflow-queries";
import type { WorkflowChoreography } from "@/lib/hq/activity-to-choreography";

export async function recordHQWorkflowEvent(workflow: WorkflowChoreography) {
  try {
    return await logHQWorkflowEvent(workflow);
  } catch (e) {
    console.error("[recordHQWorkflowEvent]", e);
    return { ok: false as const, reason: "unexpected_error" };
  }
}
