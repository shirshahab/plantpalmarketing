"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
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

export async function sendIntelligenceAlertToContentAction(alertId: string): Promise<ActionResult> {
  try {
    const supabase = createServerClient();
    const { data: row, error } = await supabase
      .from("intelligence_alerts")
      .select("*")
      .eq("id", alertId)
      .maybeSingle();
    if (error || !row) return { ok: false, error: error?.message ?? "Alert not found" };

    await supabase.from("creative_content_ideas").insert({
      title: String(row.title).slice(0, 120) || "F5Bot content idea",
      content_type: "educational",
      format: "social",
      hook: String(row.body).slice(0, 180),
      body: `${String(row.body)}\n\nSource: ${String(row.url)}`,
      status: "pending",
    });

    await supabase
      .from("intelligence_alerts")
      .update({ status: "routed", assigned_agent: "bloom", classification: "content_idea" })
      .eq("id", alertId);

    revalidatePath("/intelligence");
    revalidatePath("/creative");
    revalidatePath("/inbox");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
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
