"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidateDashboard } from "@/lib/actions/shared";
import { runDailyContentPipeline } from "@/lib/agents/run-pipeline";
import { syncApprovalQueueItemToCalendar } from "@/lib/content-calendar/sync";
import { isOpenAIConfigured } from "@/lib/openai/config";
import type { PipelineStatus } from "@/lib/types";

export type PipelineRunActionResult =
  | {
      ok: true;
      briefId: string;
      discoveryCount: number;
      contentCount: number;
      approvedCount: number;
      rejectedCount: number;
      approvalQueueCount: number;
    }
  | { ok: false; error: string };

export async function runDailyContentAgents(): Promise<PipelineRunActionResult> {
  if (!isOpenAIConfigured()) {
    return { ok: false, error: "OpenAI not configured. Add OPENAI_API_KEY to .env.local" };
  }

  try {
    const result = await runDailyContentPipeline();
    await revalidateDashboard();
    return { ok: true, ...result };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Daily pipeline failed",
    };
  }
}

export async function updatePipelineStatus(
  id: string,
  status: PipelineStatus
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("pipeline_content").update({ status }).eq("id", id);
    if (error) return { ok: false, error: error.message };

    if (status === "approved" || status === "rejected") {
      const { data: approvalRows } = await supabase
        .from("approval_queue")
        .update({ status: status === "approved" ? "approved" : "rejected" })
        .eq("source_id", id)
        .select("id");
      for (const row of approvalRows ?? []) {
        await syncApprovalQueueItemToCalendar(row.id, status === "approved");
      }
    }

    await revalidateDashboard();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Update failed" };
  }
}
