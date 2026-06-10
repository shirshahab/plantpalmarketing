"use server";

import { revalidateDashboard } from "@/lib/actions/shared";
import { runFernAgent } from "@/lib/agents/fern/run-fern-agent";

export type FernRunResult =
  | { ok: true; opportunitiesCount: number; experimentsCount: number; forecastsCount: number }
  | { ok: false; error: string };

export async function runFernAcquisitionScan(): Promise<FernRunResult> {
  try {
    const result = await runFernAgent();
    await revalidateDashboard();
    return { ok: true, ...result };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fern acquisition scan failed" };
  }
}
