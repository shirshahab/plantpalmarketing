import { createServerClient } from "@/lib/supabase";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import type { AgentSchedule, SchedulableAgent } from "@/lib/agent-worker/types";

export function computeNextRunAt(schedule: {
  frequencyType: string;
  intervalHours: number | null;
  intervalMinutes: number | null;
  dailyAtHour: number | null;
  dailyAtMinute: number;
  lastRunAt: string | null;
}): string {
  const now = new Date();

  if (schedule.frequencyType === "interval_hours" && schedule.intervalHours) {
    const base = schedule.lastRunAt ? new Date(schedule.lastRunAt) : now;
    const next = new Date(base.getTime() + schedule.intervalHours * 60 * 60 * 1000);
    return (next > now ? next : new Date(now.getTime() + schedule.intervalHours * 60 * 60 * 1000)).toISOString();
  }

  if (schedule.frequencyType === "daily_at") {
    const hour = schedule.dailyAtHour ?? 8;
    const minute = schedule.dailyAtMinute ?? 0;
    const next = new Date(now);
    next.setUTCHours(hour, minute, 0, 0);
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    return next.toISOString();
  }

  // on_content — Sage polls every interval_minutes when content needs review
  const pollMinutes = schedule.intervalMinutes ?? 30;
  const base = schedule.lastRunAt ? new Date(schedule.lastRunAt) : now;
  const next = new Date(base.getTime() + pollMinutes * 60 * 1000);
  return (next > now ? next : new Date(now.getTime() + pollMinutes * 60 * 1000)).toISOString();
}

export async function sageHasPendingContent(): Promise<boolean> {
  try {
    const supabase = createServerClient();
    const { count, error } = await supabase
      .from("bloom_content_pieces")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending", "draft"]);
    if (error) {
      if (isMissingTableError(error)) return false;
      throw new Error(error.message);
    }
    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}

export async function isAgentDue(
  schedule: AgentSchedule,
  now = new Date()
): Promise<{ due: boolean; reason?: string }> {
  if (!schedule.enabled) return { due: false, reason: "disabled" };

  if (schedule.frequencyType === "on_content") {
    const hasContent = await sageHasPendingContent();
    if (!hasContent) return { due: false, reason: "no_pending_content" };
    if (schedule.nextRunAt && new Date(schedule.nextRunAt) > now) {
      return { due: false, reason: "sage_cooldown" };
    }
    return { due: true, reason: "pending_content" };
  }

  if (!schedule.nextRunAt) return { due: true, reason: "no_next_run" };

  return new Date(schedule.nextRunAt) <= now
    ? { due: true, reason: "next_run_reached" }
    : { due: false, reason: "waiting" };
}

export async function getDueAgents(
  schedules: AgentSchedule[]
): Promise<{ due: AgentSchedule[]; waiting: AgentSchedule[] }> {
  const due: AgentSchedule[] = [];
  const waiting: AgentSchedule[] = [];

  for (const schedule of schedules) {
    const check = await isAgentDue(schedule);
    if (check.due) due.push(schedule);
    else waiting.push(schedule);
  }

  return { due, waiting };
}

/** Morning batch order: discovery → content → review → partnerships → growth */
export const RUN_ORDER: SchedulableAgent[] = [
  "scout",
  "roots",
  "sentinel",
  "echo",
  "bloom",
  "sage",
  "oak",
  "atlas",
  "fern",
  "ivy",
];

export function sortSchedulesByRunOrder(schedules: AgentSchedule[]): AgentSchedule[] {
  return [...schedules].sort(
    (a, b) => RUN_ORDER.indexOf(a.agentId) - RUN_ORDER.indexOf(b.agentId)
  );
}
