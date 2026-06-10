"use server";

import { revalidateDashboard } from "@/lib/actions/shared";
import { runAtlasAgent } from "@/lib/agents/atlas/run-atlas-agent";

export type AtlasRunResult =
  | { ok: true; recommendationsCount: number; experimentsCount: number; bottlenecksCount: number }
  | { ok: false; error: string };

export async function runAtlasGrowthBrief(): Promise<AtlasRunResult> {
  try {
    const result = await runAtlasAgent();
    await revalidateDashboard();
    return {
      ok: true,
      recommendationsCount: result.recommendationsCount,
      experimentsCount: result.experimentsCount,
      bottlenecksCount: result.bottlenecksCount,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Atlas growth brief failed" };
  }
}
