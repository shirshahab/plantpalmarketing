"use server";

import { revalidateDashboard } from "@/lib/actions/shared";
import { runEchoAgent } from "@/lib/agents/echo/run-echo-agent";

export type EchoRunResult =
  | { ok: true; feedbackCount: number; featureRequestCount: number; churnRiskCount: number; loveSignalCount: number }
  | { ok: false; error: string };

export async function runEchoVoCScan(): Promise<EchoRunResult> {
  try {
    const result = await runEchoAgent();
    await revalidateDashboard();
    return { ok: true, ...result };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Echo VoC scan failed" };
  }
}
