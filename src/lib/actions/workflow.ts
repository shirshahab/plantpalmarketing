"use server";

import { getContentWorkflow } from "@/lib/workflow/engine";
import type { WorkflowHistoryEntry } from "@/lib/workflow/types";

/** Server action for the workflow history panel (client-safe read). */
export async function getWorkflowHistory(
  sourceTable: string,
  sourceId: string
): Promise<WorkflowHistoryEntry[]> {
  const row = await getContentWorkflow(sourceTable, sourceId);
  return row?.historyLog ?? [];
}
