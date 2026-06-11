import { createServerClient } from "@/lib/supabase";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import { mapAgentActivityLog, mapIvyAlert, mapIvyBrief, mapIvyRecommendation } from "@/lib/supabase/mappers";
import type { IvyBriefType, IvyRecommendationCategory } from "@/lib/types";

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export async function getLatestIvyBrief(type: IvyBriefType) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("ivy_briefs")
    .select("*")
    .eq("brief_type", type)
    .order("run_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    if (isMissingTableError(error)) return null;
    throw new Error(error.message);
  }
  return data ? mapIvyBrief(data) : null;
}

export async function getIvyRecommendations(date?: string, category?: IvyRecommendationCategory) {
  const supabase = createServerClient();
  let query = supabase
    .from("ivy_recommendations")
    .select("*")
    .eq("brief_date", date ?? todayDateString())
    .order("priority_score", { ascending: false });
  if (category) query = query.eq("category", category);
  const { data, error } = await query;
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map(mapIvyRecommendation);
}

export async function getIvyAlerts(date?: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("ivy_alerts")
    .select("*")
    .eq("brief_date", date ?? todayDateString())
    .eq("status", "active")
    .order("priority_score", { ascending: false });
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map(mapIvyAlert);
}

export async function getIvyActivity(limit = 10) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("agent_activity_log")
    .select("*")
    .eq("agent_id", "ivy")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAgentActivityLog);
}

export async function getIvyStats() {
  const today = todayDateString();
  const [recommendations, alerts, dailyBrief] = await Promise.all([
    getIvyRecommendations(today),
    getIvyAlerts(today),
    getLatestIvyBrief("daily"),
  ]);

  const byCategory = {
    roi_action: 0,
    threat: 0,
    approval: 0,
    growth_opportunity: 0,
  };
  for (const r of recommendations) {
    if (r.category in byCategory) byCategory[r.category as keyof typeof byCategory]++;
  }

  return {
    totalRecommendations: recommendations.length,
    pendingUrgentAlerts: alerts.filter((a) => a.alertType === "urgent").length,
    activeAlerts: alerts.length,
    byCategory,
    hasDailyBrief: !!dailyBrief,
    topPriorityScore: recommendations[0]?.priorityScore ?? 0,
    lastBriefDate: dailyBrief?.runDate ?? null,
  };
}

export async function getIvyActionCenter(date?: string) {
  const recommendations = await getIvyRecommendations(date);
  return {
    roiActions: recommendations.filter((r) => r.category === "roi_action").slice(0, 3),
    threats: recommendations.filter((r) => r.category === "threat").slice(0, 3),
    approvals: recommendations.filter((r) => r.category === "approval").slice(0, 3),
    growthOpportunities: recommendations.filter((r) => r.category === "growth_opportunity").slice(0, 3),
  };
}

export async function getIvyHQData() {
  const [ivyStats, ivyActivity, dailyBrief, weeklyBrief, recommendations, alerts, actionCenter] =
    await Promise.all([
      getIvyStats(),
      getIvyActivity(8),
      getLatestIvyBrief("daily"),
      getLatestIvyBrief("weekly"),
      getIvyRecommendations().then((r) => r.slice(0, 12)),
      getIvyAlerts().then((a) => a.slice(0, 6)),
      getIvyActionCenter(),
    ]);
  return {
    ivyStats,
    ivyActivity,
    dailyBrief,
    weeklyBrief,
    recommendations,
    alerts,
    actionCenter,
    topRecommendations: recommendations.slice(0, 6),
    urgentAlerts: alerts.filter((a) => a.alertType === "urgent"),
  };
}
