"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { getTrendClusterById } from "@/lib/intelligence/trend-cluster-detail";
import type { ActionResult } from "@/lib/actions/shared";

export async function archiveTrendClusterAlertsAction(alertIds: string[]): Promise<ActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("intelligence_alerts")
      .update({ status: "archived" })
      .in("id", alertIds);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/intelligence");
    return { ok: true, message: "Alerts archived" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function sendTrendClusterToBloomAction(clusterId: string, alertIds: string[]): Promise<ActionResult> {
  const cluster = await getTrendClusterById(clusterId);
  if (!cluster) return { ok: false, error: "Cluster not found" };
  try {
    const supabase = createServerClient();
    await supabase.from("creative_content_ideas").insert({
      title: `${cluster.label} content package`,
      content_type: "educational",
      format: "social",
      hook: cluster.alerts[0]?.title.slice(0, 120) ?? cluster.label,
      body: cluster.alerts.map((a) => a.title).join("\n"),
      status: "pending",
    });
    await supabase.from("intelligence_alerts").update({ assigned_agent: "bloom", classification: "content_idea" }).in("id", alertIds);
    revalidatePath("/bloom");
    revalidatePath("/content");
    return { ok: true, message: "Sent to Bloom" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function sendTrendClusterToSeoAction(clusterId: string, alertIds: string[]): Promise<ActionResult> {
  const cluster = await getTrendClusterById(clusterId);
  if (!cluster) return { ok: false, error: "Cluster not found" };
  try {
    const supabase = createServerClient();
    await supabase.from("seo_blog_keywords").insert({
      keyword: cluster.label.toLowerCase(),
      topic_cluster: "trend cluster",
      source: "intelligence",
      priority_score: 75,
      status: "queued",
    });
    await supabase.from("intelligence_alerts").update({ assigned_agent: "petal", classification: "seo_topic" }).in("id", alertIds);
    revalidatePath("/seo");
    return { ok: true, message: "Sent to SEO" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function sendTrendClusterToCalendarAction(clusterId: string, alertIds: string[]): Promise<ActionResult> {
  const cluster = await getTrendClusterById(clusterId);
  if (!cluster) return { ok: false, error: "Cluster not found" };
  try {
    const supabase = createServerClient();
    await supabase.from("content_calendar").insert({
      title: cluster.label,
      caption: cluster.alerts[0]?.body?.slice(0, 280) ?? cluster.label,
      platform: "instagram",
      status: "draft",
    });
    if (alertIds.length > 0) {
      await supabase.from("intelligence_alerts").update({ assigned_agent: "sprout" }).in("id", alertIds);
    }
    revalidatePath("/calendar");
    return { ok: true, message: "Sent to Content Calendar" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
