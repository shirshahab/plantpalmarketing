import { createServerClient } from "@/lib/supabase";
import type { Json } from "@/lib/supabase/database.types";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import { AGENT_RUNNER_REGISTRY } from "@/lib/agent-worker/registry";
import {
  computeNextRunAt,
  sageHasPendingContent,
  getDueAgents,
  sortSchedulesByRunOrder,
} from "@/lib/agent-worker/scheduler";
import type {
  AgentRunTrigger,
  AgentSchedule,
  AgentWorkerResult,
  SchedulableAgent,
  SchedulerBatchResult,
} from "@/lib/agent-worker/types";
import { mapAgentSchedule } from "@/lib/supabase/mappers";

async function fetchSchedules(): Promise<AgentSchedule[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("agent_schedules").select("*").eq("enabled", true);
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map(mapAgentSchedule);
}

export async function executeAgentRun(
  agentId: SchedulableAgent,
  trigger: AgentRunTrigger,
  schedule?: AgentSchedule | null
): Promise<AgentWorkerResult> {
  const supabase = createServerClient();
  const startedAt = Date.now();

  const { data: runRow, error: runInsertError } = await supabase
    .from("agent_runs")
    .insert({
      agent_id: agentId,
      schedule_id: schedule?.id ?? null,
      status: "running",
      trigger_source: trigger,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (runInsertError) {
    throw new Error(runInsertError.message);
  }

  await supabase
    .from("agent_health")
    .upsert(
      { agent_id: agentId, status: "running", updated_at: new Date().toISOString() },
      { onConflict: "agent_id" }
    );

  const runner = AGENT_RUNNER_REGISTRY[agentId];

  try {
    if (agentId === "sage") {
      const hasContent = await sageHasPendingContent();
      if (!hasContent) {
        const durationMs = Date.now() - startedAt;
        await finalizeRun(supabase, runRow.id, agentId, schedule, {
          status: "skipped",
          durationMs,
          itemsProcessed: 0,
          resultSummary: { reason: "no_pending_content" },
        });
        return {
          agentId,
          runId: runRow.id,
          status: "skipped",
          itemsProcessed: 0,
          durationMs,
        };
      }
    }

    const result = await runner.run();
    const itemsProcessed = runner.countItems(result);
    const durationMs = Date.now() - startedAt;

    await finalizeRun(supabase, runRow.id, agentId, schedule, {
      status: "success",
      durationMs,
      itemsProcessed,
      resultSummary: result,
    });

    await supabase.from("agent_activity_log").insert({
      agent_id: agentId,
      action: "scheduled_run",
      detail: `${agentId} completed background run — ${itemsProcessed} items processed`,
      metadata: { trigger, duration_ms: durationMs, items_processed: itemsProcessed },
    });

    return {
      agentId,
      runId: runRow.id,
      status: "success",
      itemsProcessed,
      durationMs,
    };
  } catch (e) {
    const durationMs = Date.now() - startedAt;
    const errorMessage = e instanceof Error ? e.message : "Agent run failed";

    await finalizeRun(supabase, runRow.id, agentId, schedule, {
      status: "failed",
      durationMs,
      itemsProcessed: 0,
      errorMessage,
      resultSummary: {},
    });

    return {
      agentId,
      runId: runRow.id,
      status: "failed",
      itemsProcessed: 0,
      durationMs,
      error: errorMessage,
    };
  }
}

async function finalizeRun(
  supabase: ReturnType<typeof createServerClient>,
  runId: string,
  agentId: SchedulableAgent,
  schedule: AgentSchedule | null | undefined,
  opts: {
    status: "success" | "failed" | "skipped";
    durationMs: number;
    itemsProcessed: number;
    errorMessage?: string;
    resultSummary: Record<string, unknown>;
  }
) {
  const completedAt = new Date().toISOString();

  await supabase
    .from("agent_runs")
    .update({
      status: opts.status,
      completed_at: completedAt,
      duration_ms: opts.durationMs,
      items_processed: opts.itemsProcessed,
      error_message: opts.errorMessage ?? null,
      result_summary: opts.resultSummary as unknown as Json,
    })
    .eq("id", runId);

  const { data: healthRow } = await supabase
    .from("agent_health")
    .select("*")
    .eq("agent_id", agentId)
    .maybeSingle();

  const prevRuns = healthRow?.total_runs ?? 0;
  const prevSuccesses = healthRow?.total_successes ?? 0;
  const prevFailures = healthRow?.total_failures ?? 0;
  const prevItemsCreated = healthRow?.total_items_created ?? 0;
  const prevAvg = healthRow?.avg_duration_ms ?? 0;
  const newRuns = prevRuns + 1;
  const newSuccesses = opts.status === "success" ? prevSuccesses + 1 : prevSuccesses;
  const newFailures = opts.status === "failed" ? prevFailures + 1 : prevFailures;
  const newItemsCreated =
    opts.status === "success" ? prevItemsCreated + opts.itemsProcessed : prevItemsCreated;
  const newAvg =
    opts.status === "success"
      ? Math.round((prevAvg * prevSuccesses + opts.durationMs) / Math.max(1, newSuccesses))
      : prevAvg;

  const consecutiveFailures =
    opts.status === "failed" ? (healthRow?.consecutive_failures ?? 0) + 1 : 0;

  let healthStatus: "healthy" | "degraded" | "failed" | "sleeping" = "sleeping";
  if (opts.status === "success") healthStatus = "healthy";
  else if (opts.status === "failed") {
    healthStatus = consecutiveFailures >= 3 ? "failed" : "degraded";
  }

  await supabase.from("agent_health").upsert(
    {
      agent_id: agentId,
      status: healthStatus,
      last_success_at: opts.status === "success" ? completedAt : healthRow?.last_success_at ?? null,
      last_failure_at: opts.status === "failed" ? completedAt : healthRow?.last_failure_at ?? null,
      last_error_message: opts.errorMessage ?? healthRow?.last_error_message ?? "",
      consecutive_failures: consecutiveFailures,
      total_runs: newRuns,
      total_successes: newSuccesses,
      total_failures: newFailures,
      total_items_created: newItemsCreated,
      last_items_created: opts.status === "success" ? opts.itemsProcessed : 0,
      avg_duration_ms: newAvg,
      updated_at: completedAt,
    },
    { onConflict: "agent_id" }
  );

  if (schedule) {
    const nextRunAt = computeNextRunAt({
      frequencyType: schedule.frequencyType,
      intervalHours: schedule.intervalHours,
      intervalMinutes: schedule.intervalMinutes,
      dailyAtHour: schedule.dailyAtHour,
      dailyAtMinute: schedule.dailyAtMinute,
      lastRunAt: completedAt,
    });

    await supabase
      .from("agent_schedules")
      .update({
        last_run_at: completedAt,
        next_run_at: nextRunAt,
        updated_at: completedAt,
      })
      .eq("id", schedule.id);
  }
}

export async function runScheduledAgentBatch(
  trigger: AgentRunTrigger = "cron"
): Promise<SchedulerBatchResult> {
  const schedules = await fetchSchedules();
  if (schedules.length === 0) {
    return {
      triggered: [],
      skipped: [],
      errors: ["agent_schedules table missing or empty — see /admin/setup-health"],
    };
  }

  const { due, waiting } = await getDueAgents(schedules);
  const ordered = sortSchedulesByRunOrder(due);
  const triggered: AgentWorkerResult[] = [];
  const errors: string[] = [];

  for (const schedule of ordered) {
    try {
      const result = await executeAgentRun(schedule.agentId, trigger, schedule);
      triggered.push(result);
    } catch (e) {
      errors.push(`${schedule.agentId}: ${e instanceof Error ? e.message : "unknown error"}`);
    }
  }

  return {
    triggered,
    skipped: waiting.map((s) => s.agentId),
    errors,
  };
}

export async function runAgentManually(agentId: SchedulableAgent): Promise<AgentWorkerResult> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("agent_schedules")
    .select("*")
    .eq("agent_id", agentId)
    .maybeSingle();

  const schedule = data ? mapAgentSchedule(data) : null;
  return executeAgentRun(agentId, "manual", schedule);
}
