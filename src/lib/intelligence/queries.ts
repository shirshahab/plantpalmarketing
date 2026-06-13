import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import { getContentWorkflow } from "@/lib/workflow/engine";
import type {
  F5BotAlertRow,
  IntelligenceAlertRow,
  IntelligenceDashboardStats,
  IntelligenceOpportunityRow,
} from "@/lib/intelligence/f5bot-types";

function mapIntelligenceAlert(row: Record<string, unknown>): IntelligenceAlertRow {
  return {
    id: String(row.id),
    source: String(row.source ?? ""),
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    url: String(row.url ?? ""),
    author: String(row.author ?? ""),
    subreddit: String(row.subreddit ?? ""),
    createdAt: String(row.created_at ?? row.received_at),
    classification: String(row.classification ?? "community_opportunity") as IntelligenceAlertRow["classification"],
    priority: (String(row.priority ?? "medium") as IntelligenceAlertRow["priority"]),
    assignedAgent: String(row.assigned_agent ?? ""),
    status: String(row.status ?? "new"),
    externalId: String(row.external_id ?? ""),
    receivedAt: String(row.received_at ?? row.created_at),
  };
}

/** Map intelligence_alerts row to legacy F5BotAlertRow for UI compatibility. */
function toLegacyAlert(row: IntelligenceAlertRow): F5BotAlertRow {
  return {
    id: row.id,
    externalId: row.externalId,
    source: row.source,
    sourceUrl: row.url,
    title: row.title,
    body: row.body,
    author: row.author,
    matchedKeyword: row.subreddit ? `r/${row.subreddit}` : "",
    keywordGroup: row.classification,
    publishedAt: row.createdAt,
    receivedAt: row.receivedAt,
    status: row.status,
    dataSource: "f5bot",
    createdAt: row.createdAt,
    classification: row.classification,
    priority: row.priority,
    assignedAgent: row.assignedAgent,
    subreddit: row.subreddit,
  };
}

function mapOpportunity(row: Record<string, unknown>): IntelligenceOpportunityRow {
  return {
    id: String(row.id),
    sourceType: String(row.source_type),
    sourceTable: String(row.source_table),
    sourceId: String(row.source_id),
    platform: String(row.platform ?? ""),
    title: String(row.title ?? ""),
    summary: String(row.summary ?? ""),
    opportunityType: String(row.opportunity_type),
    priority: String(row.priority),
    recommendedAgent: String(row.recommended_agent),
    suggestedAction: String(row.suggested_action),
    sourceUrl: String(row.source_url ?? ""),
    status: String(row.status),
    workflowId: row.workflow_id ? String(row.workflow_id) : null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
  };
}

export interface IntelligenceRoutingRow {
  opportunityId: string;
  title: string;
  assignedAgent: string;
  currentStage: string;
  nextAction: string;
  sourceUrl: string;
}

export interface IntelligencePageData {
  alerts: F5BotAlertRow[];
  opportunities: IntelligenceOpportunityRow[];
  routing: IntelligenceRoutingRow[];
  stats: IntelligenceDashboardStats;
  hasRealData: boolean;
}

async function loadAlertsFromTable(
  supabase: ReturnType<typeof createServerClient>,
  table: "intelligence_alerts" | "f5bot_alerts"
): Promise<F5BotAlertRow[]> {
  const { data } = await supabase.from(table).select("*").order("received_at", { ascending: false }).limit(50);
  if (!data?.length) return [];

  if (table === "intelligence_alerts") {
    return data.map((r) => toLegacyAlert(mapIntelligenceAlert(r as Record<string, unknown>)));
  }

  return (data ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: String(row.id),
      externalId: String(row.external_id),
      source: String(row.source ?? ""),
      sourceUrl: String(row.source_url ?? ""),
      title: String(row.title ?? ""),
      body: String(row.body ?? ""),
      author: String(row.author ?? ""),
      matchedKeyword: String(row.matched_keyword ?? ""),
      keywordGroup: String(row.keyword_group ?? ""),
      publishedAt: row.published_at ? String(row.published_at) : null,
      receivedAt: String(row.received_at ?? row.created_at),
      status: String(row.status ?? "new"),
      dataSource: String(row.data_source ?? "f5bot"),
      createdAt: String(row.created_at),
    };
  });
}

