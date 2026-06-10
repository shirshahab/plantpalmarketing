import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type HQProbeStep = {
  id: string;
  area: string;
  label: string;
  table: string;
  columns?: string[];
  ok: boolean;
  rowCount: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  durationMs: number;
};

export type HQProbeResult = {
  configured: boolean;
  liveDataOk: boolean;
  failedStep: HQProbeStep | null;
  steps: HQProbeStep[];
  summary: string;
};

export type DatabaseTableCheck = {
  area: string;
  tableName: string;
  exists: boolean;
  rowCount: number | null;
  requiredColumns: string[];
  columnsPresent: boolean;
  missingColumns: string[];
  queryOk: boolean;
  errorCode: string | null;
  errorMessage: string | null;
};

const HQ_PROBE_DEFINITIONS: {
  id: string;
  area: string;
  label: string;
  table: string;
  columns?: string[];
  run: (sb: ReturnType<typeof createServerClient>) => Promise<{ error: { code?: string; message: string } | null; count: number | null }>;
}[] = [
  {
    id: "scout_stats",
    area: "Scout",
    label: "getScoutStats → creator_leads count",
    table: "creator_leads",
    run: async (sb) => {
      const r = await sb.from("creator_leads").select("*", { count: "exact", head: true });
      return { error: r.error, count: r.count };
    },
  },
  {
    id: "scout_leads",
    area: "Scout",
    label: "getCreatorLeads",
    table: "creator_leads",
    run: async (sb) => {
      const r = await sb.from("creator_leads").select("*").limit(5);
      return { error: r.error, count: r.data?.length ?? null };
    },
  },
  {
    id: "scout_partnerships",
    area: "Scout",
    label: "getCreatorPartnerships",
    table: "creator_partnerships",
    run: async (sb) => {
      const r = await sb.from("creator_partnerships").select("*").limit(5);
      return { error: r.error, count: r.data?.length ?? null };
    },
  },
  {
    id: "roots_stats",
    area: "Roots",
    label: "getRootsStats → community_mentions count",
    table: "community_mentions",
    run: async (sb) => {
      const r = await sb.from("community_mentions").select("*", { count: "exact", head: true });
      return { error: r.error, count: r.count };
    },
  },
  {
    id: "roots_opportunities",
    area: "Roots",
    label: "community_opportunities (HQ recent opps)",
    table: "community_opportunities",
    columns: ["question", "sentiment", "opportunity_score", "opportunity_type", "mention_id"],
    run: async (sb) => {
      const r = await sb
        .from("community_opportunities")
        .select("id, platform, author, post, topic, question, sentiment, urgency_score, opportunity_score, opportunity_type, suggested_reply, mention_id, status, created_at, updated_at")
        .order("urgency_score", { ascending: false })
        .limit(5);
      return { error: r.error, count: r.data?.length ?? null };
    },
  },
  {
    id: "roots_reply_drafts",
    area: "Roots",
    label: "getCommunityReplyDrafts",
    table: "community_reply_drafts",
    run: async (sb) => {
      const r = await sb.from("community_reply_drafts").select("*").limit(5);
      return { error: r.error, count: r.data?.length ?? null };
    },
  },
  {
    id: "scout_activity",
    area: "HQ activity feed",
    label: "getAgentActivityLog(scout) — REQUIRED for live HQ",
    table: "agent_activity_log",
    columns: ["agent_id", "action", "detail", "metadata"],
    run: async (sb) => {
      const r = await sb.from("agent_activity_log").select("*").eq("agent_id", "scout").order("created_at", { ascending: false }).limit(8);
      return { error: r.error, count: r.data?.length ?? null };
    },
  },
  {
    id: "roots_activity",
    area: "HQ activity feed",
    label: "getAgentActivityLog(roots) — REQUIRED for live HQ",
    table: "agent_activity_log",
    columns: ["agent_id", "action", "detail", "metadata"],
    run: async (sb) => {
      const r = await sb.from("agent_activity_log").select("*").eq("agent_id", "roots").order("created_at", { ascending: false }).limit(8);
      return { error: r.error, count: r.data?.length ?? null };
    },
  },
  {
    id: "sentinel_scoreboard",
    area: "Sentinel",
    label: "getCompetitorScoreboard",
    table: "competitor_scoreboard",
    run: async (sb) => {
      const r = await sb.from("competitor_scoreboard").select("*").limit(5);
      return { error: r.error, count: r.data?.length ?? null };
    },
  },
  {
    id: "sentinel_alerts",
    area: "Sentinel",
    label: "getCompetitorIntelAlerts",
    table: "competitor_intel_alerts",
    run: async (sb) => {
      const r = await sb.from("competitor_intel_alerts").select("*").limit(5);
      return { error: r.error, count: r.data?.length ?? null };
    },
  },
  {
    id: "sentinel_briefs",
    area: "Sentinel",
    label: "getLatestCompetitorBrief",
    table: "competitor_daily_briefs",
    run: async (sb) => {
      const r = await sb.from("competitor_daily_briefs").select("*").limit(1);
      return { error: r.error, count: r.data?.length ?? null };
    },
  },
  {
    id: "sentinel_activity",
    area: "Sentinel",
    label: "getSentinelActivity (optional — .catch in HQ)",
    table: "agent_activity_log",
    run: async (sb) => {
      const r = await sb.from("agent_activity_log").select("*").eq("agent_id", "sentinel").limit(5);
      return { error: r.error, count: r.data?.length ?? null };
    },
  },
  {
    id: "agent_messages",
    area: "Agent messages",
    label: "getAgentMessages (optional — .catch in HQ)",
    table: "agent_messages",
    run: async (sb) => {
      const r = await sb.from("agent_messages").select("*").limit(5);
      return { error: r.error, count: r.data?.length ?? null };
    },
  },
  {
    id: "agent_tasks",
    area: "Agent tasks",
    label: "getAgentTasks (optional — .catch in HQ)",
    table: "agent_tasks",
    run: async (sb) => {
      const r = await sb.from("agent_tasks").select("*").limit(5);
      return { error: r.error, count: r.data?.length ?? null };
    },
  },
  {
    id: "agent_events",
    area: "Agent events",
    label: "getAgentEvents (optional — .catch in HQ)",
    table: "agent_events",
    run: async (sb) => {
      const r = await sb.from("agent_events").select("*").limit(5);
      return { error: r.error, count: r.data?.length ?? null };
    },
  },
];

