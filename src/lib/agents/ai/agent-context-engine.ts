import { createServerClient } from "@/lib/supabase/server";
import type { AgentSlug } from "@/lib/types";

export interface AgentContextBundle {
  agentId: AgentSlug;
  gatheredAt: string;
  data: Record<string, unknown>;
  summary: string;
}

async function gatherSharedContext(supabase: ReturnType<typeof createServerClient>) {
  const [messages, tasks, events, pendingApprovals] = await Promise.all([
    supabase.from("agent_messages").select("*").eq("status", "unread").order("created_at", { ascending: false }).limit(5),
    supabase.from("agent_tasks").select("*").in("status", ["pending", "in_progress"]).order("created_at", { ascending: false }).limit(8),
    supabase.from("agent_events").select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("approval_queue").select("*").eq("status", "pending").limit(5),
  ]);
  return {
    unreadMessages: messages.data ?? [],
    activeTasks: tasks.data ?? [],
    recentEvents: events.data ?? [],
    pendingApprovals: pendingApprovals.data ?? [],
  };
}

async function gatherScoutContext(supabase: ReturnType<typeof createServerClient>) {
  const [leads, partnerships] = await Promise.all([
    supabase.from("creator_leads").select("*").order("partnership_score", { ascending: false }).limit(10),
    supabase.from("creator_partnerships").select("*").order("created_at", { ascending: false }).limit(5),
  ]);
  return { creatorLeads: leads.data ?? [], partnerships: partnerships.data ?? [] };
}

async function gatherRootsContext(supabase: ReturnType<typeof createServerClient>) {
  const [opps, replies] = await Promise.all([
    supabase.from("community_opportunities").select("*").order("urgency_score", { ascending: false }).limit(8),
    supabase.from("community_reply_drafts").select("*").eq("status", "pending").limit(5),
  ]);
  return { opportunities: opps.data ?? [], pendingReplies: replies.data ?? [] };
}

async function gatherSentinelContext(supabase: ReturnType<typeof createServerClient>) {
  const { data } = await supabase
    .from("competitor_intel_alerts")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(8);
  return { activeAlerts: data ?? [] };
}

async function gatherBloomContext(supabase: ReturnType<typeof createServerClient>) {
  const [pieces, runs] = await Promise.all([
    supabase.from("bloom_content_pieces").select("*").order("created_at", { ascending: false }).limit(10),
    supabase.from("bloom_production_runs").select("*").order("created_at", { ascending: false }).limit(3),
  ]);
  return { recentPieces: pieces.data ?? [], productionRuns: runs.data ?? [] };
}

async function gatherSageContext(supabase: ReturnType<typeof createServerClient>) {
  const { data } = await supabase
    .from("sage_content_reviews")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);
  return { recentReviews: data ?? [] };
}

async function gatherSproutContext(supabase: ReturnType<typeof createServerClient>) {
  const { data } = await supabase
    .from("sprout_scheduled_posts")
    .select("*")
    .in("status", ["ready", "waiting", "scheduled"])
    .order("best_time_score", { ascending: false })
    .limit(8);
  return { scheduledPosts: data ?? [] };
}

async function gatherOakContext(supabase: ReturnType<typeof createServerClient>) {
  const { data } = await supabase
    .from("oak_partnership_pipeline")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);
  return { pipeline: data ?? [] };
}

async function gatherIvyContext(supabase: ReturnType<typeof createServerClient>) {
  const [recs, alerts, briefs] = await Promise.all([
    supabase.from("ivy_recommendations").select("*").order("priority_score", { ascending: false }).limit(8),
    supabase.from("ivy_alerts").select("*").eq("status", "active").limit(5),
    supabase.from("ivy_briefs").select("*").order("created_at", { ascending: false }).limit(2),
  ]);
  return { recommendations: recs.data ?? [], alerts: alerts.data ?? [], briefs: briefs.data ?? [] };
}

