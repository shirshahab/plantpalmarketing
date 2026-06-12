"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { pollF5BotAlerts, processF5BotAlert } from "@/lib/intelligence/f5bot";
import { recordHandoff } from "@/lib/collaboration/handoff";
import type { ActionResult } from "@/lib/actions/shared";

export async function fetchLatestF5BotAlertsAction(): Promise<
  ActionResult & { counts?: Record<string, number> }
> {
  try {
    const result = await pollF5BotAlerts();
    revalidatePath("/intelligence");
    revalidatePath("/inbox");
    revalidatePath("/admin/setup-health");
    return {
      ok: true,
      counts: {
        fetched: result.fetched,
        inserted: result.inserted,
        duplicates: result.duplicates,
        processed: result.processed,
        failed: result.failed,
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Poll failed" };
  }
}

export async function ignoreF5BotAlertAction(alertId: string): Promise<ActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("f5bot_alerts")
      .update({ status: "ignored" })
      .eq("id", alertId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/intelligence");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function sendF5BotAlertToAgentAction(
  alertId: string,
  agent: "roots" | "bloom" | "sentinel"
): Promise<ActionResult> {
  try {
    const supabase = createServerClient();
    const { data: row, error } = await supabase
      .from("f5bot_alerts")
      .select("*")
      .eq("id", alertId)
      .maybeSingle();
    if (error || !row) return { ok: false, error: error?.message ?? "Alert not found" };

    const taskType =
      agent === "sentinel" ? "competitor_analysis" : agent === "bloom" ? "content_brief" : "community_response";

    await recordHandoff({
      fromAgent: "scout",
      toAgent: agent,
      workflowName: `F5Bot → ${agent}`,
      triggerType: "f5bot_manual",
      triggerId: alertId,
      taskType,
      taskDescription: `Manual route: ${String(row.title).slice(0, 100)}`,
      priority: "high",
      messageTitle: `F5Bot alert sent to ${agent}`,
      messageBody: String(row.body).slice(0, 400),
      activityDetail: `Founder manually routed F5Bot alert to ${agent}`,
      metadata: { source_url: row.source_url },
    });

    if (row.status === "new") {
      await processF5BotAlert(alertId);
    }

    revalidatePath("/intelligence");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createContentIdeaFromAlertAction(alertId: string): Promise<ActionResult> {
  try {
    await processF5BotAlert(alertId);
    revalidatePath("/intelligence");
    revalidatePath("/creative");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createReplyDraftFromAlertAction(alertId: string): Promise<ActionResult> {
  return sendF5BotAlertToAgentAction(alertId, "roots");
}
