import { createServerClient } from "@/lib/supabase";
import {
  mapAgentActivityLog,
  mapAtlasBottleneck,
  mapAtlasExperiment,
  mapAtlasForecast,
  mapAtlasGrowthMetrics,
  mapAtlasGrowthReport,
  mapAtlasRecommendation,
} from "@/lib/supabase/mappers";
import type { AtlasReportType } from "@/lib/types";

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export async function getLatestAtlasMetrics() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("atlas_growth_metrics")
    .select("*")
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapAtlasGrowthMetrics(data) : null;
}

export async function getLatestAtlasReport(type: AtlasReportType) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("atlas_growth_reports")
    .select("*")
    .eq("report_type", type)
    .order("run_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapAtlasGrowthReport(data) : null;
}

export async function getAtlasRecommendations(date?: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("atlas_recommendations")
    .select("*")
    .eq("report_date", date ?? todayDateString())
    .order("priority_score", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAtlasRecommendation);
}

export async function getAtlasExperiments() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("atlas_experiments")
    .select("*")
    .order("priority_score", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAtlasExperiment);
}

export async function getAtlasForecasts(date?: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("atlas_forecasts")
    .select("*")
    .eq("report_date", date ?? todayDateString())
    .order("horizon");
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAtlasForecast);
}

export async function getAtlasBottlenecks(date?: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("atlas_bottlenecks")
    .select("*")
    .eq("report_date", date ?? todayDateString())
    .eq("status", "active")
    .order("severity", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAtlasBottleneck);
}

export async function getAtlasActivity(limit = 10) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("agent_activity_log")
    .select("*")
    .eq("agent_id", "atlas")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAgentActivityLog);
}

export async function getAtlasStats() {
  const today = todayDateString();
  const [metrics, recommendations, experiments, bottlenecks, forecasts, dailyReport] = await Promise.all([
    getLatestAtlasMetrics(),
    getAtlasRecommendations(today),
    getAtlasExperiments(),
    getAtlasBottlenecks(today),
    getAtlasForecasts(today),
    getLatestAtlasReport("daily"),
  ]);

  return {
    totalUsers: metrics?.totalUsers ?? 0,
    growthStage: metrics?.growthStage ?? "1k_to_10k",
    totalRecommendations: recommendations.length,
    activeExperiments: experiments.filter((e) => e.status === "running" || e.status === "proposed").length,
    activeBottlenecks: bottlenecks.length,
    topPriorityScore: recommendations[0]?.priorityScore ?? 0,
    hasDailyReport: !!dailyReport,
    forecast30d: forecasts.find((f) => f.horizon === "30d")?.predictedUsers ?? 0,
  };
}

export async function getAtlasHQData() {
  const [atlasStats, atlasActivity, metrics, dailyReport, weeklyReport, recommendations, experiments, forecasts, bottlenecks] =
    await Promise.all([
      getAtlasStats(),
      getAtlasActivity(8),
      getLatestAtlasMetrics(),
      getLatestAtlasReport("daily"),
      getLatestAtlasReport("weekly"),
      getAtlasRecommendations().then((r) => r.slice(0, 8)),
      getAtlasExperiments().then((e) => e.slice(0, 6)),
      getAtlasForecasts(),
      getAtlasBottlenecks().then((b) => b.slice(0, 4)),
    ]);
  return {
    atlasStats,
    atlasActivity,
    metrics,
    dailyReport,
    weeklyReport,
    recommendations,
    experiments,
    forecasts,
    bottlenecks,
    topRecommendations: recommendations.slice(0, 4),
  };
}
