import type { AgentSlug } from "@/lib/types";

export type SchedulableAgent =
  | "scout" | "roots" | "sentinel" | "bloom" | "sage"
  | "oak" | "ivy" | "atlas" | "fern" | "echo"
  | "sprout" | "gate";

export type AgentFrequencyType = "interval_hours" | "interval_minutes" | "daily_at" | "on_content";
export type AgentRunStatus = "running" | "success" | "failed" | "skipped";
export type AgentHealthStatus = "running" | "sleeping" | "healthy" | "degraded" | "failed";
export type AgentRunTrigger = "scheduled" | "manual" | "cron" | "content_event";

export interface AgentSchedule {
  id: string;
  agentId: SchedulableAgent;
  frequencyType: AgentFrequencyType;
  intervalHours: number | null;
  intervalMinutes: number | null;
  dailyAtHour: number | null;
  dailyAtMinute: number;
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface AgentRun {
  id: string;
  agentId: SchedulableAgent;
  scheduleId: string | null;
  status: AgentRunStatus;
  triggerSource: AgentRunTrigger;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  itemsProcessed: number;
  errorMessage: string | null;
  resultSummary: Record<string, unknown>;
  createdAt: string;
}

export interface AgentHealth {
  id: string;
  agentId: SchedulableAgent;
  status: AgentHealthStatus;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastErrorMessage: string;
  consecutiveFailures: number;
  totalRuns: number;
  totalSuccesses: number;
  totalFailures: number;
  totalItemsCreated: number;
  lastItemsCreated: number;
  avgDurationMs: number;
  updatedAt: string;
}

export interface AgentWorkerResult {
  agentId: SchedulableAgent;
  runId: string;
  status: AgentRunStatus;
  itemsProcessed: number;
  durationMs: number;
  error?: string;
}

export interface SchedulerBatchResult {
  triggered: AgentWorkerResult[];
  skipped: SchedulableAgent[];
  errors: string[];
}

export const SCHEDULE_LABELS: Record<SchedulableAgent, string> = {
  scout: "Every 2 hours",
  roots: "Every hour",
  sentinel: "Every 4 hours",
  bloom: "Event-driven + every 4 hours",
  sage: "Event-driven (content review)",
  gate: "Event-driven (approvals)",
  sprout: "Every 30 minutes",
  oak: "Every morning (9:00 AM UTC)",
  atlas: "Every 6 hours",
  ivy: "Daily at 8:00 AM UTC",
  echo: "Every 6 hours",
  fern: "Event-driven (creative work)",
};

/** Phase 24 — autonomous Vercel Cron agents */
export const PHASE24_SCHEDULED_AGENTS: SchedulableAgent[] = [
  "scout",
  "roots",
  "sentinel",
  "bloom",
  "sage",
  "oak",
  "ivy",
  "atlas",
  "fern",
  "echo",
];

export const SCHEDULABLE_AGENTS: SchedulableAgent[] = [
  ...PHASE24_SCHEDULED_AGENTS,
  "sprout",
  "gate",
];

export interface AgentScheduleStats {
  agentId: SchedulableAgent;
  lastRunAt: string | null;
  nextRunAt: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastRunStatus: AgentRunStatus | null;
  lastItemsCreated: number;
  successCount: number;
  failureCount: number;
  itemsCreated: number;
}

export interface HQAgentScheduleHealth {
  agentId: SchedulableAgent;
  healthStatus: AgentHealthStatus;
  lastRunAt: string | null;
  nextRunAt: string | null;
  lastRunStatus: AgentRunStatus | null;
  lastErrorMessage: string | null;
}

export type WorkerAgentSlug = SchedulableAgent | AgentSlug;
