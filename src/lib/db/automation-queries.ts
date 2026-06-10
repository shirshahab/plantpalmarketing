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

export async function getAutomationPageData() {
  const [rules, runs, failedRuns, inbox, packages, todayActivity] = await Promise.all([
    getAutomationRules(),
    getAutomationRuns(30),
    getFailedAutomationRuns(10),
    getBatchInboxItems(),
    getPublishingPackages(),
    getAgentActivityToday(),
  ]);
  return { rules, runs, failedRuns, inbox, packages, todayActivity };
}
