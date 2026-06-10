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
}

export async function getIntegrationStatuses(): Promise<ProviderStatusView[]> {
  const catalog = getProviderCatalog();
  const supabase = createServerClient();
  const { data, error } = await supabase.from("integration_status").select("*");

  if (error && isMissingTableError(error)) {
    return catalog.map((c) => {
      const xCreds = c.provider === "x" ? getXPublishCredentialStatus() : null;
      return {
        provider: c.provider,
        label: c.label,
        description: c.description,
        envVars: c.envVars,
        uses: c.uses,
        status: c.configured ? "degraded" : "disconnected",
        configured: isProviderConfigured(c.provider),
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
      };
    });
  }

  const byProvider = new Map((data ?? []).map((r) => [r.provider, r]));

  return catalog.map((c) => {
    const row = byProvider.get(c.provider);
    const xCreds = c.provider === "x" ? getXPublishCredentialStatus() : null;
    return {
      provider: c.provider,
      label: c.label,
      description: c.description,
      envVars: c.envVars,
      uses: c.uses,
      status: (row?.status as IntegrationStatus) ?? (c.configured ? "degraded" : "disconnected"),
      configured: isProviderConfigured(c.provider),
      lastSuccessAt: row?.last_success_at ?? null,
      lastErrorAt: row?.last_error_at ?? null,
      lastErrorMessage: row?.last_error_message ?? "",
      lastHealthCheckAt: row?.last_health_check_at ?? null,
      ...(xCreds
        ? {
            xReadConnected: xCreds.readConnected,
            xPublishConnected: xCreds.publishConnected,
            xMissingPublishVars: xCreds.missingPublishVars,
          }
        : {}),
    };
  });
}

export async function testProviderConnection(provider: IntegrationProvider) {
  return runProviderHealthCheck(provider);
}
