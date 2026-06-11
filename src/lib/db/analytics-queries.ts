import { createServerClient } from "@/lib/supabase";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import { mapAgentHealth } from "@/lib/supabase/mappers";

export interface MetricCard {
  label: string;
  value: string;
  hint?: string;
  notConnected?: boolean;
}

export interface ScorecardEntry {
  agentId: string;
  metricLabel: string;
  daily: number;
  weekly: number;
  monthly: number;
  score: number;
}

export interface AnalyticsDashboard {
  traffic: MetricCard[];
  growth: MetricCard[];
  content: MetricCard[];
  seo: MetricCard[];
  approvals: MetricCard[];
  agents: MetricCard[];
  workflows: MetricCard[];
  leaderboard: ScorecardEntry[];
}

type AnyClient = ReturnType<typeof createServerClient>;

/** Count rows since a date. Returns null when the table doesn't exist. */
async function safeCount(
  supabase: AnyClient,
  table: string,
  opts?: { since?: string; column?: string; eq?: [string, string]; in?: [string, string[]] }
): Promise<number | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from(table as any) as any).select("*", { count: "exact", head: true });
    if (opts?.since) query = query.gte(opts.column ?? "created_at", opts.since);
    if (opts?.eq) query = query.eq(opts.eq[0], opts.eq[1]);
    if (opts?.in) query = query.in(opts.in[0], opts.in[1]);
    const { count, error } = await query;
    if (error) {
      if (isMissingTableError(error)) return null;
      return null;
    }
    return count ?? 0;
  } catch {
    return null;
  }
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

function card(label: string, value: number | null, hint?: string): MetricCard {
  if (value === null) return { label, value: "Not Connected Yet", notConnected: true };
  return { label, value: String(value), hint };
}

/** Per-agent counts for the leaderboard, across three windows. */
async function buildLeaderboard(supabase: AnyClient): Promise<ScorecardEntry[]> {
  const day = daysAgo(1);
  const week = daysAgo(7);
  const month = daysAgo(30);

  const defs: { agentId: string; metricLabel: string; table: string; column?: string; eq?: [string, string] }[] = [
    { agentId: "scout", metricLabel: "Leads found", table: "creator_leads" },
    { agentId: "roots", metricLabel: "Opportunities found", table: "community_opportunities" },
    { agentId: "bloom", metricLabel: "Content created", table: "bloom_content_pieces" },
    { agentId: "sage", metricLabel: "Reviews completed", table: "approval_queue", column: "updated_at" },
    { agentId: "gate", metricLabel: "Decisions made", table: "approval_queue", column: "updated_at" },
    { agentId: "sprout", metricLabel: "Calendar items handled", table: "content_calendar", column: "updated_at" },
    { agentId: "sentinel", metricLabel: "Alerts raised", table: "competitor_alerts" },
    { agentId: "atlas", metricLabel: "Recommendations", table: "atlas_recommendations" },
    { agentId: "echo", metricLabel: "Insights generated", table: "echo_feedback" },
    { agentId: "fern", metricLabel: "Assets created", table: "creative_assets" },
  ];

  const entries: ScorecardEntry[] = [];
  for (const def of defs) {
    const [d, w, m] = await Promise.all([
      safeCount(supabase, def.table, { since: day, column: def.column, eq: def.eq }),
      safeCount(supabase, def.table, { since: week, column: def.column, eq: def.eq }),
      safeCount(supabase, def.table, { since: month, column: def.column, eq: def.eq }),
    ]);
    entries.push({
      agentId: def.agentId,
      metricLabel: def.metricLabel,
      daily: d ?? 0,
      weekly: w ?? 0,
      monthly: m ?? 0,
      score: Math.min(100, (w ?? 0) * 5),
    });
  }

  // Ivy: company health score = % of agents currently healthy/running
  try {
    const { data } = await supabase.from("agent_health").select("*");
    const health = (data ?? []).map(mapAgentHealth);
    const good = health.filter((h) => h.status === "healthy" || h.status === "running" || h.status === "sleeping").length;
    const score = health.length > 0 ? Math.round((good / health.length) * 100) : 0;
    entries.push({
      agentId: "ivy",
      metricLabel: "Company health score",
      daily: score,
      weekly: score,
      monthly: score,
      score,
    });
  } catch {
    entries.push({ agentId: "ivy", metricLabel: "Company health score", daily: 0, weekly: 0, monthly: 0, score: 0 });
  }

  return entries.sort((a, b) => b.score - a.score);
}

