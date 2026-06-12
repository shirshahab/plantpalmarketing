import { createServerClient } from "@/lib/supabase";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import { getXDashboardData } from "@/lib/db/integration-queries";
import { AGENT_PROFILE_DEFINITIONS } from "@/lib/agents/ai/agent-profiles";
import type { AgentSlug } from "@/lib/types";
import type {
  AgentProductivityEntry,
  AnalyticsSummary,
  ApiUsageSummary,
  WorkflowRunEntry,
  WorkflowSummary,
} from "@/lib/daily-report/types";

const REPORT_AGENTS: AgentSlug[] = [
  "scout", "roots", "sentinel", "bloom", "sage", "sprout",
  "oak", "gate", "ivy", "atlas", "echo", "fern",
];

const AGENT_DISPLAY: Record<AgentSlug, string> = {
  scout: "Scout", roots: "Roots", sentinel: "Sentinel", bloom: "Bloom",
  sage: "Sage", sprout: "Sprout", oak: "Oak", gate: "Gate",
  ivy: "Ivy", atlas: "Atlas", echo: "Echo", fern: "Fern", moss: "Moss",
};

function last24h() {
  const until = new Date();
  const since = new Date(until.getTime() - 24 * 60 * 60 * 1000);
  return { since: since.toISOString(), until: until.toISOString() };
}

