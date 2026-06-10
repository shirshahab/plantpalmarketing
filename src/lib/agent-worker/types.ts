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
  roots: "Every 1 hour",
  sentinel: "Every 4 hours",
  bloom: "Daily at 8:00 AM UTC",
  sage: "When new content appears",
  oak: "Every morning (8:00 AM UTC)",
  atlas: "Every morning (8:00 AM UTC)",
  ivy: "Every morning (8:00 AM UTC)",
  echo: "Every 6 hours",
  fern: "Every morning (8:00 AM UTC)",
};

export const SCHEDULABLE_AGENTS: SchedulableAgent[] = [
  "scout", "roots", "sentinel", "bloom", "sage", "oak", "ivy", "atlas", "echo", "fern",
];

export type WorkerAgentSlug = SchedulableAgent | AgentSlug;
