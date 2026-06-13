import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import { getCreativeRoutingHealth } from "@/lib/pipeline/creative-routing-health";
import { auditDemoContent } from "@/lib/pipeline/demo-audit";
import { getContentRouterData } from "@/lib/pipeline/content-router-queries";
import { getLastSeoFactoryRun } from "@/lib/db/seo-queries";

export type PipelineHealth = "healthy" | "stalled" | "broken";

export interface SystemPipelineStatus {
  id: string;
  label: string;
  flow: string;
  status: PipelineHealth;
  waiting: number;
  lastSuccess: string | null;
  lastFailure: string | null;
  failureReason: string | null;
}

type Filter = { column: string; op: "eq" | "in" | "neq"; value: string | string[] };

async function countTable(table: string, filters: Filter[] = []): Promise<number> {
  try {
    const supabase = createServerClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabase.from(table).select("*", { count: "exact", head: true });
    for (const f of filters) {
      if (f.op === "eq") q = q.eq(f.column, f.value);
      if (f.op === "in") q = q.in(f.column, f.value);
      if (f.op === "neq") q = q.neq(f.column, f.value);
    }
    const { count, error } = await q;
    if (error) {
      if (isMissingTableError(error)) return -1;
      return 0;
    }
    return count ?? 0;
  } catch {
    return -1;
  }
}

async function lastRun(table: string): Promise<{ at: string | null; status: string | null; error: string | null }> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase.from(table).select("*").order("started_at", { ascending: false }).limit(1).maybeSingle();
    if (!data) return { at: null, status: null, error: null };
    const row = data as Record<string, unknown>;
    return {
      at: String(row.completed_at ?? row.started_at ?? ""),
      status: String(row.status ?? ""),
      error: String(row.error_message ?? ""),
    };
  } catch {
    return { at: null, status: null, error: null };
  }
}

function healthFrom(waiting: number, tableMissing: boolean, lastStatus: string | null): PipelineHealth {
  if (tableMissing) return "broken";
  if (waiting > 0 && lastStatus === "failed") return "stalled";
  if (waiting > 20) return "stalled";
  return "healthy";
}

async function lastAgentRun(agentId: string): Promise<{ at: string | null; status: string | null; error: string | null }> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("agent_runs")
      .select("*")
      .eq("agent_id", agentId)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return { at: null, status: null, error: null };
    const row = data as Record<string, unknown>;
    return {
      at: String(row.completed_at ?? row.started_at ?? ""),
      status: String(row.status ?? ""),
      error: String(row.error_message ?? ""),
    };
  } catch {
    return { at: null, status: null, error: null };
  }
}

