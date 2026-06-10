"use server";

import { revalidateDashboard } from "@/lib/actions/shared";
import { runSageAgent } from "@/lib/agents/sage/run-sage-agent";
import { SAGE_PASS_THRESHOLD } from "@/lib/agents/sage/mock-scorer";

export type SageRunResult =
  | {
      ok: true;
      batchId: string;
      piecesReviewed: number;
      approvedCount: number;
      rejectedCount: number;
      avgAggregateScore: number;
      approvalQueueCount: number;
      passThreshold: number;
    }
  | { ok: false; error: string };

export async function runSageReview(): Promise<SageRunResult> {
  try {
    const result = await runSageAgent();
    await revalidateDashboard();
    return { ok: true, ...result, passThreshold: SAGE_PASS_THRESHOLD };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Sage review failed" };
  }
}