async function gatherAtlasContext(supabase: ReturnType<typeof createServerClient>) {
  const [metrics, experiments, recs, bottlenecks] = await Promise.all([
    supabase.from("atlas_growth_metrics").select("*").order("snapshot_date", { ascending: false }).limit(3),
    supabase.from("atlas_experiments").select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("atlas_recommendations").select("*").order("priority_score", { ascending: false }).limit(5),
    supabase.from("atlas_bottlenecks").select("*").eq("status", "active").limit(5),
  ]);
  return {
    metrics: metrics.data ?? [],
    experiments: experiments.data ?? [],
    recommendations: recs.data ?? [],
    bottlenecks: bottlenecks.data ?? [],
  };
}

async function gatherFernContext(supabase: ReturnType<typeof createServerClient>) {
  const [opps, experiments] = await Promise.all([
    supabase.from("fern_opportunities").select("*").order("priority_score", { ascending: false }).limit(8),
    supabase.from("fern_experiments").select("*").order("created_at", { ascending: false }).limit(5),
  ]);
  return { opportunities: opps.data ?? [], experiments: experiments.data ?? [] };
}

async function gatherEchoContext(supabase: ReturnType<typeof createServerClient>) {
  const today = new Date().toISOString().slice(0, 10);
  const [feedback, features, churn, love, sentiment] = await Promise.all([
    supabase.from("echo_feedback").select("*").eq("report_date", today).limit(15),
    supabase.from("echo_feature_requests").select("*").eq("report_date", today).order("priority", { ascending: false }).limit(6),
    supabase.from("echo_churn_risks").select("*").eq("status", "active").limit(5),
    supabase.from("echo_love_signals").select("*").eq("report_date", today).limit(5),
    supabase.from("echo_sentiment").select("*").eq("snapshot_date", today).maybeSingle(),
  ]);
  return {
    feedback: feedback.data ?? [],
    featureRequests: features.data ?? [],
    churnRisks: churn.data ?? [],
    loveSignals: love.data ?? [],
    sentiment: sentiment.data,
  };
}

async function gatherGateContext(supabase: ReturnType<typeof createServerClient>) {
  const { data } = await supabase
    .from("approval_queue")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(10);
  return { pendingApprovals: data ?? [] };
}

async function gatherMossContext(supabase: ReturnType<typeof createServerClient>) {
  const { data } = await supabase
    .from("generated_assets")
    .select("id, status, review_feedback, metadata")
    .in("status", ["generated", "needs_revision"])
    .order("created_at", { ascending: false })
    .limit(10);
  return { pendingVoiceReview: data ?? [] };
}

const AGENT_CONTEXT_GATHERERS: Record<
  AgentSlug,
  (supabase: ReturnType<typeof createServerClient>) => Promise<Record<string, unknown>>
> = {
  scout: gatherScoutContext,
  roots: gatherRootsContext,
  sentinel: gatherSentinelContext,
  bloom: gatherBloomContext,
  sage: gatherSageContext,
  sprout: gatherSproutContext,
  oak: gatherOakContext,
  ivy: gatherIvyContext,
  atlas: gatherAtlasContext,
  fern: gatherFernContext,
  echo: gatherEchoContext,
  gate: gatherGateContext,
  moss: gatherMossContext,
};

export async function gatherAgentContext(agentId: AgentSlug): Promise<AgentContextBundle> {
  const supabase = createServerClient();
  const shared = await gatherSharedContext(supabase);
  const agentSpecific = await AGENT_CONTEXT_GATHERERS[agentId](supabase);

  const data = { shared, agent: agentSpecific };
  const keys = Object.keys(agentSpecific);
  const summary = `Agent ${agentId}: ${keys.length} context domains loaded. ${shared.unreadMessages.length} unread messages, ${shared.activeTasks.length} active tasks.`;

  return {
    agentId,
    gatheredAt: new Date().toISOString(),
    data,
    summary,
  };
}

export function formatContextForPrompt(context: AgentContextBundle): string {
  return JSON.stringify(context.data, null, 2).slice(0, 12000);
}
