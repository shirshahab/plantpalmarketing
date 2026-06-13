import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import { computeInternetPulse, type InternetPulse } from "@/lib/intelligence/internet-pulse";
import { computeTrendClusters, type TrendCluster } from "@/lib/intelligence/trend-clusters";
import {
  getSavedIntelligenceAlerts,
  type SavedIntelligenceAlert,
} from "@/lib/intelligence/saved-alerts-queries";

export type IntelligenceScoreLevel = "Low" | "Medium" | "High" | "Very High";

export interface AgentInboxCount {
  agent: string;
  label: string;
  count: number;
  classification: string;
}

export interface IntelligenceMetrics {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  topSubreddits: Array<{ name: string; count: number }>;
  topKeywords: Array<{ keyword: string; count: number }>;
  topCompetitors: Array<{ name: string; count: number }>;
  mostActiveAgent: string | null;
  mostCommonProblem: string | null;
}

export interface InternetPulseDashboard {
  pulse: InternetPulse;
  score: IntelligenceScoreLevel;
  scoreValue: number;
  agentCounts: AgentInboxCount[];
  clusters: TrendCluster[];
  metrics: IntelligenceMetrics;
  lastRunAt: string | null;
  hasRealData: boolean;
}

const AGENT_ROUTING: Array<{ agent: string; label: string; classification: string }> = [
  { agent: "roots", label: "Roots", classification: "community_opportunity" },
  { agent: "bloom", label: "Bloom", classification: "content_idea" },
  { agent: "sentinel", label: "Sentinel", classification: "competitor_alert" },
  { agent: "oak", label: "Oak", classification: "creator_opportunity" },
  { agent: "echo", label: "Echo", classification: "product_feedback" },
];

const COMPETITOR_NAMES = ["planta", "picturethis", "plantsnap", "greg"];

function isWithinDays(iso: string, days: number): boolean {
  return new Date(iso).getTime() >= Date.now() - days * 24 * 60 * 60 * 1000;
}

export function computeIntelligenceScore(pulse: InternetPulse, recentCount: number): {
  score: IntelligenceScoreLevel;
  scoreValue: number;
} {
  const scoreValue =
    pulse.contentOpportunities * 3 +
    pulse.seoOpportunities * 2 +
    pulse.creatorOpportunities * 4 +
    pulse.communityQuestions * 2 +
    pulse.competitorMentions * 2 +
    Math.min(recentCount, 20);

  let score: IntelligenceScoreLevel = "Low";
  if (scoreValue >= 40) score = "Very High";
  else if (scoreValue >= 25) score = "High";
  else if (scoreValue >= 12) score = "Medium";

  return { score, scoreValue };
}

function computeAgentCounts(alerts: SavedIntelligenceAlert[]): AgentInboxCount[] {
  return AGENT_ROUTING.map(({ agent, label, classification }) => ({
    agent,
    label,
    classification,
    count: alerts.filter(
      (a) =>
        a.classification === classification &&
        a.status === "new" &&
        a.assignedAgent === agent
    ).length,
  }));
}

function computeMetrics(alerts: SavedIntelligenceAlert[]): IntelligenceMetrics {
  const subredditCounts = new Map<string, number>();
  const keywordCounts = new Map<string, number>();
  const competitorCounts = new Map<string, number>();
  const agentCounts = new Map<string, number>();
  const problemCounts = new Map<string, number>();

  for (const alert of alerts) {
    if (alert.subreddit) {
      subredditCounts.set(alert.subreddit, (subredditCounts.get(alert.subreddit) ?? 0) + 1);
    }
    for (const kw of alert.title.toLowerCase().split(/\s+/).filter((w) => w.length > 4)) {
      keywordCounts.set(kw, (keywordCounts.get(kw) ?? 0) + 1);
    }
    const blob = alert.title.toLowerCase();
    for (const c of COMPETITOR_NAMES) {
      if (blob.includes(c)) competitorCounts.set(c, (competitorCounts.get(c) ?? 0) + 1);
    }
    if (alert.assignedAgent) {
      agentCounts.set(alert.assignedAgent, (agentCounts.get(alert.assignedAgent) ?? 0) + 1);
    }
    if (alert.classification === "community_opportunity") {
      const key = alert.title.slice(0, 60).toLowerCase();
      problemCounts.set(key, (problemCounts.get(key) ?? 0) + 1);
    }
  }

  const topN = <T extends string>(map: Map<T, number>, keyName: "name" | "keyword") =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k, count]) =>
        keyName === "name" ? { name: k, count } : { keyword: k, count }
      );

  const mostActiveAgent =
    [...agentCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const mostCommonProblem =
    [...problemCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    total: alerts.length,
    today: alerts.filter((a) => isWithinDays(a.createdAt, 1)).length,
    thisWeek: alerts.filter((a) => isWithinDays(a.createdAt, 7)).length,
    thisMonth: alerts.filter((a) => isWithinDays(a.createdAt, 30)).length,
    topSubreddits: topN(subredditCounts, "name") as Array<{ name: string; count: number }>,
    topKeywords: topN(keywordCounts, "keyword") as Array<{ keyword: string; count: number }>,
    topCompetitors: topN(competitorCounts, "name") as Array<{ name: string; count: number }>,
    mostActiveAgent,
    mostCommonProblem,
  };
}

async function getLastRunAt(): Promise<string | null> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("intelligence_runs")
      .select("completed_at, started_at")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return null;
    return String(data.completed_at ?? data.started_at);
  } catch {
    return null;
  }
}

/** Full Internet Pulse dashboard from real Supabase alerts only. */
export async function getInternetPulseDashboard(): Promise<InternetPulseDashboard> {
  const emptyPulse: InternetPulse = {
    trendingTopics: [],
    trendingKeywords: [],
    contentOpportunities: 0,
    seoOpportunities: 0,
    competitorMentions: 0,
    communityQuestions: 0,
    creatorOpportunities: 0,
    newDiscussions: 0,
    lastUpdatedAt: null,
  };

  const empty: InternetPulseDashboard = {
    pulse: emptyPulse,
    score: "Low",
    scoreValue: 0,
    agentCounts: AGENT_ROUTING.map(({ agent, label, classification }) => ({
      agent,
      label,
      classification,
      count: 0,
    })),
    clusters: [],
    metrics: {
      total: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      topSubreddits: [],
      topKeywords: [],
      topCompetitors: [],
      mostActiveAgent: null,
      mostCommonProblem: null,
    },
    lastRunAt: null,
    hasRealData: false,
  };

  try {
    const [{ alerts }, lastRunAt] = await Promise.all([
      getSavedIntelligenceAlerts({}, 500),
      getLastRunAt(),
    ]);

    if (alerts.length === 0) {
      return { ...empty, lastRunAt };
    }

    const pulse = computeInternetPulse(alerts);
    const recentWeek = alerts.filter((a) => isWithinDays(a.createdAt, 7));
    const { score, scoreValue } = computeIntelligenceScore(pulse, recentWeek.length);

    return {
      pulse,
      score,
      scoreValue,
      agentCounts: computeAgentCounts(alerts),
      clusters: computeTrendClusters(alerts),
      metrics: computeMetrics(alerts),
      lastRunAt,
      hasRealData: true,
    };
  } catch (e) {
    if (e && typeof e === "object" && "message" in e && isMissingTableError(e as { message: string })) {
      return empty;
    }
    return empty;
  }
}
