import { createServerClient } from "@/lib/supabase";
import type { Json } from "@/lib/supabase/database.types";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import {
  collectDailyReportData,
  buildAgentProductivity,
  buildWorkflowSummary,
  buildAnalyticsSummary,
  buildApiUsageSummary,
} from "@/lib/daily-report/collector";
import { buildGrowthRecommendations, buildRecommendedActions } from "@/lib/daily-report/growth-recommendations";
import { generateExecutiveSummary } from "@/lib/daily-report/ai-summary";
import type { DailyReport } from "@/lib/daily-report/types";

export async function runDailyReportGeneration(): Promise<{ report: DailyReport; reportId: string }> {
  const raw = await collectDailyReportData();
  const agentProductivity = buildAgentProductivity(raw);
  const workflowSummary = buildWorkflowSummary(raw);
  const analyticsSummary = buildAnalyticsSummary(raw);
  const apiUsageSummary = buildApiUsageSummary(raw);
  const growthRecommendations = buildGrowthRecommendations(analyticsSummary, workflowSummary);
  const recommendedActions = buildRecommendedActions(analyticsSummary, workflowSummary, growthRecommendations);

  const summary = await generateExecutiveSummary(
    agentProductivity,
    workflowSummary,
    analyticsSummary,
    apiUsageSummary
  );

  const reportDate = new Date().toISOString().slice(0, 10);
  const supabase = createServerClient();

  const { data: inserted, error } = await supabase
    .from("daily_reports")
    .insert({
      report_date: reportDate,
      summary,
      agent_productivity: agentProductivity as unknown as Json,
      workflow_summary: workflowSummary as unknown as Json,
      analytics_summary: analyticsSummary as unknown as Json,
      api_usage_summary: apiUsageSummary as unknown as Json,
      growth_recommendations: growthRecommendations as unknown as Json,
      recommended_actions: recommendedActions as unknown as Json,
    })
    .select("*")
    .single();

  if (error) {
    if (isMissingTableError(error)) {
      throw new Error("daily_reports table not found — run migration 036 in Supabase SQL Editor");
    }
    throw new Error(error.message);
  }

  await persistWorkflowRuns(workflowSummary.all);
  await persistGrowthActionItems(growthRecommendations, recommendedActions);

  // Phase 25: mirror the report into agent_daily_briefs (Ivy's daily brief table)
  const { error: briefError } = await supabase.from("agent_daily_briefs").insert({
    brief_date: reportDate,
    title: `Daily Brief — ${reportDate}`,
    summary,
    agent_productivity: agentProductivity as unknown as Json,
    workflow_summary: workflowSummary as unknown as Json,
    api_usage_summary: apiUsageSummary as unknown as Json,
    analytics_summary: analyticsSummary as unknown as Json,
    recommendations: [...growthRecommendations, ...recommendedActions] as unknown as Json,
    created_by_agent: "ivy",
    status: "generated",
  });
  if (briefError) {
    if (isMissingTableError(briefError)) {
      console.error(
        "[agent_daily_briefs] table not found — run supabase/migrations/042_phase25_agent_daily_briefs.sql"
      );
    } else {
      console.error("[agent_daily_briefs]", briefError.message);
    }
  }

  try {
    await supabase.from("agent_activity_log").insert({
      agent_id: "ivy",
      action: "daily_report",
      detail: "Ivy generated the daily report.",
      metadata: { report_id: inserted.id, report_date: reportDate },
    });
  } catch {
    // non-blocking
  }

  const report: DailyReport = {
    id: inserted.id,
    reportDate: inserted.report_date,
    summary: inserted.summary,
    agentProductivity: agentProductivity,
    workflowSummary,
    analyticsSummary,
    apiUsageSummary,
    growthRecommendations,
    recommendedActions,
    createdAt: inserted.created_at,
  };

  return { report, reportId: inserted.id };
}

async function persistWorkflowRuns(workflows: DailyReport["workflowSummary"]["all"]) {
  const supabase = createServerClient();
  for (const wf of workflows) {
    const [source, ...rest] = wf.agentsInvolved;
    const target = rest[rest.length - 1] ?? source;
    const { error } = await supabase.from("workflow_runs").upsert(
      {
        workflow_name: wf.workflowName,
        source_agent: source,
        target_agent: target,
        status: wf.status,
        items_moved: wf.itemsMoved,
        bottleneck: wf.bottleneck,
        recommendation: wf.recommendedFix,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workflow_name" }
    );
    if (error && !isMissingTableError(error)) {
      console.error("[workflow_runs]", error.message);
    }
  }
}

async function persistGrowthActionItems(
  growthRecs: DailyReport["growthRecommendations"],
  actions: DailyReport["recommendedActions"]
) {
  const supabase = createServerClient();
  const effortMap = { low: 30, medium: 55, high: 80 };
  const priorityMap = { low: "low", medium: "medium", high: "high", urgent: "urgent" } as const;

  for (const rec of growthRecs.slice(0, 5)) {
    const { error } = await supabase.from("growth_action_items").insert({
      title: rec.title,
      description: `${rec.whyItMatters} Next: ${rec.nextStep}`,
      priority: rec.effort === "high" ? "high" : rec.effort === "low" ? "medium" : "high",
      impact_score: rec.effort === "low" ? 75 : rec.effort === "medium" ? 65 : 55,
      effort_score: effortMap[rec.effort],
      owner_agent: rec.ownerAgent,
      status: "recommended",
      due_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    });
    if (error && !isMissingTableError(error)) {
      console.error("[growth_action_items]", error.message);
    }
  }

  for (const action of actions.slice(0, 3)) {
    const exists = growthRecs.some((r) => r.title === action.title);
    if (exists) continue;
    const { error } = await supabase.from("growth_action_items").insert({
      title: action.title,
      description: action.description,
      priority: priorityMap[action.priority],
      impact_score: action.priority === "urgent" ? 90 : action.priority === "high" ? 75 : 60,
      effort_score: 40,
      owner_agent: action.ownerAgent,
      status: "recommended",
    });
    if (error && !isMissingTableError(error)) {
      console.error("[growth_action_items]", error.message);
    }
  }
}
