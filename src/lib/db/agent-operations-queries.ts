import { createServerClient } from "@/lib/supabase";
import {
  mapAgentHealth,
  mapAgentRun,
  mapAgentSchedule,
} from "@/lib/supabase/mappers";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import { getAgentOperationsHealth } from "@/lib/agent-operations/health";
import {
  PHASE24_SCHEDULED_AGENTS,
  type AgentScheduleStats,
  type HQAgentScheduleHealth,
  type SchedulableAgent,
} from "@/lib/agent-worker/types";

export async function getAgentSchedules() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("agent_schedules")
    .select("*")
    .order("agent_id");
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map(mapAgentSchedule);
}

export async function getAgentHealthRecords() {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("agent_health").select("*").order("agent_id");
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map(mapAgentHealth);
}

export async function getAgentRuns(limit = 50, agentId?: SchedulableAgent) {
  const supabase = createServerClient();
  let q = supabase.from("agent_runs").select("*").order("started_at", { ascending: false }).limit(limit);
  if (agentId) q = q.eq("agent_id", agentId);
  const { data, error } = await q;
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map(mapAgentRun);
}

function buildScheduleStats(
  schedules: Awaited<ReturnType<typeof getAgentSchedules>>,
  health: Awaited<ReturnType<typeof getAgentHealthRecords>>,
  recentRuns: Awaited<ReturnType<typeof getAgentRuns>>
): AgentScheduleStats[] {
  const healthByAgent = new Map(health.map((h) => [h.agentId, h]));
  const lastRunByAgent = new Map<SchedulableAgent, (typeof recentRuns)[number]>();

  for (const run of recentRuns) {
    if (!lastRunByAgent.has(run.agentId)) {
      lastRunByAgent.set(run.agentId, run);
    }
  }

  const activeSchedules = schedules.filter(
    (s) => s.enabled && PHASE24_SCHEDULED_AGENTS.includes(s.agentId)
  );

  return activeSchedules.map((schedule) => {
    const h = healthByAgent.get(schedule.agentId);
    const lastRun = lastRunByAgent.get(schedule.agentId);

    return {
      agentId: schedule.agentId,
      lastRunAt: schedule.lastRunAt,
      nextRunAt: schedule.nextRunAt,
      lastSuccessAt: h?.lastSuccessAt ?? null,
      lastFailureAt: h?.lastFailureAt ?? null,
      lastRunStatus: lastRun?.status ?? null,
      lastItemsCreated: h?.lastItemsCreated ?? lastRun?.itemsProcessed ?? 0,
      successCount: h?.totalSuccesses ?? 0,
      failureCount: h?.totalFailures ?? 0,
      itemsCreated: h?.totalItemsCreated ?? 0,
    };
  });
}

export async function getAgentOperationsData() {
  const [schedules, health, recentRuns, opsHealth] = await Promise.all([
    getAgentSchedules(),
    getAgentHealthRecords(),
    getAgentRuns(60),
    getAgentOperationsHealth(),
  ]);

  const scheduleStats = buildScheduleStats(schedules, health, recentRuns);
  const activeSchedules = schedules.filter((s) => s.enabled);

  const running = health.filter((h) => h.status === "running").length;
  const sleeping = health.filter((h) => h.status === "sleeping" || h.status === "healthy").length;
  const failed = health.filter((h) => h.status === "failed" || h.status === "degraded").length;
  const successRuns24h = recentRuns.filter((r) => {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return r.status === "success" && new Date(r.startedAt).getTime() >= dayAgo;
  }).length;
  const itemsCreated24h = recentRuns
    .filter((r) => {
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      return r.status === "success" && new Date(r.startedAt).getTime() >= dayAgo;
    })
    .reduce((sum, r) => sum + r.itemsProcessed, 0);

  return {
    schedules: activeSchedules,
    health,
    recentRuns,
    scheduleStats,
    opsHealth,
    stats: {
      running,
      sleeping,
      failed,
      successRuns24h,
      itemsCreated24h,
      totalAgents: activeSchedules.length,
      cronSchedule: "*/30 * * * * (every 30 min)",
    },
  };
}

export async function getHQAgentScheduleHealth(): Promise<HQAgentScheduleHealth[]> {
  const [schedules, health, recentRuns] = await Promise.all([
    getAgentSchedules(),
    getAgentHealthRecords(),
    getAgentRuns(30),
  ]);

  const healthByAgent = new Map(health.map((h) => [h.agentId, h]));
  const lastRunByAgent = new Map<SchedulableAgent, (typeof recentRuns)[number]>();

  for (const run of recentRuns) {
    if (!lastRunByAgent.has(run.agentId)) {
      lastRunByAgent.set(run.agentId, run);
    }
  }

  return PHASE24_SCHEDULED_AGENTS.map((agentId) => {
    const schedule = schedules.find((s) => s.agentId === agentId && s.enabled);
    const h = healthByAgent.get(agentId);
    const lastRun = lastRunByAgent.get(agentId);

    return {
      agentId,
      healthStatus: h?.status ?? "sleeping",
      lastRunAt: schedule?.lastRunAt ?? null,
      nextRunAt: schedule?.nextRunAt ?? null,
      lastRunStatus: lastRun?.status ?? null,
      lastErrorMessage: h?.lastErrorMessage || lastRun?.errorMessage || null,
    };
  });
}
