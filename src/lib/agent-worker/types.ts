import type { AgentSlug } from "@/lib/types";

export type SchedulableAgent =
  | "scout" | "roots" | "sentinel" | "bloom" | "sage"
  | "oak" | "ivy" | "atlas" | "fern" | "echo";

export type AgentFrequencyType = "interval_hours" | "daily_at" | "on_content";
export type AgentRunStatus = "running" | "success" | "failed" | "skipped";
export type AgentHealthStatus = "running" | "sleeping" | "healthy" | "degraded" | "failed";
export type AgentRunTrigger = "scheduled" | "manual" | "cron" | "content_event";

export interface AgentSchedule {
  id: string;
  agentId: SchedulableAgent;
  frequencyType: AgentFrequencyType;
  intervalHours: number | null;
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
  scout: "Every 6 hours",
  roots: "Every hour",
  sentinel: "Every 4 hours",
  bloom: "Every morning (8:00 AM UTC)",
  sage: "When content exists",
  oak: "Manual only (disabled)",
  atlas: "Every morning (8:00 AM UTC)",
  ivy: "Every morning (8:00 AM UTC)",
  echo: "Every 6 hours",
  fern: "Manual only (disabled)",
};

/** Phase 24 — autonomous Vercel Cron agents */
export const PHASE24_SCHEDULED_AGENTS: SchedulableAgent[] = [
  "scout",
  "roots",
  "sentinel",
  "bloom",
  "sage",
  "ivy",
  "atlas",
  "echo",
];

export const SCHEDULABLE_AGENTS: SchedulableAgent[] = [
  ...PHASE24_SCHEDULED_AGENTS,
  "oak",
  "fern",
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

export type WorkerAgentSlug = SchedulableAgent | AgentSlug;
