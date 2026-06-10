"use server";

import { revalidatePath } from "next/cache";
import { runAgentManually, runScheduledAgentBatch } from "@/lib/agent-worker/worker";
import type { SchedulableAgent } from "@/lib/agent-worker/types";

export type AgentOpsActionResult =
  | { ok: true; message: string; itemsProcessed?: number }
  | { ok: false; error: string };

export async function triggerAgentManually(agentId: SchedulableAgent): Promise<AgentOpsActionResult> {
  try {
    const result = await runAgentManually(agentId);
    revalidatePath("/agent-operations");
    revalidatePath("/", "layout");

    if (result.status === "failed") {
      return { ok: false, error: result.error ?? `${agentId} run failed` };
    }
    if (result.status === "skipped") {
      return { ok: true, message: `${agentId} skipped — no work pending`, itemsProcessed: 0 };
    }
    return {
      ok: true,
      message: `${agentId} completed — ${result.itemsProcessed} items processed (approval still required for outbound actions)`,
      itemsProcessed: result.itemsProcessed,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Manual run failed" };
  }
}

export async function triggerScheduledBatch(): Promise<
  | { ok: true; triggered: number; skipped: number; errors: string[] }
  | { ok: false; error: string }
> {
  try {
    const batch = await runScheduledAgentBatch("manual");
    revalidatePath("/agent-operations");
    revalidatePath("/", "layout");
    return {
      ok: true,
      triggered: batch.triggered.length,
      skipped: batch.skipped.length,
      errors: batch.errors,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Batch run failed" };
  }
}