export async function probeHQLiveData(): Promise<HQProbeResult> {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      liveDataOk: false,
      failedStep: null,
      steps: [],
      summary: "Supabase not configured in .env.local",
    };
  }

  const sb = createServerClient();
  const steps: HQProbeStep[] = [];
  let failedStep: HQProbeStep | null = null;

  for (const def of HQ_PROBE_DEFINITIONS) {
    const start = Date.now();
    let step: HQProbeStep;
    try {
      const result = await def.run(sb);
      step = {
        id: def.id,
        area: def.area,
        label: def.label,
        table: def.table,
        columns: def.columns,
        ok: !result.error,
        rowCount: result.count,
        errorCode: result.error?.code ?? null,
        errorMessage: result.error?.message ?? null,
        durationMs: Date.now() - start,
      };
    } catch (e) {
      step = {
        id: def.id,
        area: def.area,
        label: def.label,
        table: def.table,
        columns: def.columns,
        ok: false,
        rowCount: null,
        errorCode: "EXCEPTION",
        errorMessage: e instanceof Error ? e.message : String(e),
        durationMs: Date.now() - start,
      };
    }
    steps.push(step);

    const isRequired =
      def.id === "scout_activity" ||
      def.id === "roots_activity" ||
      def.id === "scout_leads" ||
      def.id === "roots_opportunities" ||
      def.id === "roots_reply_drafts" ||
      def.id === "scout_partnerships";

    if (!step.ok && isRequired && !failedStep) {
      failedStep = step;
    }
  }

  const requiredIds = ["scout_activity", "roots_activity", "scout_leads", "roots_opportunities", "roots_reply_drafts", "scout_partnerships"];
  const liveDataOk = requiredIds.every((id) => steps.find((s) => s.id === id)?.ok);

  return {
    configured: true,
    liveDataOk,
    failedStep: failedStep ?? steps.find((s) => !s.ok && requiredIds.includes(s.id)) ?? null,
    steps,
    summary: liveDataOk
      ? "All required HQ probes passed — live mode should work."
      : failedStep
        ? `HQ demo mode cause: ${failedStep.label} failed on table "${failedStep.table}" — ${failedStep.errorMessage}`
        : "One or more required HQ probes failed.",
  };
}

