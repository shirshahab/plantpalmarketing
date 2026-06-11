import { createServerClient } from "@/lib/supabase/server";

/**
 * Phase 31A — Company Operating System.
 * One layer above agent_tasks / agent_messages / approval_queue / calendar
 * that records every workflow, step, output, decision, and bottleneck.
 * Every write is best-effort: a missing table never blocks the caller.
 */

export type CompanyWorkflowType =
  | "creator_partnership"
  | "community_response"
  | "content_creation"
  | "creative_asset"
  | "publishing"
  | "seo_blog"
  | "reddit_reply"
  | "competitor_response"
  | "growth_experiment"
  | "daily_report"
  | "system_health";

/** Standard pipelines — who the work should flow through. */
export const WORKFLOW_PIPELINES: Record<CompanyWorkflowType, string[]> = {
  creator_partnership: ["scout", "oak", "gate", "sprout"],
  community_response: ["roots", "bloom", "sage", "gate", "sprout"],
  content_creation: ["bloom", "sage", "gate", "fern", "sprout"],
  creative_asset: ["fern", "sage", "gate", "calendar"],
  publishing: ["gate", "sprout", "calendar", "publish_log"],
  seo_blog: ["roots", "bloom", "sage", "gate", "sprout"],
  reddit_reply: ["roots", "bloom", "sage", "gate", "reddit_publisher"],
  competitor_response: ["sentinel", "atlas", "ivy", "bloom"],
  growth_experiment: ["fern", "atlas", "ivy", "founder"],
  daily_report: ["all_agents", "ivy", "founder"],
  system_health: ["sentinel", "ivy", "founder"],
};

/** Map existing handoff trigger types onto Company OS workflow types. */
const TRIGGER_TO_WORKFLOW: Record<string, CompanyWorkflowType> = {
  creator_lead: "creator_partnership",
  creator_outreach: "creator_partnership",
  community_opportunity: "community_response",
  community_reply: "community_response",
  approved_content: "publishing",
  content_piece: "content_creation",
  content_event: "content_creation",
  creative_project: "creative_asset",
  creative_review: "creative_asset",
  seo_blog_draft: "seo_blog",
  seo_blog_approved: "seo_blog",
  seo_blog_revision: "seo_blog",
  reddit_opportunity: "reddit_reply",
  reddit_draft: "reddit_reply",
  reddit_reply: "reddit_reply",
  competitor_alert: "competitor_response",
  growth_experiment: "growth_experiment",
  growth_opportunity: "growth_experiment",
  daily_report: "daily_report",
  calendar_revision: "content_creation",
  approval_feedback: "content_creation",
};

function inferWorkflowType(triggerType: string, workflowName: string): CompanyWorkflowType {
  if (TRIGGER_TO_WORKFLOW[triggerType]) return TRIGGER_TO_WORKFLOW[triggerType];
  const text = `${triggerType} ${workflowName}`.toLowerCase();
  if (text.includes("seo") || text.includes("blog")) return "seo_blog";
  if (text.includes("reddit")) return "reddit_reply";
  if (text.includes("creative") || text.includes("asset") || text.includes("image") || text.includes("video")) return "creative_asset";
  if (text.includes("creator") || text.includes("partner")) return "creator_partnership";
  if (text.includes("community") || text.includes("mention")) return "community_response";
  if (text.includes("competitor")) return "competitor_response";
  if (text.includes("publish") || text.includes("schedule")) return "publishing";
  if (text.includes("growth") || text.includes("experiment")) return "growth_experiment";
  if (text.includes("report") || text.includes("brief")) return "daily_report";
  return "content_creation";
}

type AnyClient = ReturnType<typeof createServerClient>;

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

export interface StartWorkflowInput {
  workflowType: CompanyWorkflowType;
  workflowName: string;
  sourceAgent: string;
  currentAgent?: string;
  nextAgent?: string;
  priority?: string;
  triggerId?: string;
  impactScore?: number;
  metadata?: Record<string, unknown>;
}

