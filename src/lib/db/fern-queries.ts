import { createServerClient } from "@/lib/supabase";
import {
  mapAgentActivityLog,
  mapFernExperiment,
  mapFernForecast,
  mapFernOpportunity,
} from "@/lib/supabase/mappers";
import type { FernTrafficSource } from "@/lib/types";

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export async function getFernOpportunities(date?: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("fern_opportunities")
    .select("*")
    .eq("report_date", date ?? todayDateString())
    .order("priority_score", { ascending: false })
    .limit(10);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapFernOpportunity);
}

export async function getFernOpportunitiesByChannel(source: FernTrafficSource, date?: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("fern_opportunities")
    .select("*")
    .eq("report_date", date ?? todayDateString())
    .eq("traffic_source", source)
    .order("priority_score", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapFernOpportunity);
}

export async function getFernExperiments() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("fern_experiments")
    .select("*")
    .order("expected_impact", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapFernExperiment);
}

export async function getFernForecasts(date?: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("fern_forecasts")
    .select("*")
    .eq("report_date", date ?? todayDateString())
    .order("predicted_installs", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapFernForecast);
}

export async function getFernActivity(limit = 10) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("agent_activity_log")
    .select("*")
    .eq("agent_id", "fern")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAgentActivityLog);
}

export async function getFernStats() {
  const today = todayDateString();
  const [opportunities, experiments, forecasts] = await Promise.all([
    getFernOpportunities(today),
    getFernExperiments(),
    getFernForecasts(today),
  ]);

  const totalEstimatedInstalls = opportunities.reduce((s, o) => s + o.estimatedInstalls, 0);
  const topChannel = opportunities[0]?.trafficSource ?? "tiktok";

  return {
    totalOpportunities: opportunities.length,
    totalEstimatedInstalls,
    topPriorityScore: opportunities[0]?.priorityScore ?? 0,
    activeExperiments: experiments.filter((e) => e.status === "proposed" || e.status === "running").length,
    forecast30d: forecasts.find((f) => f.horizon === "30d" && f.trafficSource === "all")?.predictedInstalls ?? 0,
    topChannel,
  };
}

export async function getFernHQData() {
  const [fernStats, fernActivity, opportunities, experiments, forecasts] = await Promise.all([
    getFernStats(),
    getFernActivity(8),
    getFernOpportunities().then((o) => o.slice(0, 10)),
    getFernExperiments().then((e) => e.slice(0, 5)),
    getFernForecasts().then((f) => f.slice(0, 6)),
  ]);
  return {
    fernStats,
    fernActivity,
    opportunities,
    experiments,
    forecasts,
    topOpportunities: opportunities.slice(0, 4),
  };
}
