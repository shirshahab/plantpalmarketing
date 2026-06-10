import { createServerClient } from "@/lib/supabase";
import {
  mapAgentActivityLog,
  mapEchoChurnRisk,
  mapEchoFeatureRequest,
  mapEchoFeedback,
  mapEchoLoveSignal,
  mapEchoReport,
  mapEchoSentiment,
} from "@/lib/supabase/mappers";
import type { EchoReportType } from "@/lib/types";

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export async function getEchoFeedback(date?: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("echo_feedback")
    .select("*")
    .eq("report_date", date ?? todayDateString())
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapEchoFeedback);
}

export async function getEchoFeatureRequests(date?: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("echo_feature_requests")
    .select("*")
    .eq("report_date", date ?? todayDateString())
    .order("priority", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapEchoFeatureRequest);
}

export async function getEchoSentiment(date?: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("echo_sentiment")
    .select("*")
    .eq("snapshot_date", date ?? todayDateString())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapEchoSentiment(data) : null;
}

export async function getEchoLoveSignals(date?: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("echo_love_signals")
    .select("*")
    .eq("report_date", date ?? todayDateString())
    .order("marketing_potential", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapEchoLoveSignal);
}

export async function getEchoChurnRisks(date?: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("echo_churn_risks")
    .select("*")
    .eq("report_date", date ?? todayDateString())
    .eq("status", "active")
    .order("severity", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapEchoChurnRisk);
}

export async function getLatestEchoReport(type: EchoReportType) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("echo_reports")
    .select("*")
    .eq("report_type", type)
    .order("run_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapEchoReport(data) : null;
}

export async function getEchoActivity(limit = 10) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("agent_activity_log")
    .select("*")
    .eq("agent_id", "echo")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAgentActivityLog);
}

export async function getEchoStats() {
  const today = todayDateString();
  const [feedback, features, sentiment, churnRisks, loveSignals, dailyReport] = await Promise.all([
    getEchoFeedback(today),
    getEchoFeatureRequests(today),
    getEchoSentiment(today),
    getEchoChurnRisks(today),
    getEchoLoveSignals(today),
    getLatestEchoReport("daily"),
  ]);

  return {
    totalFeedback: feedback.length,
    urgentCount: sentiment?.urgentCount ?? feedback.filter((f) => f.sentiment === "urgent").length,
    positivePct: sentiment?.positivePct ?? 0,
    topFeatureRequest: features[0]?.featureName ?? null,
    topFeatureFrequency: features[0]?.frequency ?? 0,
    activeChurnRisks: churnRisks.length,
    loveSignals: loveSignals.length,
    hasDailyReport: !!dailyReport,
    trendDirection: sentiment?.trendDirection ?? "stable",
  };
}

export async function getEchoHQData() {
  const [echoStats, echoActivity, feedback, featureRequests, sentiment, loveSignals, churnRisks, dailyReport, weeklyReport] =
    await Promise.all([
      getEchoStats(),
      getEchoActivity(8),
      getEchoFeedback().then((f) => f.slice(0, 10)),
      getEchoFeatureRequests().then((f) => f.slice(0, 6)),
      getEchoSentiment(),
      getEchoLoveSignals().then((l) => l.slice(0, 4)),
      getEchoChurnRisks().then((c) => c.slice(0, 4)),
      getLatestEchoReport("daily"),
      getLatestEchoReport("weekly"),
    ]);
  return {
    echoStats,
    echoActivity,
    feedback,
    featureRequests,
    sentiment,
    loveSignals,
    churnRisks,
    dailyReport,
    weeklyReport,
    topFeatureRequests: featureRequests.slice(0, 3),
  };
}
