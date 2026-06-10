import { createServerClient } from "@/lib/supabase";
import {
  mapAgentHealth,
  mapAgentRun,
  mapAgentSchedule,
} from "@/lib/supabase/mappers";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import type { SchedulableAgent } from "@/lib/agent-worker/types";

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

export async function getAgentOperationsData() {
  const [schedules, health, recentRuns] = await Promise.all([
    getAgentSchedules(),
    getAgentHealthRecords(),
    getAgentRuns(40),
  ]);

  const running = health.filter((h) => h.status === "running").length;
  const sleeping = health.filter((h) => h.status === "sleeping" || h.status === "healthy").length;
  const failed = health.filter((h) => h.status === "failed" || h.status === "degraded").length;
  const successRuns24h = recentRuns.filter((r) => {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return r.status === "success" && new Date(r.startedAt).getTime() >= dayAgo;
  }).length;

  return {
    schedules,
    health,
    recentRuns,
    stats: {
      running,
      sleeping,
      failed,
      successRuns24h,
      totalAgents: schedules.length,
    },
  };
}
