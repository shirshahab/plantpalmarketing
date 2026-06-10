"use server";

import { revalidateDashboard } from "@/lib/actions/shared";
import { runIvyAgent } from "@/lib/agents/ivy/run-ivy-agent";

export type IvyRunResult =
  | { ok: true; recommendationsCount: number; alertsCount: number }
  | { ok: false; error: string };

export async function runIvyMorningBrief(): Promise<IvyRunResult> {
  try {
    const result = await runIvyAgent();
    await revalidateDashboard();
    return {
      ok: true,
      recommendationsCount: result.recommendationsCount,
      alertsCount: result.alertsCount,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Ivy brief generation failed" };
  }
}
