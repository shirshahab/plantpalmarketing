import {
  synthesizeAlerts,
  synthesizeDailyBrief,
  synthesizeRecommendations,
  synthesizeWeeklyBrief,
  type IvyAgentContext,
} from "@/lib/agents/ivy/brief-synthesizer";
import { createServerClient } from "@/lib/supabase/server";
import { getCompanyOperatingSummary } from "@/lib/company-os/company-os";
import type { Json } from "@/lib/supabase/database.types";

export interface IvyRunResult {
  dailyBriefId: string;
  weeklyBriefId?: string;
  recommendationsCount: number;
  alertsCount: number;
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

async function gatherContext(supabase: ReturnType<typeof createServerClient>): Promise<IvyAgentContext> {
  const [
    approvalsRes,
    leadsRes,
    pipelineRes,
    alertsRes,
    bloomRes,
    sproutRes,
    oppsRes,
  ] = await Promise.all([
    supabase.from("approval_queue").select("*").eq("status", "pending").order("created_at", { ascending: false }).limit(10),
    supabase.from("creator_leads").select("*").order("partnership_score", { ascending: false }).limit(1),
    supabase.from("oak_partnership_pipeline").select("*").order("revenue_generated", { ascending: false }).limit(5),
    supabase.from("competitor_intel_alerts").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(5),
    supabase.from("bloom_content_pieces").select("*").order("viral_score", { ascending: false }).limit(1),
    supabase.from("sprout_scheduled_posts").select("*").in("status", ["ready", "waiting"]).order("best_time_score", { ascending: false }).limit(5),
    supabase.from("community_opportunities").select("*").order("urgency_score", { ascending: false }).limit(5),
  ]);

  const pendingApprovals = (approvalsRes.data ?? []).map((a) => ({
    id: a.id,
    type: a.type,
    channel: a.channel,
    draft: a.draft,
    createdAt: a.created_at,
  }));

  const topLead = leadsRes.data?.[0];
  const topCreator = topLead
    ? {
        name: topLead.name,
        handle: topLead.handle,
        partnershipScore: topLead.partnership_score,
        followers: topLead.followers,
      }
    : null;

  const negotiating = (pipelineRes.data ?? []).find((p) => p.stage === "negotiating");
  const topPipeline = negotiating ?? pipelineRes.data?.[0];
  const topPartnership = topPipeline
    ? {
        partnerName: topPipeline.partner_name,
        stage: topPipeline.stage,
        revenueGenerated: Number(topPipeline.revenue_generated),
        collaborationIdea: topPipeline.collaboration_idea,
      }
    : null;

  const highAlert = (alertsRes.data ?? []).find((a) => a.severity === "high") ?? alertsRes.data?.[0];
  const topCompetitorThreat = highAlert
    ? {
        competitor: highAlert.competitor,
        title: highAlert.title,
        description: highAlert.description,
        severity: highAlert.severity,
      }
    : null;

  const topBloom = bloomRes.data?.[0];
  const topContent = topBloom
    ? {
        platform: topBloom.platform,
        hook: topBloom.hook,
        viralScore: topBloom.viral_score,
      }
    : null;

  const communityTrends = (oppsRes.data ?? []).map(
    (o) => `${o.platform}: ${o.topic || o.post.slice(0, 80)}`
  );

  const sproutReady = (sproutRes.data ?? []).map((p) => ({
    id: p.id,
    platform: p.platform,
    title: p.title,
    hook: p.hook,
  }));

  const pendingOutreach = (pipelineRes.data ?? []).filter((p) => !p.outreach_approved && p.outreach_draft).length;

  return {
    pendingApprovals,
    topCreator,
    topPartnership,
    topCompetitorThreat,
    topContent,
    communityTrends,
    sproutReady,
    urgentAlertsCount: pendingApprovals.length > 5 ? 1 : 0,
    pendingOutreach,
    highSeverityCompetitorAlerts: (alertsRes.data ?? []).filter((a) => a.severity === "high").length,
  };
}

export async function runIvyAgent(): Promise<IvyRunResult> {
  const supabase = createServerClient();
  const today = todayDateString();
  const ctx = await gatherContext(supabase);

  const recommendations = synthesizeRecommendations(ctx);
  const alerts = synthesizeAlerts(ctx);
  const daily = synthesizeDailyBrief(ctx, recommendations);

  // Phase 31A — Ivy pulls from Company OS first. The brief leads with the
  // operating picture: what moved, what's stuck, what needs the founder.
  const companyOs = await getCompanyOperatingSummary();
  const hasCompanyOsData =
    companyOs.workflowsStartedToday > 0 ||
    companyOs.activeWorkflows > 0 ||
    companyOs.workflowsCompletedToday > 0 ||
    companyOs.blockedWorkflows > 0;

  if (hasCompanyOsData) {
    const osParts = [
      `Company OS: ${companyOs.workflowsStartedToday} workflows started today, ${companyOs.workflowsCompletedToday} completed, ${companyOs.activeWorkflows} active, ${companyOs.blockedWorkflows} blocked.`,
    ];
    if (companyOs.decisionsNeeded > 0) {
      osParts.push(`${companyOs.decisionsNeeded} outputs waiting on founder decisions.`);
    }
    if (companyOs.biggestBottleneck) {
      osParts.push(`Biggest bottleneck: ${companyOs.biggestBottleneck.description} (${companyOs.biggestBottleneck.agentId}).`);
    }
    if (companyOs.highestImpactOutput) {
      osParts.push(`Top output: "${companyOs.highestImpactOutput.title}" by ${companyOs.highestImpactOutput.agentId}.`);
    }
    if (companyOs.agentProductivity[0]) {
      osParts.push(`Most productive agent: ${companyOs.agentProductivity[0].agentId} (${companyOs.agentProductivity[0].stepsCompleted} steps).`);
    }
    daily.executiveSummary = `${osParts.join(" ")} ${daily.executiveSummary}`;
    daily.sections = {
      ...daily.sections,
      companyOs: {
        workflowsStartedToday: companyOs.workflowsStartedToday,
        workflowsCompletedToday: companyOs.workflowsCompletedToday,
        activeWorkflows: companyOs.activeWorkflows,
        blockedWorkflows: companyOs.blockedWorkflows,
        decisionsNeeded: companyOs.decisionsNeeded,
        outputsToday: companyOs.outputsToday,
        healthScore: companyOs.healthScore,
        biggestBottleneck: companyOs.biggestBottleneck?.description ?? "",
        highestImpactOutput: companyOs.highestImpactOutput?.title ?? "",
        agentProductivity: companyOs.agentProductivity.slice(0, 5),
      },
    } as typeof daily.sections;
  }

  await supabase.from("ivy_recommendations").delete().eq("brief_date", today);
  await supabase.from("ivy_alerts").delete().eq("brief_date", today);

  const { data: existingDaily } = await supabase
    .from("ivy_briefs")
    .select("id")
    .eq("brief_type", "daily")
    .eq("run_date", today)
    .maybeSingle();

  let dailyBriefId: string;

  if (existingDaily) {
    const { data: updated, error } = await supabase
      .from("ivy_briefs")
      .update({
        executive_summary: daily.executiveSummary,
        sections: daily.sections as unknown as Json,
      })
      .eq("id", existingDaily.id)
      .select("id")
      .single();
    if (error || !updated) throw new Error(error?.message ?? "Failed to update daily brief");
    dailyBriefId = updated.id;
  } else {
    const { data: inserted, error } = await supabase
      .from("ivy_briefs")
      .insert({
        brief_type: "daily",
        run_date: today,
        executive_summary: daily.executiveSummary,
        sections: daily.sections as unknown as Json,
      })
      .select("id")
      .single();
    if (error || !inserted) throw new Error(error?.message ?? "Failed to insert daily brief");
    dailyBriefId = inserted.id;
  }

  let weeklyBriefId: string | undefined;
  const dayOfWeek = new Date().getDay();
  const isMonday = dayOfWeek === 1;

  const { data: recentWeekly } = await supabase
    .from("ivy_briefs")
    .select("id")
    .eq("brief_type", "weekly")
    .gte("run_date", new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10))
    .limit(1);