async function countInboxMissingSourceUrl(): Promise<number> {
  try {
    const supabase = createServerClient();
    const { count, error } = await supabase
      .from("intelligence_alerts")
      .select("*", { count: "exact", head: true })
      .eq("priority", "high")
      .neq("status", "archived")
      .or("url.is.null,url.eq.");
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getSystemPipelineHealth(): Promise<SystemPipelineStatus[]> {
  const [
    ideasWaiting,
    bloomWaiting,
    videoWaiting,
    imageWaiting,
    seoWaiting,
    redditWaiting,
    intelWaiting,
    trendCount,
    f5Run,
    creativeRouting,
    demoAudit,
    contentRouter,
    inboxMissingUrl,
    lastScoutRun,
    blogPostCount,
    lastSeoFactory,
  ] = await Promise.all([
    countTable("creative_content_ideas", [{ column: "status", op: "eq", value: "pending" }]),
    countTable("content_pipeline", [
      { column: "destination", op: "eq", value: "bloom" },
      { column: "status", op: "eq", value: "approved" },
    ]),
    countTable("video_generation_queue", [{ column: "status", op: "eq", value: "pending" }]),
    countTable("image_prompts", [{ column: "status", op: "eq", value: "pending" }]),
    countTable("seo_blog_posts", [{ column: "status", op: "in", value: ["gate_review", "draft", "pending_review"] }]),
    countTable("reddit_reply_drafts", [{ column: "status", op: "eq", value: "pending_approval" }]),
    countTable("intelligence_alerts", [{ column: "status", op: "eq", value: "new" }]),
    countTable("intelligence_alerts", [{ column: "status", op: "neq", value: "archived" }]),
    lastRun("intelligence_runs"),
    getCreativeRoutingHealth(),
    auditDemoContent(),
    getContentRouterData(),
    countInboxMissingSourceUrl(),
    lastAgentRun("scout"),
    countTable("seo_blog_posts", [{ column: "status", op: "in", value: ["draft", "gate_review", "pending_review"] }]),
    getLastSeoFactoryRun(),
  ]);

  return [
    {
      id: "ideas-bloom",
      label: "Ideas → Bloom",
      flow: "Founder approved ideas into Bloom production",
      status: healthFrom(bloomWaiting, bloomWaiting < 0, null),
      waiting: Math.max(0, bloomWaiting),
      lastSuccess: null,
      lastFailure: null,
      failureReason: bloomWaiting < 0 ? "content_pipeline table missing. Run migration 064." : null,
    },
    {
      id: "bloom-video",
      label: "Bloom → Video",
      flow: "Approved content into video generation queue",
      status: healthFrom(videoWaiting, videoWaiting < 0, null),
      waiting: Math.max(0, videoWaiting),
      lastSuccess: null,
      lastFailure: null,
      failureReason: videoWaiting < 0 ? "video_generation_queue missing. Run migration 064." : null,
    },
    {
      id: "bloom-image",
      label: "Bloom → Image",
      flow: "Image prompts awaiting founder review",
      status: healthFrom(imageWaiting, imageWaiting < 0, null),
      waiting: Math.max(0, imageWaiting),
      lastSuccess: null,
      lastFailure: null,
      failureReason: null,
    },
    {
      id: "seo-blog",
      label: "SEO → Blog",
      flow: "SEO drafts awaiting Gate approval",
      status: healthFrom(seoWaiting, false, null),
      waiting: Math.max(0, seoWaiting),
      lastSuccess: null,
      lastFailure: null,
      failureReason: null,
    },
    {
      id: "reddit-approval",
      label: "Reddit → Approval",
      flow: "Reply drafts awaiting founder approval",
      status: healthFrom(redditWaiting, false, null),
      waiting: Math.max(0, redditWaiting),
      lastSuccess: null,
      lastFailure: null,
      failureReason: null,
    },
    {
      id: "f5bot-intel",
      label: "F5Bot → Intelligence",
      flow: "Scheduled F5Bot ingest into intelligence_alerts",
      status: healthFrom(intelWaiting, false, f5Run.status),
      waiting: Math.max(0, intelWaiting),
      lastSuccess: f5Run.status === "success" ? f5Run.at : null,
      lastFailure: f5Run.status === "failed" ? f5Run.at : null,
      failureReason: f5Run.status === "failed" ? f5Run.error : null,
    },
    {
      id: "intel-trends",
      label: "Intelligence → Trend Clusters",
      flow: "Active alerts clustered into trends",
      status: trendCount > 0 ? "healthy" : "stalled",
      waiting: Math.max(0, trendCount),
      lastSuccess: f5Run.at,
      lastFailure: null,
      failureReason: trendCount === 0 ? "No active alerts to cluster yet" : null,
    },
    {
      id: "ideas-queue",
      label: "Ideas awaiting approval",
      flow: "Creative ideas pending founder decision",
      status: healthFrom(ideasWaiting, false, null),
      waiting: Math.max(0, ideasWaiting),
      lastSuccess: null,
      lastFailure: null,
      failureReason: null,
    },
    {
      id: "creative-routing",
      label: "Creative Routing",
      flow: "Intelligence → Bloom → Video/Image (no raw signals in creative queues)",
      status: creativeRouting.status === "healthy" ? "healthy" : "broken",
      waiting: creativeRouting.rawVideoCount + creativeRouting.rawImageCount,
      lastSuccess: creativeRouting.status === "healthy" ? new Date().toISOString() : null,
      lastFailure: creativeRouting.status === "broken" ? new Date().toISOString() : null,
      failureReason: creativeRouting.status === "broken" ? creativeRouting.message : null,
    },
    {
      id: "demo-audit",
      label: "Demo Content Audit",
      flow: "Production must not show DEMO/MOCK/SAMPLE rows",
      status: demoAudit.total === 0 ? "healthy" : "broken",
      waiting: demoAudit.total,
      lastSuccess: demoAudit.total === 0 ? new Date().toISOString() : null,
      lastFailure: demoAudit.total > 0 ? new Date().toISOString() : null,
      failureReason: demoAudit.total > 0 ? demoAudit.message : null,
    },
    {
      id: "seo-pipeline",
      label: "SEO Pipeline",
      flow: "Draft 5 must create seo_blog_posts rows",
      status:
        lastSeoFactory.error || (lastSeoFactory.at && lastSeoFactory.rowsCreated === 0)
          ? "broken"
          : blogPostCount === 0
            ? "stalled"
            : "healthy",
      waiting: blogPostCount,
      lastSuccess: lastSeoFactory.at && lastSeoFactory.rowsCreated > 0 ? lastSeoFactory.at : null,
      lastFailure: lastSeoFactory.error ? lastSeoFactory.at : null,
      failureReason: lastSeoFactory.error ?? (blogPostCount === 0 ? "No blog drafts in pipeline yet" : null),
    },
    {
      id: "content-router",
      label: "Content Pipeline",
      flow: "Bloom-approved concepts staged for creative routing",
      status: contentRouter.totalWaiting === 0 && bloomWaiting > 0 ? "stalled" : "healthy",
      waiting: contentRouter.totalWaiting,
      lastSuccess: contentRouter.totalWaiting > 0 ? new Date().toISOString() : null,
      lastFailure: null,
      failureReason:
        contentRouter.totalWaiting === 0 && bloomWaiting > 0
          ? "Approved items exist but Content Router is empty"
          : contentRouter.totalWaiting === 0
            ? "No approved Bloom concepts staged"
            : null,
    },
    {
      id: "founder-inbox-links",
      label: "Founder Inbox Source Links",
      flow: "External intelligence items must include source URLs",
      status: inboxMissingUrl > 0 ? "stalled" : "healthy",
      waiting: inboxMissingUrl,
      lastSuccess: inboxMissingUrl === 0 ? new Date().toISOString() : null,
      lastFailure: null,
      failureReason: inboxMissingUrl > 0 ? `${inboxMissingUrl} high-priority alerts missing source_url` : null,
    },
    {
      id: "scout-discovery",
      label: "Scout Discovery",
      flow: "Creator search via SerpAPI with logged diagnostics",
      status: lastScoutRun.status === "failed" ? "broken" : "healthy",
      waiting: 0,
      lastSuccess: lastScoutRun.status === "success" ? lastScoutRun.at : null,
      lastFailure: lastScoutRun.status === "failed" ? lastScoutRun.at : null,
      failureReason: lastScoutRun.error || null,
    },
  ];
}

export async function getDemoAuditCount(): Promise<number> {
  const audit = await auditDemoContent();
  return audit.total;
}
