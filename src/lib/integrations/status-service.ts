import { createServerClient } from "@/lib/supabase/server";
import { getProviderCatalog, getXPublishCredentialStatus, isProviderConfigured } from "@/lib/integrations/config";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import { runProviderHealthCheck } from "@/lib/integrations/health";
import type { IntegrationProvider, IntegrationStatus } from "@/lib/integrations/types";

export interface ProviderStatusView {
  provider: IntegrationProvider;
  label: string;
  description: string;
  envVars: string[];
  uses: string[];
  status: IntegrationStatus;
  configured: boolean;
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

export async function getIntegrationStatuses(): Promise<ProviderStatusView[]> {
  const catalog = getProviderCatalog();
  const supabase = createServerClient();
  const { data, error } = await supabase.from("integration_status").select("*");

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
        status: c.configured ? "degraded" : "disconnected",
        configured,
        lastSuccessAt: null,
        lastErrorAt: null,
        lastErrorMessage: "Run migration 031 in Supabase SQL Editor",
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
    const lastErrorMessage = row?.last_error_message ?? "";
    const lastErrorAt = row?.last_error_at ?? null;
    const lastSuccessAt = row?.last_success_at ?? null;
    // Key is considered invalid when the most recent signal is a 401/invalid-key error
    const keyInvalid =
      configured &&
      isInvalidKeyError(lastErrorMessage) &&
      (!lastSuccessAt || (lastErrorAt !== null && lastErrorAt > lastSuccessAt));
    return {
      provider: c.provider,
      label: c.label,
      description: c.description,
      envVars: c.envVars,
      uses: c.uses,
      status: (row?.status as IntegrationStatus) ?? (c.configured ? "degraded" : "disconnected"),
      configured,
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
