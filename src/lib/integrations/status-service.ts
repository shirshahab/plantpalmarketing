import { createServerClient } from "@/lib/supabase/server";
import { getProviderCatalog, getXPublishCredentialStatus, isProviderConfigured } from "@/lib/integrations/config";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import { runProviderHealthCheck } from "@/lib/integrations/health";
import type { IntegrationProvider, IntegrationViewStatus } from "@/lib/integrations/types";

export interface ProviderStatusView {
  provider: IntegrationProvider;
  label: string;
  description: string;
  envVars: string[];
  uses: string[];
  status: IntegrationViewStatus;
  configured: boolean;
  /** False when the integration logging tables are missing (status history unavailable). */
  loggingAvailable: boolean;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastErrorMessage: string;
  lastHealthCheckAt: string | null;
  xReadConnected?: boolean;
  xPublishConnected?: boolean;
  xMissingPublishVars?: string[];
  /** OpenAI only: key presence + validity derived from the latest call results. */
  openaiKeyPresent?: boolean;
  openaiKeyInvalid?: boolean;
}

function isInvalidKeyError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("401") || m.includes("incorrect api key") || m.includes("invalid api key");
}

/** Never surface raw migration filenames / developer hints to regular users. */
function sanitizeErrorMessage(message: string): string {
  if (!message) return "";
  if (/migration|supabase sql|schema cache/i.test(message)) return "";
  return message;
}

function anyEnvPresent(envVars: string[]): boolean {
  return envVars.some((name) => {
    const value = process.env[name]?.trim() ?? "";
    return value.length > 0 && !value.toLowerCase().includes("your_");
  });
}

/** Maps a provider with no valid key to "missing key" vs "not configured". */
function unconfiguredStatus(envVars: string[]): IntegrationViewStatus {
  return anyEnvPresent(envVars) ? "missing_key" : "not_configured";
}

export async function getIntegrationStatuses(): Promise<ProviderStatusView[]> {
  const catalog = getProviderCatalog();
  const supabase = createServerClient();
  const { data, error } = await supabase.from("integration_status").select("*");

  // Logging tables missing: the provider keys may still be perfectly fine.
  // Mark logging as unavailable instead of degrading every provider.
  if (error && isMissingTableError(error)) {
    return catalog.map((c) => {
      const xCreds = c.provider === "x" ? getXPublishCredentialStatus() : null;
      const configured = isProviderConfigured(c.provider);
      return {
        provider: c.provider,
        label: c.label,
        description: c.description,
        envVars: c.envVars,
        uses: c.uses,
        status: configured ? "logging_unavailable" : unconfiguredStatus(c.envVars),
        configured,
        loggingAvailable: false,
        lastSuccessAt: null,
        lastErrorAt: null,
        lastErrorMessage: "",
        lastHealthCheckAt: null,
        ...(xCreds
          ? {
              xReadConnected: xCreds.readConnected,
              xPublishConnected: xCreds.publishConnected,
              xMissingPublishVars: xCreds.missingPublishVars,
            }
          : {}),
        ...(c.provider === "openai"
          ? { openaiKeyPresent: configured, openaiKeyInvalid: false }
          : {}),
      };
    });
  }

  const byProvider = new Map((data ?? []).map((r) => [r.provider, r]));

  return catalog.map((c) => {
    const row = byProvider.get(c.provider);
    const xCreds = c.provider === "x" ? getXPublishCredentialStatus() : null;
    const configured = isProviderConfigured(c.provider);
    const lastErrorMessage = sanitizeErrorMessage(row?.last_error_message ?? "");
    const lastErrorAt = row?.last_error_at ?? null;
    const lastSuccessAt = row?.last_success_at ?? null;
    // Key is considered invalid when the most recent signal is a 401/invalid-key error
    const keyInvalid =
      configured &&
      isInvalidKeyError(lastErrorMessage) &&
      (!lastSuccessAt || (lastErrorAt !== null && lastErrorAt > lastSuccessAt));

    let status: IntegrationViewStatus;
    if (!configured) {
      status = unconfiguredStatus(c.envVars);
    } else if (!row || row.status === "disconnected") {
      // Configured but never tested (or stale seed row) — unknown until a test runs
      status = "unknown";
    } else if (row.status === "connected" || row.status === "degraded" || row.status === "error") {
      status = row.status;
    } else {
      status = "unknown";
    }

    return {
      provider: c.provider,
      label: c.label,
      description: c.description,
      envVars: c.envVars,
      uses: c.uses,
      status,
      configured,
      loggingAvailable: true,
      lastSuccessAt,
      lastErrorAt,
      lastErrorMessage,
      lastHealthCheckAt: row?.last_health_check_at ?? null,
      ...(xCreds
        ? {
            xReadConnected: xCreds.readConnected,
            xPublishConnected: xCreds.publishConnected,
            xMissingPublishVars: xCreds.missingPublishVars,
          }
        : {}),
      ...(c.provider === "openai"
        ? { openaiKeyPresent: configured, openaiKeyInvalid: keyInvalid }
        : {}),
    };
  });
}

export async function testProviderConnection(provider: IntegrationProvider) {
  return runProviderHealthCheck(provider);
}
