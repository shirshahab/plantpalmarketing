import { createServerClient } from "@/lib/supabase";
import {
  mapAgentActivityLog,
  mapCompetitorDailyBrief,
  mapCompetitorIntelAlert,
  mapCompetitorScoreboard,
} from "@/lib/supabase/mappers";

function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function getCompetitorScoreboard() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("competitor_scoreboard")
    .select("*")
    .order("threat_level", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapCompetitorScoreboard);
}

export async function getCompetitorIntelAlerts() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("competitor_intel_alerts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapCompetitorIntelAlert);
}

export async function getLatestCompetitorBrief() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("competitor_daily_briefs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapCompetitorDailyBrief(data) : null;
}

export async function getSentinelActivity(limit = 10) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("agent_activity_log")
    .select("*")
    .eq("agent_id", "sentinel")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAgentActivityLog);
}

export async function getSentinelStats() {
  const supabase = createServerClient();
  const today = todayStart();
  const [alertsToday, activeAlerts, competitors, highSeverity] = await Promise.all([
    supabase.from("competitor_intel_alerts").select("*", { count: "exact", head: true }).gte("created_at", today),
    supabase.from("competitor_intel_alerts").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("competitor_scoreboard").select("*", { count: "exact", head: true }),
    supabase.from("competitor_intel_alerts").select("*", { count: "exact", head: true }).eq("severity", "high").eq("status", "active"),
  ]);
  return {
    alertsToday: alertsToday.count ?? 0,
    activeAlerts: activeAlerts.count ?? 0,
    competitorsTracked: competitors.count ?? 0,
    highSeverityAlerts: highSeverity.count ?? 0,
    totalAlerts: activeAlerts.count ?? 0,
  };
}

export async function getSentinelHQData() {
  const [sentinelStats, sentinelActivity, scoreboard, recentAlerts, dailyBrief] = await Promise.all([
    getSentinelStats(),
    getSentinelActivity(8),
    getCompetitorScoreboard(),
    getCompetitorIntelAlerts().then((a) => a.slice(0, 6)),
    getLatestCompetitorBrief(),
  ]);
  return { sentinelStats, sentinelActivity, scoreboard, recentAlerts, dailyBrief };
}
