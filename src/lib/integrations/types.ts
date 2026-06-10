export type IntegrationProvider =
  | "openai"
  | "openweather"
  | "plantnet"
  | "perenual"
  | "serpapi"
  | "x";

export type IntegrationStatus = "connected" | "disconnected" | "degraded" | "error";

export type IntegrationLogStatus = "success" | "error" | "rate_limited";

export type XPostQueueStatus =
  | "draft"
  | "sage_review"
  | "gate_approval"
  | "queued"
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
