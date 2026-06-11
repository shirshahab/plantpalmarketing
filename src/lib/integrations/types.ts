export type IntegrationProvider =
  | "openai"
  | "openweather"
  | "plantnet"
  | "perenual"
  | "serpapi"
  | "x";

export type IntegrationStatus = "connected" | "disconnected" | "degraded" | "error";

/**
 * User-facing provider state. Distinguishes "the logging tables aren't ready"
 * from "the provider itself is degraded", and "no key at all" from "key invalid".
 */
export type IntegrationViewStatus =
  | "connected"
  | "degraded"
  | "error"
  | "missing_key"
  | "not_configured"
  | "logging_unavailable"
  | "unknown";

export type IntegrationLogStatus = "success" | "error" | "rate_limited";

export type XPostQueueStatus =
  | "draft"
  | "sage_review"
  | "gate_approval"
  | "queued"
  | "ready_to_publish"
  | "published"
  | "failed"
  | "rejected";

export interface ProviderConfigInfo {
  provider: IntegrationProvider;
  configured: boolean;
  label: string;
  description: string;
  envVars: string[];
  uses: string[];
}

export interface HealthCheckResult {
  provider: IntegrationProvider;
  status: IntegrationStatus;
  configured: boolean;
  message: string;
  durationMs: number;
  metadata?: Record<string, unknown>;
}