  if (isMonday || !recentWeekly?.length) {
    const weekly = synthesizeWeeklyBrief(ctx, recommendations);
    const { data: weeklyInserted, error: weeklyError } = await supabase
      .from("ivy_briefs")
      .insert({
        brief_type: "weekly",
        run_date: today,
        executive_summary: weekly.executiveSummary,
        sections: weekly.sections as unknown as Json,
      })
      .select("id")
      .single();
    if (weeklyError || !weeklyInserted) throw new Error(weeklyError?.message ?? "Failed to insert weekly brief");
    weeklyBriefId = weeklyInserted.id;
  }

  if (recommendations.length > 0) {
    const { error: recError } = await supabase.from("ivy_recommendations").insert(
      recommendations.map((r) => ({
        category: r.category,
        title: r.title,
        description: r.description,
        priority_score: r.priorityScore,
        revenue_impact: r.revenueImpact,
        growth_impact: r.growthImpact,
        virality_potential: r.viralityPotential,
        time_sensitivity: r.timeSensitivity,
        source_agent: r.sourceAgent,
        source_entity_id: r.sourceEntityId,
        brief_date: today,
        status: "pending",
      }))
    );
    if (recError) throw new Error(recError.message);
  }

  if (alerts.length > 0) {
    const { error: alertError } = await supabase.from("ivy_alerts").insert(
      alerts.map((a) => ({
        alert_type: a.alertType,
        title: a.title,
        description: a.description,
        priority_score: a.priorityScore,
        source_agent: a.sourceAgent,
        source_entity_id: a.sourceEntityId,
        brief_date: today,
        status: "active",
      }))
    );
    if (alertError) throw new Error(alertError.message);
  }

  const topRec = recommendations[0];
  await supabase.from("agent_activity_log").insert({
    agent_id: "ivy",
    action: "morning_brief",
    detail: topRec
      ? `Morning brief generated — top priority: ${topRec.title}`
      : `Morning brief generated — ${recommendations.length} recommendations, ${alerts.length} alerts`,
    metadata: {
      recommendations: recommendations.length,
      alerts: alerts.length,
      daily_brief_id: dailyBriefId,
    },
  });

  return {
    dailyBriefId,
    weeklyBriefId,
    recommendationsCount: recommendations.length,
    alertsCount: alerts.length,
  };
}
