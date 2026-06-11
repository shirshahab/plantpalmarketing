import { createServerClient } from "@/lib/supabase";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import { mapAgentHealth, mapAgentRun, mapAgentSchedule } from "@/lib/supabase/mappers";
import { SCHEDULE_LABELS } from "@/lib/agent-worker/types";
import type { AgentHealth, AgentRun, AgentSchedule, SchedulableAgent } from "@/lib/agent-worker/types";

export interface ScheduleRow {
  agentId: SchedulableAgent;
  scheduleLabel: string;
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  healthStatus: string;
  avgDurationMs: number;
  successRate: number | null;
  totalRuns: number;
  errorCount: number;
  lastErrorMessage: string;
  recentRuns: AgentRun[];
}

export interface SchedulesPageData {
  rows: ScheduleRow[];
  recentRuns: AgentRun[];
}

export async function getSchedulesPageData(): Promise<SchedulesPageData> {
  const supabase = createServerClient();

  const [schedulesRes, healthRes, runsRes] = await Promise.all([
    supabase.from("agent_schedules").select("*"),
    supabase.from("agent_health").select("*"),
    supabase.from("agent_runs").select("*").order("started_at", { ascending: false }).limit(120),
  ]);

  const schedules: AgentSchedule[] =
    schedulesRes.error && isMissingTableError(schedulesRes.error)
      ? []
      : (schedulesRes.data ?? []).map(mapAgentSchedule);
  const health: AgentHealth[] =
    healthRes.error && isMissingTableError(healthRes.error)
      ? []
      : (healthRes.data ?? []).map(mapAgentHealth);
  const runs: AgentRun[] =
    runsRes.error && isMissingTableError(runsRes.error) ? [] : (runsRes.data ?? []).map(mapAgentRun);

  const healthByAgent = new Map(health.map((h) => [h.agentId, h]));

  const rows: ScheduleRow[] = schedules
    .map((schedule) => {
      const h = healthByAgent.get(schedule.agentId);
      const agentRuns = runs.filter((r) => r.agentId === schedule.agentId).slice(0, 5);
      const totalRuns = h?.totalRuns ?? 0;
      return {
        agentId: schedule.agentId,
        scheduleLabel: SCHEDULE_LABELS[schedule.agentId] ?? "Custom",
        enabled: schedule.enabled,
        lastRunAt: schedule.lastRunAt,
        nextRunAt: schedule.nextRunAt,
        healthStatus: h?.status ?? "sleeping",
        avgDurationMs: h?.avgDurationMs ?? 0,
        successRate: totalRuns > 0 ? Math.round(((h?.totalSuccesses ?? 0) / totalRuns) * 100) : null,
        totalRuns,
        errorCount: h?.totalFailures ?? 0,
        lastErrorMessage: h?.lastErrorMessage ?? "",
        recentRuns: agentRuns,
      };
    })
    .sort((a, b) => a.agentId.localeCompare(b.agentId));

  return { rows, recentRuns: runs.slice(0, 25) };
}
