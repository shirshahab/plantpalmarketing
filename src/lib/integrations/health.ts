import { healthCheckOpenAI } from "@/lib/integrations/providers/openai-provider";
import { healthCheckOpenWeather } from "@/lib/integrations/providers/openweather-provider";
import { healthCheckPlantNet } from "@/lib/integrations/providers/plantnet-provider";
import { healthCheckPerenual } from "@/lib/integrations/providers/perenual-provider";
import { healthCheckSerpApi } from "@/lib/integrations/providers/serpapi-provider";
import { healthCheckX } from "@/lib/integrations/x-service";
import { updateProviderStatus, recordHealthCheck } from "@/lib/integrations/log";
import type { HealthCheckResult, IntegrationProvider } from "@/lib/integrations/types";
import { isProviderConfigured } from "@/lib/integrations/config";

const CHECKERS: Record<IntegrationProvider, () => Promise<HealthCheckResult>> = {
  openai: healthCheckOpenAI,
  openweather: healthCheckOpenWeather,
  plantnet: healthCheckPlantNet,
  perenual: healthCheckPerenual,
  serpapi: healthCheckSerpApi,
  x: healthCheckX,
};

export async function runProviderHealthCheck(provider: IntegrationProvider): Promise<HealthCheckResult> {
  const result = await CHECKERS[provider]();
  await updateProviderStatus(provider, result.status, {
    configured: isProviderConfigured(provider),
    success: result.status === "connected",
    errorMessage: result.status === "error" ? result.message : undefined,
    metadata: result.metadata,
  });
  await recordHealthCheck({
    provider,
    status: result.status,
    message: result.message,
    durationMs: result.durationMs,
    metadata: result.metadata,
  });
  return result;
}

export async function runAllHealthChecks(): Promise<HealthCheckResult[]> {
  const providers = Object.keys(CHECKERS) as IntegrationProvider[];
  return Promise.all(providers.map(runProviderHealthCheck));
}
