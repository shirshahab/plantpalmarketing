import {
  synthesizeExperiments,
  synthesizeForecasts,
  synthesizeOpportunities,
  type FernAcquisitionContext,
} from "@/lib/agents/fern/opportunity-synthesizer";
import { createServerClient } from "@/lib/supabase/server";
import { recordHandoff } from "@/lib/collaboration/handoff";

export interface FernRunResult {
  opportunitiesCount: number;
  experimentsCount: number;
  forecastsCount: number;
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

async function gatherContext(supabase: ReturnType<typeof createServerClient>): Promise<FernAcquisitionContext> {
  const [metricsRes, leadsRes, oppsRes, pipelineRes, bloomRes] = await Promise.all([
    supabase.from("atlas_growth_metrics").select("*").order("snapshot_date", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("creator_leads").select("id, handle, priority, partnership_score"),
    supabase.from("community_opportunities").select("*", { count: "exact", head: true }),
    supabase.from("oak_partnership_pipeline").select("installs_generated"),
    supabase.from("bloom_content_pieces").select("*", { count: "exact", head: true }).gte("viral_score", 80),
  ]);

  const m = metricsRes.data;
  const leads = leadsRes.data ?? [];
  const channels =
    m?.channel_breakdown && typeof m.channel_breakdown === "object"
      ? (m.channel_breakdown as Record<string, number>)
      : { tiktok: 38, instagram: 24, youtube: 12, organic: 16, pinterest: 6, x: 4 };

  const topLead = [...leads].sort((a, b) => b.partnership_score - a.partnership_score)[0];

  return {
    totalInstalls: m?.total_installs ?? 4200,
    channelBreakdown: channels,
    creatorLeadCount: leads.length,
    highPriorityCreators: leads.filter((l) => l.priority === "high").length,
    communityOpportunities: oppsRes.count ?? 0,
    partnershipPipeline: pipelineRes.data?.length ?? 0,
    oakAttributedInstalls: (pipelineRes.data ?? []).reduce((s, r) => s + r.installs_generated, 0),
    waitlistCount: m?.waitlist_count ?? 890,
    topCreatorHandle: topLead?.handle,
    viralContentCount: bloomRes.count ?? 0,
  };
}

export async function runFernAgent(): Promise<FernRunResult> {
  const supabase = createServerClient();
  const today = todayDateString();
  const ctx = await gatherContext(supabase);

  const opportunities = synthesizeOpportunities(ctx);
  const experiments = synthesizeExperiments();
  const forecasts = synthesizeForecasts(ctx);

  await supabase.from("fern_opportunities").delete().eq("report_date", today);
  await supabase.from("fern_forecasts").delete().eq("report_date", today);
  await supabase.from("fern_experiments").delete().eq("report_date", today).eq("status", "proposed");

  if (opportunities.length > 0) {
    const { error } = await supabase.from("fern_opportunities").insert(
      opportunities.map((o) => ({
        title: o.title,
        description: o.description,
        traffic_source: o.trafficSource,
        opportunity_type: o.opportunityType,
        reach: o.reach,
        cost: o.cost,
        difficulty: o.difficulty,
        virality: o.virality,
        estimated_installs: o.estimatedInstalls,
        priority_score: o.priorityScore,
        source_agent: o.sourceAgent,
        report_date: today,
      }))
    );
    if (error) throw new Error(error.message);
  }

  if (experiments.length > 0) {
    const { error } = await supabase.from("fern_experiments").insert(
      experiments.map((e) => ({
        name: e.name,
        hypothesis: e.hypothesis,
        effort: e.effort,
        expected_impact: e.expectedImpact,
        status: e.status,
        results: e.results,
        report_date: today,
      }))
    );
    if (error) throw new Error(error.message);
  }

  if (forecasts.length > 0) {
    const { error } = await supabase.from("fern_forecasts").insert(
      forecasts.map((f) => ({
        horizon: f.horizon,
        traffic_source: f.trafficSource,
        predicted_installs: f.predictedInstalls,
        confidence: f.confidence,
        assumptions: f.assumptions,
        report_date: today,
      }))
    );
    if (error) throw new Error(error.message);
  }

  const topOpp = opportunities[0];
  const topExp = experiments[0];

  // Phase 28: growth opportunities become experiments routed to Atlas + Ivy
  if (topOpp) {
    await recordHandoff({
      fromAgent: "fern",
      toAgent: "atlas",
      workflowName: "Fern → Atlas",
      triggerType: "acquisition_opportunity",
      taskType: "growth_experiment",
      taskDescription: `Evaluate acquisition play: ${topOpp.title} (~${topOpp.estimatedInstalls} installs, priority ${topOpp.priorityScore}). ${topExp ? `Paired experiment: ${topExp.name}.` : ""}`,
      priority: "medium",
      messageTitle: `Top acquisition opportunity: ${topOpp.title}`,
      messageBody: `${topOpp.description}\n\nSource: ${topOpp.trafficSource}\nEstimated installs: ${topOpp.estimatedInstalls}\n${experiments.length} experiments proposed.`,
      activityDetail: `Fern handed "${topOpp.title}" to Atlas as an experiment`,
      metadata: { estimated_installs: topOpp.estimatedInstalls },
    });
    await recordHandoff({
      fromAgent: "fern",
      toAgent: "ivy",
      workflowName: "Fern → Ivy",
      triggerType: "acquisition_opportunity",
      taskType: "founder_action_item",
      taskDescription: `Surface in the brief: ${topOpp.title} — est. ${topOpp.estimatedInstalls} installs.`,
      priority: "low",
      messageTitle: `Acquisition headline for the brief`,
      messageBody: `${topOpp.title}: ${topOpp.description}`,
      activityDetail: `Fern flagged the top acquisition play to Ivy`,
      metadata: { opportunity: topOpp.title },
    });
  }

  await supabase.from("agent_activity_log").insert({
    agent_id: "fern",
    action: "acquisition_scan",
    detail: topOpp
      ? `Acquisition scan complete — top opportunity: ${topOpp.title} (~${topOpp.estimatedInstalls} installs)`
      : `Acquisition scan complete — ${opportunities.length} opportunities scored`,
    metadata: {
      opportunities: opportunities.length,
      experiments: experiments.length,
      top_installs: topOpp?.estimatedInstalls,
    },
  });

  return {
    opportunitiesCount: opportunities.length,
    experimentsCount: experiments.length,
    forecastsCount: forecasts.length,
  };
}
