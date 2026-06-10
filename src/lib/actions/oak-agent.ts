"use server";

import { revalidateDashboard } from "@/lib/actions/shared";
import { runOakAgent } from "@/lib/agents/oak/run-oak-agent";
import { createServerClient } from "@/lib/supabase/server";
import type { OakPipelineStage } from "@/lib/types";

export type OakRunResult =
  | { ok: true; converted: number; outreachQueued: number; skipped: number }
  | { ok: false; error: string };

export async function runOakPartnershipScan(): Promise<OakRunResult> {
  try {
    const result = await runOakAgent();
    await revalidateDashboard();
    return { ok: true, ...result };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Oak scan failed" };
  }
}

export async function updateOakDealStage(
  id: string,
  stage: OakPipelineStage
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("oak_partnership_pipeline").update({ stage }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    await revalidateDashboard();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Update failed" };
  }
}

export async function approveOakOutreach(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("oak_partnership_pipeline")
      .update({ outreach_approved: true, stage: "contacted" })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };

    await supabase.from("agent_activity_log").insert({
      agent_id: "oak",
      action: "outreach_approved",
      detail: "Outreach approved — ready to send manually (no auto-outreach)",
      metadata: { deal_id: id },
    });

    await revalidateDashboard();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Approve failed" };
  }
}
