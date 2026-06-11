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
import {
  buildActionPlan,
  buildContentReport,
  buildExecutiveStructured,
  buildFounderReview,
  buildGrowthReport,
} from "@/lib/daily-report/report-sections";
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

  // AI narrative — never throws. 401/missing key degrades to the rule-based
  // summary and the failed attempt is logged to integration_logs.
  const { text: summary, aiError } = await generateExecutiveSummary(
    agentProductivity,
    workflowSummary,
    analyticsSummary,
    apiUsageSummary
  );

  // Phase 27 structured operator sections
  const contentReport = buildContentReport(raw);
  const growthReport = buildGrowthReport(raw, growthRecommendations);
  const executiveSummary = buildExecutiveStructured(
    raw, agentProductivity, workflowSummary, contentReport, growthReport, apiUsageSummary, aiError
  );
  const actionPlan = buildActionPlan(raw, workflowSummary, apiUsageSummary, contentReport, growthReport, aiError);
  const founderReview = buildFounderReview(raw);

  const reportDate = new Date().toISOString().slice(0, 10);
  const supabase = createServerClient();

  const baseRow = {
    report_date: reportDate,
    summary,
    agent_productivity: agentProductivity as unknown as Json,
    workflow_summary: workflowSummary as unknown as Json,
    analytics_summary: analyticsSummary as unknown as Json,
    api_usage_summary: apiUsageSummary as unknown as Json,
    growth_recommendations: growthRecommendations as unknown as Json,
    recommended_actions: recommendedActions as unknown as Json,
  };
  const phase27Columns = {
    executive_summary: executiveSummary as unknown as Json,
    content_report: contentReport as unknown as Json,
    growth_report: growthReport as unknown as Json,
    action_plan: actionPlan as unknown as Json,
    founder_review: founderReview as unknown as Json,
  };

  let { data: inserted, error } = await supabase
    .from("daily_reports")
    .insert({ ...baseRow, ...phase27Columns })
    .select("*")
    .single();

  // Migration 046 not applied yet → retry with legacy columns only
  if (error && /column|schema cache/i.test(error.message)) {
    const retry = await supabase.from("daily_reports").insert(baseRow).select("*").single();
    inserted = retry.data;
    error = retry.error;
  }

  if (error || !inserted) {
    if (error && isMissingTableError(error)) {
      throw new Error("System setup is still finishing. This section will populate once the backend is ready.");
    }
    throw new Error(error?.message ?? "Failed to save daily report");
  }

  await persistWorkflowRuns(workflowSummary.all);
  await persistGrowthActionItems(growthRecommendations, recommendedActions);

  // Phase 25/27: mirror the full report into agent_daily_briefs (Ivy's daily brief table).
  // Structured Phase 27 sections nest inside the existing jsonb columns — no new migration needed here.
  const { error: briefError } = await supabase.from("agent_daily_briefs").insert({
    brief_date: reportDate,
    title: `Daily Brief — ${reportDate}`,
    summary,
    agent_productivity: agentProductivity as unknown as Json,
    workflow_summary: workflowSummary as unknown as Json,
    api_usage_summary: apiUsageSummary as unknown as Json,
    analytics_summary: {
      ...analyticsSummary,
      executiveSummary,
      contentReport,
      growthReport,
      founderReview,
    } as unknown as Json,
    recommendations: [
      ...Object.values(actionPlan).flat(),
      ...growthRecommendations,
      ...recommendedActions,
    ] as unknown as Json,
    created_by_agent: "ivy",
    status: "generated",
  });
  if (briefError) {
    if (isMissingTableError(briefError)) {
      console.error(
        "System setup is still finishing. This section will populate once the backend is ready."
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
    executiveSummary,
    contentReport,
    growthReport,
    actionPlan,
    founderReview,
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
