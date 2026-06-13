"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { enqueueApprovedIdea } from "@/lib/pipeline/content-pipeline";
import { ensureContentWorkflow } from "@/lib/workflow/engine";
import type { ActionResult } from "@/lib/actions/shared";

export async function archiveIntelligenceAlertAction(alertId: string): Promise<ActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("intelligence_alerts")
      .update({ status: "archived" })
      .eq("id", alertId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/intelligence");
    revalidatePath("/inbox");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function rejectIntelligenceAlertAction(alertId: string): Promise<ActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("intelligence_alerts")
      .update({ status: "ignored" })
      .eq("id", alertId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/intelligence");
    revalidatePath("/inbox");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

/** Route intelligence signal to Bloom via content_pipeline — never direct to creative studios. */
export async function sendIntelligenceAlertToBloomAction(alertId: string): Promise<ActionResult & { destination?: string }> {
  try {
    const supabase = createServerClient();
    const { data: row, error } = await supabase
      .from("intelligence_alerts")
      .select("*")
      .eq("id", alertId)
      .maybeSingle();
    if (error || !row) return { ok: false, error: error?.message ?? "Alert not found" };

    const title = String(row.title).slice(0, 120) || "Intelligence signal";
    const body = `${String(row.body ?? "")}\n\nSource: ${String(row.url ?? "")}`;

    const pipelineRow = await enqueueApprovedIdea({
      sourceTable: "intelligence_alerts",
      sourceId: alertId,
      title,
      body,
    });

    if (!pipelineRow) {
      return { ok: false, error: "Could not enqueue to content pipeline. Check migration 064." };
    }

    await ensureContentWorkflow({
      sourceTable: "intelligence_alerts",
      sourceId: alertId,
      contentType: "intelligence",
      title,
      stage: "WITH_AGENT",
      assignedAgent: "bloom",
      initialEvent: "Sent to Bloom from Founder Inbox",
      actor: "founder",
      destinationLabel: "Bloom",
    });

    await supabase
      .from("intelligence_alerts")
      .update({ status: "routed", assigned_agent: "bloom", classification: "content_idea" })
      .eq("id", alertId);

    revalidatePath("/intelligence");
    revalidatePath("/bloom");
    revalidatePath("/agents/pipeline");
    revalidatePath("/content-pipeline");
    revalidatePath("/inbox");
    revalidatePath("/");
    return { ok: true, destination: "/bloom", message: "Sent to Bloom" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

/** @deprecated Use sendIntelligenceAlertToBloomAction */
export async function sendIntelligenceAlertToContentAction(alertId: string): Promise<ActionResult> {
  return sendIntelligenceAlertToBloomAction(alertId);
}

export async function generateDailyIntelligenceBriefAction(): Promise<ActionResult & { brief?: unknown }> {
  try {
    const { generateDailyIntelligenceBrief } = await import("@/lib/intelligence/daily-intelligence-brief");
    const brief = await generateDailyIntelligenceBrief();
    if (!brief) return { ok: false, error: "No intelligence data — ingest F5Bot alerts first" };
    revalidatePath("/daily-report");
    revalidatePath("/intelligence");
    return { ok: true, brief };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
