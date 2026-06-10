"use server";

import { revalidateDashboard } from "@/lib/actions/shared";
import { runSentinelAgent } from "@/lib/agents/sentinel/run-sentinel-agent";
import { createServerClient } from "@/lib/supabase/server";

export type SentinelRunResult =
  | { ok: true; competitorsScanned: number; alertsGenerated: number; briefId: string; approvalQueueCount: number }
  | { ok: false; error: string };

export async function runSentinelScan(): Promise<SentinelRunResult> {
  try {
    const result = await runSentinelAgent();
    await revalidateDashboard();
    return { ok: true, ...result };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Sentinel scan failed" };
  }
}

export async function acknowledgeIntelAlert(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("competitor_intel_alerts")
      .update({ status: "acknowledged" })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    await revalidateDashboard();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Update failed" };
  }
}

export async function dismissIntelAlert(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("competitor_intel_alerts")
      .update({ status: "dismissed" })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    await revalidateDashboard();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Update failed" };
  }
}
