import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import { getContentWorkflow } from "@/lib/workflow/engine";
import type { F5BotAlertRow, IntelligenceOpportunityRow } from "@/lib/intelligence/f5bot-types";

function mapAlert(row: Record<string, unknown>): F5BotAlertRow {
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
}

export async function getIntelligencePageData(): Promise<IntelligencePageData> {
  const supabase = createServerClient();
  const empty: IntelligencePageData = { alerts: [], opportunities: [], routing: [] };

  try {
    const [{ data: alertRows }, { data: oppRows }] = await Promise.all([
      supabase
        .from("f5bot_alerts")
        .select("*")
        .order("received_at", { ascending: false })
        .limit(50),
      supabase
        .from("intelligence_opportunities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const alerts = (alertRows ?? []).map((r) => mapAlert(r as Record<string, unknown>));
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

    return { alerts, opportunities, routing };
  } catch (e) {
    if (e && typeof e === "object" && "message" in e && isMissingTableError(e as { message: string })) {
      return empty;
    }
    return empty;
  }
}

export async function getHighPriorityF5BotInboxAlerts(): Promise<F5BotAlertRow[]> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("f5bot_alerts")
      .select("*")
      .in("status", ["new", "processed"])
      .order("received_at", { ascending: false })
      .limit(20);

    const alerts = (data ?? []).map((r) => mapAlert(r as Record<string, unknown>));
    return alerts.filter((a) => {
      const blob = `${a.title} ${a.body}`.toLowerCase();
      return (
        blob.includes("?") ||
        blob.includes("yellow") ||
        blob.includes("dying") ||
        blob.includes("planta") ||
        blob.includes("picturethis")
      );
    }).slice(0, 10);
  } catch {
    return [];
  }
}
