"use server";

import { revalidateDashboard } from "@/lib/actions/shared";
import { runBloomAgent, TOTAL_DAILY_PIECES } from "@/lib/agents/bloom/run-bloom-agent";
import { createServerClient } from "@/lib/supabase/server";
import type { BloomPieceStatus } from "@/lib/types";

export type BloomRunResult =
  | {
      ok: true;
      runId: string;
      piecesGenerated: number;
      piecesAwaitingReview: number;
      scoutInputs: number;
      rootsInputs: number;
      sentinelInputs: number;
      seasonalInputs: number;
      dailyTarget: number;
    }
  | { ok: false; error: string };

export async function runBloomProduction(): Promise<BloomRunResult> {
  try {
    const result = await runBloomAgent();
    await revalidateDashboard();
    return { ok: true, ...result, dailyTarget: TOTAL_DAILY_PIECES };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Bloom production failed" };
  }
}

export async function updateBloomPieceStatus(
  id: string,
  status: BloomPieceStatus
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("bloom_content_pieces").update({ status }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    await revalidateDashboard();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Update failed" };
  }
}