async function getDashboardStats(
  supabase: ReturnType<typeof createServerClient>
): Promise<IntelligenceDashboardStats> {
  const empty: IntelligenceDashboardStats = {
    newAlerts: 0,
    communityOpportunities: 0,
    contentIdeas: 0,
    competitorAlerts: 0,
    seoOpportunities: 0,
  };

  try {
    const { data } = await supabase.from("intelligence_alerts").select("status, classification");
    if (!data?.length) return empty;

    for (const row of data) {
      const status = String(row.status);
      const classification = String(row.classification);
      if (status === "new") empty.newAlerts += 1;
      if (classification === "community_opportunity" && status !== "ignored") {
        empty.communityOpportunities += 1;
      }
      if (classification === "content_idea" && status !== "ignored") empty.contentIdeas += 1;
      if (classification === "competitor_alert" && status !== "ignored") empty.competitorAlerts += 1;
      if (classification === "seo_topic" && status !== "ignored") empty.seoOpportunities += 1;
    }
    return empty;
  } catch {
    return empty;
  }
}

export async function getIntelligencePageData(): Promise<IntelligencePageData> {
  const supabase = createServerClient();
  const empty: IntelligencePageData = {
    alerts: [],
    opportunities: [],
    routing: [],
    stats: {
      newAlerts: 0,
      communityOpportunities: 0,
      contentIdeas: 0,
      competitorAlerts: 0,
      seoOpportunities: 0,
    },
    hasRealData: false,
  };

  try {
    let alerts = await loadAlertsFromTable(supabase, "intelligence_alerts");
    if (alerts.length === 0) {
      alerts = await loadAlertsFromTable(supabase, "f5bot_alerts");
    }

    const [{ data: oppRows }, stats] = await Promise.all([
      supabase
        .from("intelligence_opportunities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
      getDashboardStats(supabase),
    ]);

    const opportunities = (oppRows ?? []).map((r) => mapOpportunity(r as Record<string, unknown>));

    const routing: IntelligenceRoutingRow[] = [];
    for (const opp of opportunities.slice(0, 20)) {
      const wf = await getContentWorkflow(opp.sourceTable, opp.sourceId);
      routing.push({
        opportunityId: opp.id,
        title: opp.title,
        assignedAgent: wf?.assignedAgent ?? opp.recommendedAgent,
        currentStage: wf?.currentStage ?? opp.status,
        nextAction: wf?.nextAction ?? opp.suggestedAction,
        sourceUrl: opp.sourceUrl,
      });
    }

    return {
      alerts,
      opportunities,
      routing,
      stats,
      hasRealData: alerts.length > 0,
    };
  } catch (e) {
    if (e && typeof e === "object" && "message" in e && isMissingTableError(e as { message: string })) {
      return empty;
    }
    return empty;
  }
}

/** Founder Inbox — Live Intelligence: high-priority F5Bot alerts only. */
export async function getHighPriorityF5BotInboxAlerts(): Promise<F5BotAlertRow[]> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("intelligence_alerts")
      .select("*")
      .eq("priority", "high")
      .neq("status", "ignored")
      .neq("classification", "ignore")
      .order("received_at", { ascending: false })
      .limit(15);

    if (data?.length) {
      return data.map((r) => toLegacyAlert(mapIntelligenceAlert(r as Record<string, unknown>)));
    }

    const { data: legacy } = await supabase
      .from("f5bot_alerts")
      .select("*")
      .in("status", ["new", "processed"])
      .order("received_at", { ascending: false })
      .limit(20);

    return (legacy ?? [])
      .map((r) => {
        const row = r as Record<string, unknown>;
        return {
          id: String(row.id),
          externalId: String(row.external_id),
          source: String(row.source ?? ""),
          sourceUrl: String(row.source_url ?? ""),
          title: String(row.title ?? ""),
          body: String(row.body ?? ""),
          author: String(row.author ?? ""),
          matchedKeyword: String(row.matched_keyword ?? ""),
          keywordGroup: String(row.keyword_group ?? ""),
          publishedAt: row.published_at ? String(row.published_at) : null,
          receivedAt: String(row.received_at ?? row.created_at),
          status: String(row.status ?? "new"),
          dataSource: "f5bot",
          createdAt: String(row.created_at),
        };
      })
      .filter((a) => {
        const blob = `${a.title} ${a.body}`.toLowerCase();
        return blob.includes("?") || blob.includes("planta") || blob.includes("picturethis");
      })
      .slice(0, 10);
  } catch {
    return [];
  }
}
