import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import type { IntegrationProvider, IntegrationLogStatus } from "@/lib/integrations/types";
import type { Json } from "@/lib/supabase/database.types";

export async function logIntegrationCall(opts: {
  provider: IntegrationProvider;
  action: string;
  status: IntegrationLogStatus;
  requestSummary?: string;
  responseSummary?: string;
  errorMessage?: string;
  durationMs?: number;
  agentId?: string;
}) {
  try {
    const supabase = createServerClient();
    const message = [
      opts.action,
      opts.requestSummary,
      opts.responseSummary,
    ]
      .filter(Boolean)
      .join(" — ");

    const { error } = await supabase.from("integration_logs").insert({
      provider: opts.provider,
      status: opts.status,
      message: message || opts.action,
      error: opts.errorMessage ?? null,
      metadata: {
        action: opts.action,
        agent_id: opts.agentId ?? null,
        duration_ms: opts.durationMs ?? null,
        request_summary: opts.requestSummary ?? "",
        response_summary: opts.responseSummary ?? "",
      },
    });
    if (error && !isMissingTableError(error)) {
      console.error("[integration_logs]", error.message);
    }
  } catch {
    // Logging must not break primary flow
  }
}

export async function recordRateLimitHit(provider: IntegrationProvider, maxPerMinute: number) {
  try {
    const supabase = createServerClient();
    const windowStart = new Date(Math.floor(Date.now() / 60_000) * 60_000).toISOString();
    const { error } = await supabase.from("api_rate_limits").insert({
      provider,
      window_start: windowStart,
      request_count: 1,
      max_per_minute: maxPerMinute,
    });
    if (error && !isMissingTableError(error)) {
      console.error("[api_rate_limits]", error.message);
    }
  } catch {
    // best-effort
  }
}

export async function recordHealthCheck(opts: {
  provider: IntegrationProvider;
  status: string;
  message: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}) {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("provider_health_checks").insert({
      provider: opts.provider,
      status: opts.status,
      message: opts.message,
      duration_ms: opts.durationMs ?? null,
      metadata: (opts.metadata ?? null) as Json,
    });
    if (error && !isMissingTableError(error)) {
      console.error("[provider_health_checks]", error.message);
    }
  } catch {
    // best-effort
  }
}

export async function updateProviderStatus(
  provider: IntegrationProvider,
  status: "connected" | "disconnected" | "degraded" | "error",
  opts: { configured?: boolean; errorMessage?: string; metadata?: Record<string, unknown>; success?: boolean } = {}
) {
  try {
    const supabase = createServerClient();
    const patch = {
      status,
      configured: opts.configured ?? status === "connected",
      last_health_check_at: new Date().toISOString(),
      ...(opts.success
        ? { last_success_at: new Date().toISOString(), last_error_message: "" }
        : {}),
      ...(opts.errorMessage
        ? {
            last_error_at: new Date().toISOString(),
            last_error_message: opts.errorMessage.slice(0, 500),
          }
        : {}),
      ...(opts.metadata ? { metadata: opts.metadata as Json } : {}),
    };

    const { error } = await supabase.from("integration_status").upsert(
      { provider, ...patch },
      { onConflict: "provider" }
    );
    if (error && !isMissingTableError(error)) {
      console.error("[integration_status]", error.message);
    }
  } catch {
    // Status update is best-effort
  }
}
