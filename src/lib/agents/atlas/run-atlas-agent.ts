import { runAgentBrain } from "@/lib/agents/ai/agent-brain-engine";
import { isOpenAIConfigured } from "@/lib/openai/config";
import {
  synthesizeBottlenecks,
  synthesizeDailyReport,
  synthesizeExperiments,
  synthesizeForecasts,
  synthesizeRecommendations,
  synthesizeWeeklyReport,
  type AtlasGrowthContext,
} from "@/lib/agents/atlas/growth-synthesizer";
import { inferGrowthStage } from "@/lib/agents/atlas/decision-engine";
import { createServerClient } from "@/lib/supabase/server";
import { recordHandoff } from "@/lib/collaboration/handoff";
import { detectCompanyBottlenecks } from "@/lib/company-os/company-os";
import type { Json } from "@/lib/supabase/database.types";

export interface AtlasRunResult {
  dailyReportId: string;
  weeklyReportId?: string;
  recommendationsCount: number;
  experimentsCount: number;
  bottlenecksCount: number;
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

async function gatherContext(supabase: ReturnType<typeof createServerClient>): Promise<AtlasGrowthContext> {
  const [
    metricsRes,
    oakRes,
    leadsRes,
    sproutRes,
    approvalsRes,
  ] = await Promise.all([
    supabase.from("atlas_growth_metrics").select("*").order("snapshot_date", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("oak_partnership_pipeline").select("installs_generated"),
    supabase.from("creator_leads").select("*").order("partnership_score", { ascending: false }).limit(1),
    supabase.from("sprout_scheduled_posts").select("platform").limit(20),
    supabase.from("approval_queue").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const m = metricsRes.data;
  const oakInstalls = (oakRes.data ?? []).reduce((s, r) => s + r.installs_generated, 0);
  const topLead = leadsRes.data?.[0];
  const channels =
    m?.channel_breakdown && typeof m.channel_breakdown === "object"
      ? (m.channel_breakdown as Record<string, number>)
      : { tiktok: 38, instagram: 24, pinterest: 6, x: 4, youtube: 12, organic: 16 };

  return {
    totalUsers: m?.total_users ?? 2840,
    totalInstalls: m?.total_installs ?? (oakInstalls || 4200),
    waitlistCount: m?.waitlist_count ?? 890,
    conversionRate: Number(m?.conversion_rate ?? 3.2),
    engagementRate: Number(m?.engagement_rate ?? 38),
    retentionD7: Number(m?.retention_d7 ?? 32),
    retentionD30: Number(m?.retention_d30 ?? 18),
    trafficSessions: m?.traffic_sessions ?? 12400,
    channelBreakdown: channels,
    oakInstalls,
    topCreatorHandle: topLead?.handle,
    topCreatorFollowers: topLead?.followers,
    sproutPlatforms: [...new Set((sproutRes.data ?? []).map((p) => p.platform))],
    pendingApprovals: approvalsRes.count ?? 0,
  };
}

export async function runAtlasAgent(): Promise<AtlasRunResult> {
  if (isOpenAIConfigured()) {
    await runAgentBrain("atlas");
  }

  const supabase = createServerClient();
  const today = todayDateString();
  const ctx = await gatherContext(supabase);

  const recommendations = synthesizeRecommendations(ctx);
  const bottlenecks = synthesizeBottlenecks(ctx);
  const experiments = synthesizeExperiments(ctx);
  const forecasts = synthesizeForecasts(ctx);
  const daily = synthesizeDailyReport(ctx, recommendations, bottlenecks);

  await supabase.from("atlas_recommendations").delete().eq("report_date", today);
  await supabase.from("atlas_bottlenecks").delete().eq("report_date", today);
  await supabase.from("atlas_forecasts").delete().eq("report_date", today);
  await supabase.from("atlas_experiments").delete().eq("report_date", today).eq("status", "proposed");

  const { data: existingDaily } = await supabase
    .from("atlas_growth_reports")
    .select("id")
    .eq("report_type", "daily")
    .eq("run_date", today)
    .maybeSingle();

  let dailyReportId: string;

  if (existingDaily) {
    const { data: updated, error } = await supabase
      .from("atlas_growth_reports")
      .update({
        executive_summary: daily.executiveSummary,
        sections: daily.sections as unknown as Json,
      })
      .eq("id", existingDaily.id)
      .select("id")
      .single();
    if (error || !updated) throw new Error(error?.message ?? "Failed to update daily report");
    dailyReportId = updated.id;
  } else {
    const { data: inserted, error } = await supabase
      .from("atlas_growth_reports")
      .insert({
        report_type: "daily",
        run_date: today,
        executive_summary: daily.executiveSummary,
        sections: daily.sections as unknown as Json,
      })
      .select("id")
      .single();
    if (error || !inserted) throw new Error(error?.message ?? "Failed to insert daily report");
    dailyReportId = inserted.id;
  }

  let weeklyReportId: string | undefined;
  const isMonday = new Date().getDay() === 1;
  const { data: recentWeekly } = await supabase
    .from("atlas_growth_reports")
    .select("id")
    .eq("report_type", "weekly")
    .gte("run_date", new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10))
    .limit(1);

  if (isMonday || !recentWeekly?.length) {
    const weekly = synthesizeWeeklyReport(ctx, recommendations);
    const { data: weeklyInserted, error: weeklyError } = await supabase
      .from("atlas_growth_reports")
      .insert({
        report_type: "weekly",
        run_date: today,
        executive_summary: weekly.executiveSummary,
        sections: weekly.sections as unknown as Json,
      })
      .select("id")
      .single();
    if (weeklyError || !weeklyInserted) throw new Error(weeklyError?.message ?? "Failed to insert weekly report");
    weeklyReportId = weeklyInserted.id;
  }

  if (recommendations.length > 0) {
    const { error } = await supabase.from("atlas_recommendations").insert(
      recommendations.map((r) => ({
        title: r.title,
        description: r.description,
        category: r.category,
        reach: r.reach,
        cost: r.cost,
        difficulty: r.difficulty,
        virality: r.virality,
        revenue_potential: r.revenuePotential,
        retention_potential: r.retentionPotential,
        priority_score: r.priorityScore,
        source_agent: r.sourceAgent,
        report_date: today,
      }))
    );
    if (error) throw new Error(error.message);
  }

  if (bottlenecks.length > 0) {
    const { error } = await supabase.from("atlas_bottlenecks").insert(
      bottlenecks.map((b) => ({
        bottleneck_type: b.bottleneckType,
        title: b.title,
        description: b.description,
        severity: b.severity,
        suggested_fix: b.suggestedFix,
        metric_value: b.metricValue ?? null,
        benchmark_value: b.benchmarkValue ?? null,
        report_date: today,
      }))
    );
    if (error) throw new Error(error.message);
  }

  if (experiments.length > 0) {
    const { error } = await supabase.from("atlas_experiments").insert(
      experiments.map((e) => ({
        name: e.name,
        hypothesis: e.hypothesis,
        expected_outcome: e.expectedOutcome,
        effort: e.effort,
        impact: e.impact,
        priority_score: e.priorityScore,
        status: e.status,
        results: e.results,
        report_date: today,
      }))
    );
    if (error) throw new Error(error.message);
  }

  if (forecasts.length > 0) {
    const { error } = await supabase.from("atlas_forecasts").insert(
      forecasts.map((f) => ({
        horizon: f.horizon,
        predicted_users: f.predictedUsers,
        predicted_installs: f.predictedInstalls,
        growth_rate_pct: f.growthRatePct,
        confidence: f.confidence,
        assumptions: f.assumptions,
        report_date: today,
      }))
    );
    if (error) throw new Error(error.message);
  }

  await supabase.from("atlas_growth_metrics").upsert(
    {
      snapshot_date: today,
      total_users: ctx.totalUsers,
      total_installs: ctx.totalInstalls,
      waitlist_count: ctx.waitlistCount,
      conversion_rate: ctx.conversionRate,
      engagement_rate: ctx.engagementRate,
      retention_d7: ctx.retentionD7,
      retention_d30: ctx.retentionD30,
      traffic_sessions: ctx.trafficSessions,
      growth_stage: inferGrowthStage(ctx.totalUsers),
      channel_breakdown: ctx.channelBreakdown as unknown as Json,
    },
    { onConflict: "snapshot_date" }
  ).select().maybeSingle();

  const topRec = recommendations[0];

  // Phase 28: growth insights become Ivy action items automatically
  if (topRec) {
    await recordHandoff({
      fromAgent: "atlas",
      toAgent: "ivy",
      workflowName: "Atlas → Ivy",
      triggerType: "growth_recommendation",
      triggerId: dailyReportId,
      taskType: "founder_action_item",
      taskDescription: `Add to founder action items: ${topRec.title} (priority ${topRec.priorityScore}). ${topRec.description}`,
      priority: "medium",
      messageTitle: `Top growth move: ${topRec.title}`,
      messageBody: `${topRec.description}\n\nPriority score: ${topRec.priorityScore}\n${recommendations.length} total recommendations, ${bottlenecks.length} bottlenecks, ${experiments.length} experiments proposed today.`,
      activityDetail: `Atlas handed top growth recommendation to Ivy`,
      metadata: { report_id: dailyReportId, recommendations: recommendations.length },
    });
  }

  // Phase 31A — Atlas scans Company OS for slow workflows, blocked work, and approval backlog
  const companyBottlenecks = await detectCompanyBottlenecks();

  await supabase.from("agent_activity_log").insert({
    agent_id: "atlas",
    action: "growth_brief",
    detail: topRec
      ? `Growth brief generated — top opportunity: ${topRec.title}`
      : `Growth brief generated — ${recommendations.length} recommendations`,
    metadata: {
      recommendations: recommendations.length,
      experiments: experiments.length,
      bottlenecks: bottlenecks.length,
      company_os_bottlenecks: companyBottlenecks,
    },
  });

  return {
    dailyReportId,
    weeklyReportId,
    recommendationsCount: recommendations.length,
    experimentsCount: experiments.length,
    bottlenecksCount: bottlenecks.length,
  };
}
