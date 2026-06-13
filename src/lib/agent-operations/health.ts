import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";

export type AgentOperationsHealthStatus = "ready" | "partial" | "not_configured";

export interface IntelligenceRunSummary {
  id: string;
  startedAt: string;
  completedAt: string | null;
  fetchedCount: number;
  insertedCount: number;
  duplicateCount: number;
  errorCount: number;
  status: string;
}

export interface AgentOperationsHealth {
  cronSecretSet: boolean;
  f5botEnabled: boolean;
  f5botFeedSet: boolean;
  lastIntelligenceRun: IntelligenceRunSummary | null;
  recentRuns: IntelligenceRunSummary[];
  environment: "local" | "production";
  vercelCronConfigured: boolean | "unknown";
  status: AgentOperationsHealthStatus;
}

function envPresent(name: string): boolean {
  const v = process.env[name]?.trim() ?? "";
  return v.length > 0 && !v.toLowerCase().includes("your_");
}

function mapRun(row: Record<string, unknown>): IntelligenceRunSummary {
  return {
    id: String(row.id),
    startedAt: String(row.started_at),
    completedAt: row.completed_at ? String(row.completed_at) : null,
    fetchedCount: Number(row.fetched_count ?? 0),
    insertedCount: Number(row.inserted_count ?? 0),
    duplicateCount: Number(row.duplicate_count ?? 0),
    errorCount: Number(row.error_count ?? 0),
    status: String(row.status ?? "unknown"),
  };
}

export async function getAgentOperationsHealth(): Promise<AgentOperationsHealth> {
  const cronSecretSet = envPresent("CRON_SECRET");
  const f5botEnabled = process.env.F5BOT_ENABLED === "true";
  const f5botFeedSet = envPresent("F5BOT_JSON_FEED_URL");
  const environment = process.env.VERCEL === "1" ? "production" : "local";

  let recentRuns: IntelligenceRunSummary[] = [];
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("intelligence_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(10);
    if (!error) recentRuns = (data ?? []).map((r) => mapRun(r as Record<string, unknown>));
  } catch {
    // table may not exist
  }

  let status: AgentOperationsHealthStatus = "not_configured";
  if (cronSecretSet && f5botEnabled && f5botFeedSet) status = "ready";
  else if (cronSecretSet || f5botEnabled || f5botFeedSet) status = "partial";

  return {
    cronSecretSet,
    f5botEnabled,
    f5botFeedSet,
    lastIntelligenceRun: recentRuns[0] ?? null,
    recentRuns,
    environment,
    vercelCronConfigured: environment === "production" ? true : "unknown",
    status,
  };
}

export async function getIntelligenceRuns(limit = 10): Promise<IntelligenceRunSummary[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("intelligence_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(limit);
    if (error) {
      if (isMissingTableError(error)) return [];
      throw error;
    }
    return (data ?? []).map((r) => mapRun(r as Record<string, unknown>));
  } catch {
    return [];
  }
}