const DATABASE_CHECKS: { area: string; tableName: string; requiredColumns: string[]; select: string }[] = [
  { area: "Scout", tableName: "creator_leads", requiredColumns: ["partnership_score", "priority", "partnership_status", "suggested_ideas"], select: "id, partnership_score, priority, partnership_status, suggested_ideas" },
  { area: "Scout", tableName: "creator_partnerships", requiredColumns: ["creator_lead_id", "title", "idea_type", "status"], select: "id, creator_lead_id, title, idea_type, status" },
  { area: "Roots", tableName: "community_mentions", requiredColumns: ["platform", "author", "content", "sentiment"], select: "id, platform, author, content, sentiment" },
  { area: "Roots", tableName: "community_opportunities", requiredColumns: ["question", "sentiment", "opportunity_score", "opportunity_type", "mention_id"], select: "id, question, sentiment, opportunity_score, opportunity_type, mention_id" },
  { area: "Roots", tableName: "community_reply_drafts", requiredColumns: ["opportunity_id", "draft", "status"], select: "id, opportunity_id, draft, status" },
  { area: "HQ activity feed", tableName: "agent_activity_log", requiredColumns: ["agent_id", "action", "detail", "metadata"], select: "id, agent_id, action, detail, metadata" },
  { area: "Sentinel", tableName: "competitor_scoreboard", requiredColumns: ["name", "threat_level", "review_trend"], select: "id, name, threat_level, review_trend" },
  { area: "Sentinel", tableName: "competitor_intel_alerts", requiredColumns: ["competitor", "alert_type", "severity", "status"], select: "id, competitor, alert_type, severity, status" },
  { area: "Sentinel", tableName: "competitor_daily_briefs", requiredColumns: ["biggest_threat", "alerts_count"], select: "id, biggest_threat, alerts_count" },
  { area: "Agent messages", tableName: "agent_messages", requiredColumns: ["from_agent", "to_agent", "message_type", "status"], select: "id, from_agent, to_agent, message_type, status" },
  { area: "Agent tasks", tableName: "agent_tasks", requiredColumns: ["assigned_to", "task_type", "status"], select: "id, assigned_to, task_type, status" },
  { area: "Agent events", tableName: "agent_events", requiredColumns: ["event_type", "source_agent", "title"], select: "id, event_type, source_agent, title" },
];

function parseMissingColumn(errorMessage: string | null): string[] {
  if (!errorMessage) return [];
  const m = errorMessage.match(/column ['"]?([\w.]+)['"]? does not exist/i);
  if (m) return [m[1].replace(/^.*\./, "")];
  if (errorMessage.includes("schema cache")) return ["TABLE_MISSING"];
  return [];
}

export async function runDatabaseHealthChecks(): Promise<DatabaseTableCheck[]> {
  if (!isSupabaseConfigured()) return [];

  const sb = createServerClient();
  const results: DatabaseTableCheck[] = [];

  for (const check of DATABASE_CHECKS) {
    const r = await sb.from(check.tableName as "creator_leads").select(check.select).limit(1);
    const missingColumns = parseMissingColumn(r.error?.message ?? null);
    const tableMissing = missingColumns.includes("TABLE_MISSING");

    results.push({
      area: check.area,
      tableName: check.tableName,
      exists: !tableMissing && !r.error,
      rowCount: r.error ? null : (await sb.from(check.tableName as "creator_leads").select("*", { count: "exact", head: true })).count,
      requiredColumns: check.requiredColumns,
      columnsPresent: !r.error && missingColumns.length === 0,
      missingColumns: tableMissing ? ["*table*"] : missingColumns,
      queryOk: !r.error,
      errorCode: r.error?.code ?? null,
      errorMessage: r.error?.message ?? null,
    });
  }

  return results;
}

export const HQ_DEMO_MODE_CONDITION = "configured === true AND getHQAgentData() throws — liveData stays false, catch swallows error (page.tsx lines 25-45)";

export const AGENT_ACTIVITY_LOG_FIX_SQL = `-- Missing table confirmed: public.agent_activity_log
CREATE TABLE IF NOT EXISTS public.agent_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  action TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_activity_agent
  ON public.agent_activity_log(agent_id, created_at DESC);

ALTER TABLE public.agent_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketing_os_all_agent_activity" ON public.agent_activity_log;
CREATE POLICY "marketing_os_all_agent_activity"
  ON public.agent_activity_log FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.agent_activity_log (agent_id, action, detail)
SELECT v.agent_id, v.action, v.detail
FROM (VALUES
  ('scout', 'found_creator', 'Scout found creator: @gardenmomdaily — partnership score 91'),
  ('roots', 'found_discussion', 'Roots found discussion: "My monstera is dying."'),
  ('sentinel', 'alert_detected', 'Sentinel alert: Planta Smart Water feature launch — severity high')
) AS v(agent_id, action, detail)
WHERE NOT EXISTS (
  SELECT 1 FROM public.agent_activity_log a WHERE a.agent_id = v.agent_id AND a.detail = v.detail
);`;
