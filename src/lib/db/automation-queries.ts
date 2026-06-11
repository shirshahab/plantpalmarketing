import { createServerClient } from "@/lib/supabase";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import { DEFAULT_AUTOMATION_RULES } from "@/lib/automation/engine";
import {
  mapAgentActivityLog,
  mapAutomationRule,
  mapAutomationRun,
  mapBatchApprovalItem,
  mapPublishingPackage,
} from "@/lib/supabase/mappers";
import type { AutomationRule } from "@/lib/types";

const RISK_ORDER = { low: 0, medium: 1, high: 2 } as const;

export async function getAutomationRules(): Promise<AutomationRule[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("automation_rules").select("*");
  if (error || !data?.length) {
    if (error && !isMissingTableError(error)) throw new Error(error.message);
    // Fallback before migration 044 runs — read-only defaults
    return DEFAULT_AUTOMATION_RULES.map((r) => ({
      id: "",
      ruleKey: r.ruleKey,
      label: r.label,
      description: r.description,
      agentId: r.agentId,
      category: r.category,
      riskLevel: r.riskLevel,
      action: r.action,
      enabled: true,
      config: {},
      createdAt: "",
      updatedAt: "",
    }));
  }
  return data
    .map(mapAutomationRule)
    .sort((a, b) => RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel] || a.label.localeCompare(b.label));
}

export async function getAutomationRuns(limit = 30) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("automation_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map(mapAutomationRun);
}

export async function getFailedAutomationRuns(limit = 10) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("automation_runs")
    .select("*")
    .eq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map(mapAutomationRun);
}

/** Pending items (any day) + items decided today. */
export async function getBatchInboxItems() {
  const supabase = createServerClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [pending, decided] = await Promise.all([
    supabase
      .from("batch_approvals")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("batch_approvals")
      .select("*")
      .neq("status", "pending")
      .gte("updated_at", todayStart.toISOString())
      .order("updated_at", { ascending: false })
      .limit(50),
  ]);

  if (pending.error) {
    if (isMissingTableError(pending.error)) return { pending: [], decided: [] };
    throw new Error(pending.error.message);
  }
  return {
    pending: (pending.data ?? []).map(mapBatchApprovalItem),
    decided: (decided.data ?? []).map(mapBatchApprovalItem),
  };
}

export async function getPublishingPackages(limit = 50) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("publishing_packages")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map(mapPublishingPackage);
}

export async function getAgentActivityToday(limit = 40) {
  const supabase = createServerClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from("agent_activity_log")
    .select("*")
    .gte("created_at", todayStart.toISOString())
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map(mapAgentActivityLog);
}

const WORKBOARD_AGENTS = [
  "scout",
  "roots",
  "bloom",
  "sage",
  "gate",
  "sprout",
  "sentinel",
  "oak",
  "ivy",
  "atlas",
  "echo",
  "fern",
] as const;

export interface AgentWorkboardEntry {
  agentId: string;
  didToday: number;
  lastAction: string;
  doingNow: string;
  pendingTasks: number;
  blockedTasks: number;
  nextRunAt: string | null;
}

/**
 * Phase 29 — what each agent did today, is doing now, next scheduled run,
 * blocked items, and items awaiting the founder. Every read degrades to
 * empty values when an optional table is missing.
 */
export async function getAgentWorkboard(): Promise<{
  entries: AgentWorkboardEntry[];
  awaitingFounder: number;
}> {
  const supabase = createServerClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [activity, tasks, schedules, approvals, batch] = await Promise.all([
    supabase
      .from("agent_activity_log")
      .select("agent_id, action, detail, created_at")
      .gte("created_at", todayStart.toISOString())
      .order("created_at", { ascending: false })
      .limit(300),
    supabase
      .from("agent_tasks")
      .select("assigned_agent, status, description")
      .in("status", ["pending", "in_progress", "blocked"])
      .limit(300),
    supabase.from("agent_schedules").select("agent_id, next_run_at"),
    supabase.from("approval_queue").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("batch_approvals").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const activityRows = activity.error ? [] : (activity.data ?? []);
  const taskRows = tasks.error ? [] : (tasks.data ?? []);
  const scheduleRows = schedules.error ? [] : (schedules.data ?? []);

  const entries: AgentWorkboardEntry[] = WORKBOARD_AGENTS.map((agentId) => {
    const agentActivity = activityRows.filter((a) => a.agent_id === agentId);
    const agentTasks = taskRows.filter((t) => t.assigned_agent === agentId);
    const inProgress = agentTasks.find((t) => t.status === "in_progress");
    const schedule = scheduleRows.find((s) => s.agent_id === agentId);
    return {
      agentId,
      didToday: agentActivity.length,
      lastAction: agentActivity[0]?.detail ?? "",
      doingNow: inProgress
        ? inProgress.description.slice(0, 100)
        : agentTasks.length > 0
          ? `${agentTasks.length} queued task${agentTasks.length === 1 ? "" : "s"}`
          : "Idle — waiting for work",
      pendingTasks: agentTasks.filter((t) => t.status === "pending" || t.status === "in_progress").length,
      blockedTasks: agentTasks.filter((t) => t.status === "blocked").length,
      nextRunAt: schedule?.next_run_at ?? null,
    };
  });

  const awaitingFounder =
    (approvals.error ? 0 : (approvals.count ?? 0)) + (batch.error ? 0 : (batch.count ?? 0));

  return { entries, awaitingFounder };
}

export async function getAutomationPageData() {
  const [rules, runs, failedRuns, inbox, packages, todayActivity, workboard] = await Promise.all([
    getAutomationRules(),
    getAutomationRuns(30),
    getFailedAutomationRuns(10),
    getBatchInboxItems(),
    getPublishingPackages(),
    getAgentActivityToday(),
    getAgentWorkboard(),
  ]);
  return { rules, runs, failedRuns, inbox, packages, todayActivity, workboard };
}