export async function startCompanyWorkflow(input: StartWorkflowInput): Promise<string | null> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("company_workflows")
      .insert({
        workflow_type: input.workflowType,
        workflow_name: input.workflowName,
        status: "active",
        priority: input.priority ?? "medium",
        source_agent: input.sourceAgent,
        current_agent: input.currentAgent ?? input.sourceAgent,
        next_agent: input.nextAgent ?? "",
        trigger_id: input.triggerId ?? "",
        impact_score: input.impactScore ?? 50,
        metadata: (input.metadata ?? {}) as never,
      })
      .select("id")
      .single();
    if (error) return null;
    return data.id;
  } catch {
    return null;
  }
}

/** Reuse the active workflow for a trigger, or start a fresh one. */
export async function findOrStartWorkflow(input: StartWorkflowInput): Promise<string | null> {
  try {
    const supabase = createServerClient();
    if (input.triggerId) {
      const { data } = await supabase
        .from("company_workflows")
        .select("id")
        .eq("workflow_type", input.workflowType)
        .eq("trigger_id", input.triggerId)
        .in("status", ["active", "blocked"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) return data.id;
    }
    return startCompanyWorkflow(input);
  } catch {
    return null;
  }
}

async function nextStepOrder(supabase: AnyClient, workflowId: string): Promise<number> {
  const { data } = await supabase
    .from("workflow_steps")
    .select("step_order")
    .eq("workflow_id", workflowId)
    .order("step_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.step_order ?? 0) + 1;
}

export interface AdvanceStepInput {
  workflowId: string;
  stepName: string;
  agentId: string;
  nextAgent?: string;
  inputSummary?: string;
  outputSummary?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Completes the previous in-progress step and opens the next one.
 * Updates the workflow's current/next agent pointers.
 */
export async function advanceWorkflowStep(input: AdvanceStepInput): Promise<string | null> {
  try {
    const supabase = createServerClient();
    const now = new Date().toISOString();

    // Close any still-open step
    await supabase
      .from("workflow_steps")
      .update({ status: "completed", completed_at: now })
      .eq("workflow_id", input.workflowId)
      .eq("status", "in_progress");

    const order = await nextStepOrder(supabase, input.workflowId);
    const { data, error } = await supabase
      .from("workflow_steps")
      .insert({
        workflow_id: input.workflowId,
        step_order: order,
        step_name: input.stepName,
        agent_id: input.agentId,
        status: "in_progress",
        input_summary: input.inputSummary ?? "",
        output_summary: input.outputSummary ?? "",
        metadata: (input.metadata ?? {}) as never,
      })
      .select("id")
      .single();
    if (error) return null;

    await supabase
      .from("company_workflows")
      .update({
        current_agent: input.agentId,
        next_agent: input.nextAgent ?? "",
        status: "active",
        blocked_at: null,
        blocker_reason: "",
      })
      .eq("id", input.workflowId);

    return data.id;
  } catch {
    return null;
  }
}

export async function completeWorkflowStep(
  workflowId: string,
  outputSummary: string
): Promise<void> {
  try {
    const supabase = createServerClient();
    await supabase
      .from("workflow_steps")
      .update({ status: "completed", completed_at: new Date().toISOString(), output_summary: outputSummary })
      .eq("workflow_id", workflowId)
      .eq("status", "in_progress");
  } catch {
    // best-effort
  }
}

export async function completeCompanyWorkflow(
  workflowId: string,
  outcome: string,
  impactScore?: number
): Promise<void> {
  try {
    const supabase = createServerClient();
    const now = new Date().toISOString();
    await completeWorkflowStep(workflowId, outcome);
    await supabase
      .from("company_workflows")
      .update({
        status: "completed",
        completed_at: now,
        outcome,
        ...(impactScore !== undefined ? { impact_score: impactScore } : {}),
      })
      .eq("id", workflowId);
  } catch {
    // best-effort
  }
}

export async function blockCompanyWorkflow(workflowId: string, reason: string): Promise<void> {
  try {
    const supabase = createServerClient();
    const now = new Date().toISOString();
    await supabase
      .from("workflow_steps")
      .update({ status: "blocked", blocker_reason: reason })
      .eq("workflow_id", workflowId)
      .eq("status", "in_progress");
    await supabase
      .from("company_workflows")
      .update({ status: "blocked", blocked_at: now, blocker_reason: reason })
      .eq("id", workflowId);
  } catch {
    // best-effort
  }
}

export interface CompanyOutputInput {
  workflowId?: string | null;
  agentId: string;
  outputType: string;
  title: string;
  summary?: string;
  sourceTable?: string;
  sourceId?: string;
  targetTable?: string;
  targetId?: string;
  status?: string;
  riskLevel?: string;
  approvalRequired?: boolean;
  publishedUrl?: string;
  metadata?: Record<string, unknown>;
}

export async function createCompanyOutput(input: CompanyOutputInput): Promise<string | null> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("company_outputs")
      .insert({
        workflow_id: input.workflowId ?? null,
        agent_id: input.agentId,
        output_type: input.outputType,
        title: input.title,
        summary: input.summary ?? "",
        source_table: input.sourceTable ?? "",
        source_id: input.sourceId ?? "",
        target_table: input.targetTable ?? "",
        target_id: input.targetId ?? "",
        status: input.status ?? "created",
        risk_level: input.riskLevel ?? "low",
        approval_required: input.approvalRequired ?? true,
        published_url: input.publishedUrl ?? "",
        metadata: (input.metadata ?? {}) as never,
      })
      .select("id")
      .single();
    if (error) return null;
    return data.id;
  } catch {
    return null;
  }
}

export interface CompanyDecisionInput {
  workflowId?: string | null;
  decisionType: string;
  decisionMaker?: string;
  decision: string;
  reason?: string;
  feedback?: string;
  impactScore?: number;
}

export async function recordCompanyDecision(input: CompanyDecisionInput): Promise<void> {
  try {
    const supabase = createServerClient();
    await supabase.from("company_decisions").insert({
      workflow_id: input.workflowId ?? null,
      decision_type: input.decisionType,
      decision_maker: input.decisionMaker ?? "founder",
      decision: input.decision,
      reason: input.reason ?? "",
      feedback: input.feedback ?? "",
      impact_score: input.impactScore ?? 50,
    });
  } catch {
    // best-effort
  }
}

export interface BottleneckInput {
  workflowId?: string | null;
  agentId: string;
  bottleneckType: string;
  description: string;
  severity?: string;
  recommendedFix?: string;
}

export async function recordCompanyBottleneck(input: BottleneckInput): Promise<void> {
  try {
    const supabase = createServerClient();
    // Skip duplicates: same type + agent still open
    const { data: existing } = await supabase
      .from("company_bottlenecks")
      .select("id")
      .eq("agent_id", input.agentId)
      .eq("bottleneck_type", input.bottleneckType)
      .eq("status", "open")
      .limit(1)
      .maybeSingle();
    if (existing) return;

    await supabase.from("company_bottlenecks").insert({
      workflow_id: input.workflowId ?? null,
      agent_id: input.agentId,
      bottleneck_type: input.bottleneckType,
      description: input.description,
      severity: input.severity ?? "medium",
      recommended_fix: input.recommendedFix ?? "",
      status: "open",
    });
  } catch {
    // best-effort
  }
}

export async function resolveCompanyBottleneck(bottleneckId: string): Promise<void> {
  try {
    const supabase = createServerClient();
    await supabase
      .from("company_bottlenecks")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("id", bottleneckId);
  } catch {
    // best-effort
  }
}

// ---------------------------------------------------------------------------
// Event capture — called from recordHandoff so every existing agent
// automatically writes into Company OS with zero changes to its own code.
// ---------------------------------------------------------------------------

export interface HandoffCapture {
  fromAgent: string;
  toAgent: string;
  workflowName: string;
  triggerType: string;
  triggerId?: string;
  taskDescription: string;
  priority?: string;
}

export async function captureHandoffInCompanyOs(input: HandoffCapture): Promise<void> {
  try {
    const workflowType = inferWorkflowType(input.triggerType, input.workflowName);
    const pipeline = WORKFLOW_PIPELINES[workflowType];
    const toIndex = pipeline.indexOf(input.toAgent);
    const nextAgent = toIndex >= 0 && toIndex < pipeline.length - 1 ? pipeline[toIndex + 1] : "";

    const workflowId = await findOrStartWorkflow({
      workflowType,
      workflowName: input.workflowName,
      sourceAgent: input.fromAgent,
      currentAgent: input.toAgent,
      nextAgent,
      priority: input.priority,
      triggerId: input.triggerId,
    });
    if (!workflowId) return;

    await advanceWorkflowStep({
      workflowId,
      stepName: `${input.fromAgent} → ${input.toAgent}`,
      agentId: input.toAgent,
      nextAgent,
      inputSummary: input.taskDescription.slice(0, 300),
    });

    // Workflow reached the end of its standard pipeline
    if (input.toAgent === pipeline[pipeline.length - 1]) {
      await completeCompanyWorkflow(workflowId, `Reached final stage: ${input.toAgent}`);
    }
  } catch {
    // Company OS capture never blocks the producing agent
  }
}

// ---------------------------------------------------------------------------
// Operating summary — Ivy / Founder Mode / Daily Brief read this
// ---------------------------------------------------------------------------

export interface CompanyOperatingSummary {
  workflowsStartedToday: number;
  workflowsCompletedToday: number;
  blockedWorkflows: number;
  activeWorkflows: number;
  decisionsNeeded: number;
  outputsToday: number;
  agentProductivity: { agentId: string; stepsCompleted: number }[];
  biggestBottleneck: { description: string; agentId: string; severity: string } | null;
  highestImpactOutput: { title: string; agentId: string; outputType: string } | null;
  recentDecisions: { decision: string; decisionType: string; createdAt: string }[];
  healthScore: number;
}

export async function getCompanyOperatingSummary(): Promise<CompanyOperatingSummary> {
  const empty: CompanyOperatingSummary = {
    workflowsStartedToday: 0,
    workflowsCompletedToday: 0,
    blockedWorkflows: 0,
    activeWorkflows: 0,
    decisionsNeeded: 0,
    outputsToday: 0,
    agentProductivity: [],
    biggestBottleneck: null,
    highestImpactOutput: null,
    recentDecisions: [],
    healthScore: 0,
  };

  try {
    const supabase = createServerClient();
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const since = dayStart.toISOString();

    const [startedRes, completedRes, blockedRes, activeRes, pendingOutputsRes, outputsTodayRes, stepsRes, bottleneckRes, topOutputRes, decisionsRes] =
      await Promise.all([
        supabase.from("company_workflows").select("*", { count: "exact", head: true }).gte("started_at", since),
        supabase.from("company_workflows").select("*", { count: "exact", head: true }).eq("status", "completed").gte("completed_at", since),
        supabase.from("company_workflows").select("*", { count: "exact", head: true }).eq("status", "blocked"),
        supabase.from("company_workflows").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase
          .from("company_outputs")
          .select("*", { count: "exact", head: true })
          .eq("approval_required", true)
          .in("status", ["created", "pending_approval"]),
        supabase.from("company_outputs").select("*", { count: "exact", head: true }).gte("created_at", since),
        supabase.from("workflow_steps").select("agent_id").eq("status", "completed").gte("completed_at", since),
        supabase
          .from("company_bottlenecks")
          .select("description, agent_id, severity")
          .eq("status", "open")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("company_outputs")
          .select("title, agent_id, output_type, metadata")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("company_decisions")
          .select("decision, decision_type, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

    const productivity = new Map<string, number>();
    for (const step of stepsRes.data ?? []) {
      if (!step.agent_id) continue;
      productivity.set(step.agent_id, (productivity.get(step.agent_id) ?? 0) + 1);
    }

    const blocked = blockedRes.count ?? 0;
    const active = activeRes.count ?? 0;
    const completedToday = completedRes.count ?? 0;
    const total = blocked + active + completedToday;
    const healthScore = total === 0 ? 100 : Math.max(0, Math.round(100 - (blocked / total) * 100));

    return {
      workflowsStartedToday: startedRes.count ?? 0,
      workflowsCompletedToday: completedToday,
      blockedWorkflows: blocked,
      activeWorkflows: active,
      decisionsNeeded: pendingOutputsRes.count ?? 0,
      outputsToday: outputsTodayRes.count ?? 0,
      agentProductivity: Array.from(productivity.entries())
        .map(([agentId, stepsCompleted]) => ({ agentId, stepsCompleted }))
        .sort((a, b) => b.stepsCompleted - a.stepsCompleted),
      biggestBottleneck: bottleneckRes.data
        ? { description: bottleneckRes.data.description, agentId: bottleneckRes.data.agent_id, severity: bottleneckRes.data.severity }
        : null,
      highestImpactOutput: topOutputRes.data
        ? { title: topOutputRes.data.title, agentId: topOutputRes.data.agent_id, outputType: topOutputRes.data.output_type }
        : null,
      recentDecisions: (decisionsRes.data ?? []).map((d) => ({
        decision: d.decision,
        decisionType: d.decision_type,
        createdAt: d.created_at,
      })),
      healthScore,
    };
  } catch {
    return empty;
  }
}

// ---------------------------------------------------------------------------
// Bottleneck detection — Atlas calls this on every run
// ---------------------------------------------------------------------------

export async function detectCompanyBottlenecks(): Promise<number> {
  let found = 0;
  try {
    const supabase = createServerClient();
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    // 1. Slow workflows — active for more than 24h without completing
    const { data: stale } = await supabase
      .from("company_workflows")
      .select("id, workflow_name, workflow_type, current_agent, started_at")
      .eq("status", "active")
      .lt("started_at", new Date(now - dayMs).toISOString())
      .limit(10);
    for (const wf of stale ?? []) {
      await recordCompanyBottleneck({
        workflowId: wf.id,
        agentId: wf.current_agent || "unknown",
        bottleneckType: "slow_workflow",
        description: `"${wf.workflow_name}" (${wf.workflow_type}) has been stuck with ${wf.current_agent || "no agent"} for 24h+`,
        severity: "medium",
        recommendedFix: `Check ${wf.current_agent || "the pipeline"} on /automation/schedules and nudge or run manually.`,
      });
      found += 1;
    }

    // 2. Blocked workflows
    const { data: blocked } = await supabase
      .from("company_workflows")
      .select("id, workflow_name, current_agent, blocker_reason")
      .eq("status", "blocked")
      .limit(10);
    for (const wf of blocked ?? []) {
      await recordCompanyBottleneck({
        workflowId: wf.id,
        agentId: wf.current_agent || "unknown",
        bottleneckType: "blocked_workflow",
        description: `"${wf.workflow_name}" blocked: ${wf.blocker_reason || "no reason recorded"}`,
        severity: "high",
        recommendedFix: "Resolve the blocker on /company-os, then resume the workflow.",
      });
      found += 1;
    }

    // 3. Approval backlog
    const { count: pendingApprovals } = await supabase
      .from("approval_queue")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    if ((pendingApprovals ?? 0) >= 10) {
      await recordCompanyBottleneck({
        agentId: "gate",
        bottleneckType: "approval_backlog",
        description: `${pendingApprovals} items waiting for founder approval`,
        severity: "high",
        recommendedFix: "Clear the founder inbox on /approvals. Consider batch approval for low-risk items.",
      });
      found += 1;
    }
  } catch {
    // detection is best-effort
  }
  return found;
}