async function safeCount(
  table: string,
  filter?: (q: ReturnType<ReturnType<typeof createServerClient>["from"]>) => ReturnType<ReturnType<typeof createServerClient>["from"]>
): Promise<{ count: number; connected: boolean }> {
  try {
    const supabase = createServerClient();
    let q = supabase.from(table).select("*", { count: "exact", head: true });
    if (filter) q = filter(q);
    const { count, error } = await q;
    if (error) {
      if (isMissingTableError(error)) return { count: 0, connected: false };
      throw new Error(error.message);
    }
    return { count: count ?? 0, connected: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (isMissingTableError({ message: msg })) return { count: 0, connected: false };
    throw e;
  }
}

async function safeSelect<T>(
  table: string,
  since: string,
  map: (rows: Record<string, unknown>[]) => T,
  extra?: (q: ReturnType<ReturnType<typeof createServerClient>["from"]>) => ReturnType<ReturnType<typeof createServerClient>["from"]>
): Promise<{ data: T; connected: boolean }> {
  try {
    const supabase = createServerClient();
    let q = supabase.from(table).select("*").gte("created_at", since).order("created_at", { ascending: false });
    if (extra) q = extra(q);
    const { data, error } = await q;
    if (error) {
      if (isMissingTableError(error)) return { data: map([]), connected: false };
      throw new Error(error.message);
    }
    return { data: map((data ?? []) as Record<string, unknown>[]), connected: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (isMissingTableError({ message: msg })) return { data: map([]), connected: false };
    throw e;
  }
}

export async function collectDailyReportData() {
  const { since } = last24h();

  const [
    tasksRes,
    messagesRes,
    eventsRes,
    activityRes,
    approvalPending,
    approvalApproved,
    approvalRejected,
    creatorLeads,
    creatorHigh,
    communityOpps,
    replyDrafts,
    competitorAlerts,
    competitorHigh,
    partnershipsRec,
    partnershipsActive,
    bloomContent,
    integrationLogs,
    healthChecks,
    xData,
    bloomAwaiting,
    calendarCreated,
    calendarScheduled,
    calendarMissingAssets,
    calendarReady,
    calendarPublished,
    xPosts24h,
    xQueuePending,
    xQueueReady,
    agentRuns24h,
    hqWorkflowEvents24h,
    batchHighRisk,
    outreachPending,
    topOpps,
  ] = await Promise.all([
    safeSelect("agent_tasks", since, (r) => r),
    safeSelect("agent_messages", since, (r) => r),
    safeSelect("agent_events", since, (r) => r),
    safeSelect("agent_activity_log", since, (r) => r),
    safeCount("approval_queue", (q) => q.eq("status", "pending")),
    safeCount("approval_queue", (q) => q.gte("updated_at", since).eq("status", "approved")),
    safeCount("approval_queue", (q) => q.gte("updated_at", since).eq("status", "rejected")),
    safeCount("creator_leads", (q) => q.gte("created_at", since)),
    safeCount("creator_leads", (q) => q.gte("created_at", since).eq("priority", "high")),
    safeCount("community_opportunities", (q) => q.gte("created_at", since)),
    safeCount("community_reply_drafts", (q) => q.gte("created_at", since).eq("status", "pending")),
    safeCount("competitor_intel_alerts", (q) => q.gte("created_at", since)),
    safeCount("competitor_intel_alerts", (q) => q.gte("created_at", since).eq("severity", "high")),
    safeCount("creator_partnerships", (q) => q.gte("created_at", since).eq("status", "recommended")),
    safeCount("creator_partnerships", (q) => q.eq("status", "active")),
    safeSelect("bloom_content_pieces", since, (r) => r),
    safeSelect("integration_logs", since, (r) => r),
    safeSelect("provider_health_checks", since, (r) => r),
    getXDashboardData().catch(() => null),
    safeCount("bloom_content_pieces", (q) => q.eq("status", "awaiting_review")),
    safeCount("content_calendar", (q) => q.gte("created_at", since)),
    safeCount("content_calendar", (q) => q.eq("status", "scheduled")),
    safeCount("content_calendar", (q) => q.eq("status", "needs_asset")),
    safeCount("content_calendar", (q) => q.eq("status", "ready_to_publish")),
    safeCount("content_calendar", (q) => q.eq("status", "published").gte("published_at", since)),
    safeCount("x_posts", (q) => q.gte("created_at", since)),
    safeCount("x_post_queue", (q) => q.in("status", ["sage_review", "gate_approval"])),
    safeCount("x_post_queue", (q) => q.eq("status", "ready_to_publish")),
    safeCount("agent_runs", (q) => q.gte("started_at", since)),
    safeCount("hq_workflow_events", (q) => q.gte("created_at", since)),
    safeCount("batch_approvals", (q) => q.eq("status", "pending").eq("risk_level", "high")),
    safeCount("approval_queue", (q) =>
      q.eq("status", "pending").or("draft.ilike.%creator lead%,draft.ilike.Partnership:%")
    ),
    safeSelect(
      "community_opportunities",
      since,
      (rows) =>
        rows
          .slice(0, 3)
          .map((r) => String(r.topic ?? r.question ?? "").slice(0, 90))
          .filter(Boolean),
      (q) => q.limit(5)
    ),
  ]);

  return {
    since,
    tasks: tasksRes,
    messages: messagesRes,
    events: eventsRes,
    activity: activityRes,
    approval: {
      pending: approvalPending,
      approved: approvalApproved,
      rejected: approvalRejected,
    },
    creatorLeads,
    creatorHigh,
    communityOpps,
    replyDrafts,
    competitorAlerts,
    competitorHigh,
    partnershipsRec,
    partnershipsActive,
    bloomContent,
    integrationLogs,
    healthChecks,
    xData,
    bloomAwaiting,
    calendarCreated,
    calendarScheduled,
    calendarMissingAssets,
    calendarReady,
    calendarPublished,
    xPosts24h,
    xQueuePending,
    xQueueReady,
    agentRuns24h,
    hqWorkflowEvents24h,
    batchHighRisk,
    outreachPending,
    topOpps,
  };
}

function getRole(agentId: AgentSlug): string {
  return AGENT_PROFILE_DEFINITIONS.find((p) => p.agentId === agentId)?.role ?? "Agent";
}

function agentField(row: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string") return v;
  }
  return null;
}

export function buildAgentProductivity(
  data: Awaited<ReturnType<typeof collectDailyReportData>>
): AgentProductivityEntry[] {
  const tasks = data.tasks.connected ? (data.tasks.data as Record<string, unknown>[]) : [];
  const messages = data.messages.connected ? (data.messages.data as Record<string, unknown>[]) : [];
  const events = data.events.connected ? (data.events.data as Record<string, unknown>[]) : [];
  const activity = data.activity.connected ? (data.activity.data as Record<string, unknown>[]) : [];

  const anyConnected = data.tasks.connected || data.messages.connected || data.events.connected || data.activity.connected;

  return REPORT_AGENTS.map((agentId) => {
    const tasksCompleted = tasks.filter(
      (t) => agentField(t, "assigned_agent") === agentId && t.status === "completed"
    ).length;
    const tasksCreated = tasks.filter((t) => agentField(t, "created_by") === agentId).length;
    const blockedTasks = tasks.filter(
      (t) => agentField(t, "assigned_agent") === agentId && t.status === "blocked"
    );
    const messagesSent = messages.filter((m) => agentField(m, "from_agent") === agentId).length;
    const eventsTriggered = events.filter((e) => agentField(e, "source_agent") === agentId).length;
    const outputsGenerated = activity.filter((a) => agentField(a, "agent_id") === agentId).length
      + (agentId === "bloom" ? (data.bloomContent.connected ? (data.bloomContent.data as unknown[]).length : 0) : 0)
      + (agentId === "scout" ? data.creatorLeads.count : 0)
      + (agentId === "roots" ? data.communityOpps.count : 0)
      + (agentId === "sentinel" ? data.competitorAlerts.count : 0);

    const blockers = blockedTasks.map(
      (t) => (typeof t.description === "string" ? t.description : "Blocked task") as string
    );

    let score = 40;
    score += Math.min(20, tasksCompleted * 8);
    score += Math.min(15, messagesSent * 5);
    score += Math.min(15, eventsTriggered * 5);
    score += Math.min(10, outputsGenerated * 3);
    score -= blockers.length * 12;
    score = Math.max(1, Math.min(100, score));

    return {
      agentId,
      name: AGENT_DISPLAY[agentId],
      role: getRole(agentId),
      tasksCompleted,
      tasksCreated,
      messagesSent,
      eventsTriggered,
      outputsGenerated,
      blockers,
      productivityScore: score,
      connected: anyConnected,
    };
  });
}

const WORKFLOW_DEFS: {
  name: string;
  source: AgentSlug;
  target: AgentSlug;
  agents: AgentSlug[];
}[] = [
  { name: "Scout → Oak", source: "scout", target: "oak", agents: ["scout", "oak"] },
  { name: "Roots → Bloom", source: "roots", target: "bloom", agents: ["roots", "bloom"] },
  { name: "Bloom → Sage", source: "bloom", target: "sage", agents: ["bloom", "sage"] },
  { name: "Sage → Gate", source: "sage", target: "gate", agents: ["sage", "gate"] },
  { name: "Gate → Sprout", source: "gate", target: "sprout", agents: ["gate", "sprout"] },
  { name: "Sentinel → Atlas", source: "sentinel", target: "atlas", agents: ["sentinel", "atlas"] },
  { name: "Echo → Atlas", source: "echo", target: "atlas", agents: ["echo", "atlas"] },
  { name: "Atlas → Ivy", source: "atlas", target: "ivy", agents: ["atlas", "ivy"] },
];

export function buildWorkflowSummary(
  data: Awaited<ReturnType<typeof collectDailyReportData>>
): WorkflowSummary {
  const messages = data.messages.connected ? (data.messages.data as Record<string, unknown>[]) : [];
  const tasks = data.tasks.connected ? (data.tasks.data as Record<string, unknown>[]) : [];
  const events = data.events.connected ? (data.events.data as Record<string, unknown>[]) : [];

  const entries: WorkflowRunEntry[] = WORKFLOW_DEFS.map((def) => {
    const handoffs = messages.filter(
      (m) => agentField(m, "from_agent") === def.source && agentField(m, "to_agent") === def.target
    ).length;

    let itemsMoved = handoffs;
    let bottleneck = "";
    let recommendedFix = "Keep pipeline moving — no action needed.";
    let status: WorkflowRunEntry["status"] = "idle";

    if (def.name === "Scout → Oak") {
      itemsMoved += data.creatorLeads.count;
      if (data.creatorLeads.count > 0 && data.partnershipsRec.count === 0) {
        bottleneck = "Leads found but no partnership ideas drafted";
        recommendedFix = "Have Oak review top Scout leads and draft outreach — human approval required.";
        status = "active";
      }
    }
    if (def.name === "Roots → Bloom") {
      itemsMoved += data.communityOpps.count;
      if (data.replyDrafts.count > 0) {
        bottleneck = `${data.replyDrafts.count} reply drafts awaiting approval`;
        recommendedFix = "Approve high-urgency Roots replies, then brief Bloom on content angles.";
        status = "blocked";
      } else if (data.communityOpps.count > 0) {
        status = "active";
      }
    }
    if (def.name === "Sentinel → Atlas") {
      itemsMoved += data.competitorAlerts.count;
      if (data.competitorHigh.count > 0) {
        bottleneck = `${data.competitorHigh.count} high-severity competitor alerts`;
        recommendedFix = "Atlas should model retention impact and propose counter-moves for founder review.";
        status = "active";
      }
    }
    if (def.name === "Bloom → Sage") {
      const bloomCount = data.bloomContent.connected ? (data.bloomContent.data as unknown[]).length : 0;
      itemsMoved += bloomCount;
      if (data.bloomAwaiting.count > 0) {
        bottleneck = `${data.bloomAwaiting.count} pieces waiting for Sage review`;
        recommendedFix = "Run Sage from Agent Operations to score the backlog.";
        status = "blocked";
      } else if (bloomCount > 0) {
        status = "active";
      }
    }
    if (def.name === "Sage → Gate") {
      itemsMoved += data.approval.approved.count + data.approval.rejected.count;
      if (data.approval.pending.count > 0) {
        bottleneck = `${data.approval.pending.count} items waiting in the approval queue`;
        recommendedFix = "Open /approvals or the /automation inbox and clear the queue — 10 minutes of founder time.";
        status = "blocked";
      } else if (itemsMoved > 0) {
        status = "active";
      }
    }
    if (def.name === "Gate → Sprout") {
      itemsMoved += data.calendarScheduled.count + data.xQueueReady.count;
      if (data.calendarReady.count > 0) {
        bottleneck = `${data.calendarReady.count} approved items ready to publish, not yet posted`;
        recommendedFix = "Use the calendar copy buttons to post manually, or click Publish to X for queued tweets.";
        status = "active";
      }
      if (data.calendarMissingAssets.count > 0) {
        bottleneck = bottleneck || `${data.calendarMissingAssets.count} approved items missing assets`;
        recommendedFix = "Generate or upload the missing assets, then publish.";
        status = "blocked";
      }
    }
    if (def.name === "Echo → Atlas") {
      const echoEvents = events.filter((e) => agentField(e, "source_agent") === "echo").length;
      itemsMoved += echoEvents;
      if (echoEvents > 0) status = "active";
    }
    if (def.name === "Atlas → Ivy") {
      const atlasToIvy = handoffs;
      if (atlasToIvy > 0) status = "completed";
      itemsMoved += atlasToIvy;
    }

    const blockedTasks = tasks.filter(
      (t) =>
        def.agents.includes(agentField(t, "assigned_agent") as AgentSlug) && t.status === "blocked"
    ).length;
    if (blockedTasks > 0) {
      status = "blocked";
      bottleneck = bottleneck || `${blockedTasks} blocked tasks in workflow`;
      recommendedFix = "Unblock assigned tasks or reassign with human decision.";
    }

    if (itemsMoved > 0 && status === "idle") status = "active";
    if (itemsMoved > 0 && status === "active" && !bottleneck) status = "completed";

    return {
      workflowName: def.name,
      agentsInvolved: def.agents,
      status,
      itemsMoved,
      bottleneck,
      recommendedFix,
    };
  });

  return {
    completed: entries.filter((e) => e.status === "completed"),
    active: entries.filter((e) => e.status === "active"),
    blocked: entries.filter((e) => e.status === "blocked"),
    all: entries,
  };
}

export function buildAnalyticsSummary(
  data: Awaited<ReturnType<typeof collectDailyReportData>>
): AnalyticsSummary {
  const bloomRows = data.bloomContent.connected ? (data.bloomContent.data as Record<string, unknown>[]) : [];
  const formats: Record<string, number> = {};
  for (const row of bloomRows) {
    const fmt = typeof row.format === "string" ? row.format : "unknown";
    formats[fmt] = (formats[fmt] ?? 0) + 1;
  }

  const xConnected = data.xData !== null;
  const xStats = data.xData?.stats;

  return {
    periodLabel: "Last 24 hours",
    sections: {
      approvalQueue: {
        label: "Approval Queue",
        value: data.approval.pending.count,
        detail: `${data.approval.approved.count} approved, ${data.approval.rejected.count} rejected`,
        connected: data.approval.pending.connected,
      },
      contentCreated: {
        label: "Content Created",
        value: bloomRows.length,
        connected: data.bloomContent.connected,
      },
      creatorLeads: {
        label: "Creator Leads",
        value: data.creatorLeads.count,
        detail: `${data.creatorHigh.count} high priority`,
        connected: data.creatorLeads.connected,
      },
      communityOpportunities: {
        label: "Community Opportunities",
        value: data.communityOpps.count,
        detail: `${data.replyDrafts.count} pending replies`,
        connected: data.communityOpps.connected,
      },
      competitorAlerts: {
        label: "Competitor Alerts",
        value: data.competitorAlerts.count,
        detail: `${data.competitorHigh.count} high severity`,
        connected: data.competitorAlerts.connected,
      },
      partnershipUpdates: {
        label: "Partnership Pipeline",
        value: data.partnershipsRec.count,
        detail: `${data.partnershipsActive.count} active`,
        connected: data.partnershipsRec.connected,
      },
      xPosts: {
        label: "X Posts",
        value: xStats?.publishedCount ?? 0,
        connected: xConnected,
      },
      xQueue: {
        label: "X Queue",
        value: (xStats?.draftCount ?? 0) + (xStats?.approvalCount ?? 0),
        connected: xConnected,
      },
      agentTasks: {
        label: "Agent Tasks",
        value: data.tasks.connected ? (data.tasks.data as unknown[]).length : "not connected yet",
        connected: data.tasks.connected,
      },
      agentMessages: {
        label: "Agent Messages",
        value: data.messages.connected ? (data.messages.data as unknown[]).length : "not connected yet",
        connected: data.messages.connected,
      },
      agentEvents: {
        label: "Agent Events",
        value: data.events.connected ? (data.events.data as unknown[]).length : "not connected yet",
        connected: data.events.connected,
      },
      contentCalendar: {
        label: "Calendar Items (24h)",
        value: data.calendarCreated.count,
        detail: `${data.calendarReady.count} ready to publish, ${data.calendarMissingAssets.count} missing assets`,
        connected: data.calendarCreated.connected,
      },
      agentRuns: {
        label: "Agent Runs (24h)",
        value: data.agentRuns24h.count,
        connected: data.agentRuns24h.connected,
      },
      hqWorkflowEvents: {
        label: "HQ Workflow Events",
        value: data.hqWorkflowEvents24h.count,
        connected: data.hqWorkflowEvents24h.connected,
      },
      integrationCalls: {
        label: "API Calls (24h)",
        value: data.integrationLogs.connected ? (data.integrationLogs.data as unknown[]).length : "not connected yet",
        connected: data.integrationLogs.connected,
      },
      providerHealth: {
        label: "Health Checks (24h)",
        value: data.healthChecks.connected ? (data.healthChecks.data as unknown[]).length : "not connected yet",
        connected: data.healthChecks.connected,
      },
    },
    approvalQueue: {
      pending: data.approval.pending.count,
      approved: data.approval.approved.count,
      rejected: data.approval.rejected.count,
      connected: data.approval.pending.connected,
    },
    contentCreated: {
      count: bloomRows.length,
      formats,
      connected: data.bloomContent.connected,
    },
    creatorLeads: {
      found: data.creatorLeads.count,
      highPriority: data.creatorHigh.count,
      connected: data.creatorLeads.connected,
    },
    communityOpportunities: {
      found: data.communityOpps.count,
      pendingReplies: data.replyDrafts.count,
      connected: data.communityOpps.connected,
    },
    competitorAlerts: {
      active: data.competitorAlerts.count,
      highSeverity: data.competitorHigh.count,
      connected: data.competitorAlerts.connected,
    },
    partnershipUpdates: {
      recommended: data.partnershipsRec.count,
      active: data.partnershipsActive.count,
      connected: data.partnershipsRec.connected,
    },
    xSocial: {
      followerCount: xStats?.followerCount ?? 0,
      engagement24h: data.xData?.stats.engagement ?? 0,
      drafts: xStats?.draftCount ?? 0,
      gateQueue: xStats?.approvalCount ?? 0,
      publishQueue: xStats?.queuedCount ?? 0,
      connected: xConnected,
    },
  };
}

const PROVIDERS = ["openai", "x", "serpapi", "openweather", "plantnet", "perenual"] as const;

export function buildApiUsageSummary(
  data: Awaited<ReturnType<typeof collectDailyReportData>>
): ApiUsageSummary {
  const logs = data.integrationLogs.connected ? (data.integrationLogs.data as Record<string, unknown>[]) : [];
  const health = data.healthChecks.connected ? (data.healthChecks.data as Record<string, unknown>[]) : [];

  const providers = PROVIDERS.map((provider) => {
    const providerLogs = logs.filter((l) => l.provider === provider);
    const successful = providerLogs.filter((l) => l.status === "success" || l.status === "connected").length;
    const failed = providerLogs.filter((l) => l.status === "error" || l.status === "disconnected").length;
    const rateLimitWarnings = providerLogs.filter((l) => l.status === "rate_limited").length;

    const healthRow = health
      .filter((h) => h.provider === provider && h.status === "connected")
      .sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")))[0];

    const lastSuccessLog = providerLogs.find((l) => l.status === "success");
    const lastSuccessAt =
      typeof healthRow?.created_at === "string"
        ? healthRow.created_at
        : lastSuccessLog
          ? String(lastSuccessLog.created_at)
          : null;

    const lastErrorLog = providerLogs.find((l) => l.status === "error" || l.status === "rate_limited");

    return {
      provider,
      totalCalls: providerLogs.length,
      successful,
      failed,
      rateLimitWarnings,
      lastSuccessAt,
      lastErrorAt: lastErrorLog ? String(lastErrorLog.created_at) : null,
      lastErrorMessage: lastErrorLog
        ? String(lastErrorLog.error_message ?? lastErrorLog.message ?? "").slice(0, 160)
        : "",
      connected: data.integrationLogs.connected,
    };
  });

  return {
    providers,
    totalSuccessful: providers.reduce((s, p) => s + p.successful, 0),
    totalFailed: providers.reduce((s, p) => s + p.failed, 0),
    totalRateLimitWarnings: providers.reduce((s, p) => s + p.rateLimitWarnings, 0),
    costEstimatePlaceholder: "Cost tracking not enabled — connect billing export for estimates",
    connected: data.integrationLogs.connected,
  };
}