export async function getAnalyticsDashboard(): Promise<AnalyticsDashboard> {
  const supabase = createServerClient();
  const week = daysAgo(7);

  // External metrics from analytics_metrics (not connected until a source reports)
  let external: { metric_key: string; label: string; value: number; connection_status: string }[] = [];
  try {
    const { data, error } = await supabase.from("analytics_metrics").select("metric_key, label, value, connection_status");
    if (!error) external = data ?? [];
  } catch {
    // table optional
  }
  const externalCard = (key: string, fallbackLabel: string): MetricCard => {
    const m = external.find((e) => e.metric_key === key);
    if (!m || m.connection_status !== "connected") {
      return { label: m?.label || fallbackLabel, value: "Not Connected Yet", notConnected: true };
    }
    return { label: m.label, value: String(m.value) };
  };

  const [
    calendarWeek,
    calendarPublished,
    approvalsPending,
    approvalsApproved,
    approvalsRejected,
    seoDrafts,
    seoPublished,
    seoKeywords,
    seoTopics,
    creatorLeads,
    communityOpps,
    redditPosted,
    runsToday,
    handoffsToday,
    tasksPending,
    leaderboard,
  ] = await Promise.all([
    safeCount(supabase, "content_calendar", { since: week }),
    safeCount(supabase, "content_calendar", { eq: ["status", "published"] }),
    safeCount(supabase, "approval_queue", { eq: ["status", "pending"] }),
    safeCount(supabase, "approval_queue", { eq: ["status", "approved"] }),
    safeCount(supabase, "approval_queue", { eq: ["status", "rejected"] }),
    safeCount(supabase, "seo_blog_posts"),
    safeCount(supabase, "seo_blog_posts", { eq: ["status", "published"] }),
    safeCount(supabase, "seo_blog_keywords"),
    safeCount(supabase, "seo_topics"),
    safeCount(supabase, "creator_leads", { since: daysAgo(30) }),
    safeCount(supabase, "community_opportunities", { since: daysAgo(30) }),
    safeCount(supabase, "reddit_publish_logs", { eq: ["status", "success"] }),
    safeCount(supabase, "agent_runs", { since: daysAgo(1), column: "started_at" }),
    safeCount(supabase, "agent_messages", { since: daysAgo(1), eq: ["message_type", "handoff"] }),
    safeCount(supabase, "agent_tasks", { eq: ["status", "pending"] }),
    buildLeaderboard(supabase),
  ]);

  const decisions = (approvalsApproved ?? 0) + (approvalsRejected ?? 0);
  const approvalConversion = decisions > 0 ? Math.round(((approvalsApproved ?? 0) / decisions) * 100) : null;

  let agentCards: MetricCard[] = [];
  try {
    const { data } = await supabase.from("agent_health").select("*");
    const health = (data ?? []).map(mapAgentHealth);
    agentCards = [
      card("Agents tracked", health.length),
      card("Healthy", health.filter((h) => h.status === "healthy").length),
      card("Degraded / failed", health.filter((h) => h.status === "degraded" || h.status === "failed").length),
      card(
        "Total items created",
        health.reduce((s, h) => s + h.totalItemsCreated, 0)
      ),
    ];
  } catch {
    agentCards = [{ label: "Agent health", value: "Not Connected Yet", notConnected: true }];
  }

  return {
    traffic: [
      externalCard("website_traffic", "Website traffic"),
      externalCard("blog_traffic", "Blog traffic"),
      externalCard("search_traffic", "Search traffic"),
    ],
    growth: [
      externalCard("x_impressions", "X impressions"),
      externalCard("x_followers", "X followers"),
      card("Creator leads (30d)", creatorLeads),
      card("Community opportunities (30d)", communityOpps),
      card("Reddit replies posted", redditPosted),
    ],
    content: [
      card("Calendar items (7d)", calendarWeek),
      card("Published total", calendarPublished),
    ],
    seo: [
      card("Keywords tracked", seoKeywords),
      card("Topics in bank", seoTopics),
      card("Blog drafts", seoDrafts),
      card("Blogs published", seoPublished),
    ],
    approvals: [
      card("Pending now", approvalsPending),
      card("Approved all-time", approvalsApproved),
      card("Rejected all-time", approvalsRejected),
      approvalConversion === null
        ? { label: "Approval conversion", value: "No decisions yet" }
        : { label: "Approval conversion", value: `${approvalConversion}%`, hint: "approved / decided" },
    ],
    agents: agentCards,
    workflows: [
      card("Agent runs (24h)", runsToday),
      card("Handoffs (24h)", handoffsToday),
      card("Tasks waiting", tasksPending),
    ],
    leaderboard,
  };
}
