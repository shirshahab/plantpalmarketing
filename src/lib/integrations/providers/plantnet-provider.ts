import { invokeIntegration } from "@/lib/integrations/invoke";
import { getPlantNetConfig, isPlantNetConfigured } from "@/lib/integrations/config";
import type { HealthCheckResult } from "@/lib/integrations/types";

export async function healthCheckPlantNet(): Promise<HealthCheckResult> {
  const start = Date.now();
  if (!isPlantNetConfigured()) {
    return {
      provider: "plantnet",
      status: "disconnected",
      configured: false,
      message: "PLANTNET_API_KEY not configured",
      durationMs: Date.now() - start,
    };
  }

  try {
    const { apiKey } = getPlantNetConfig();
    const res = await fetch("https://my-api.plantnet.org/v2/projects?api-key=" + apiKey, {
      cache: "no-store",
    });
    if (!res.ok) {
      return {
        provider: "plantnet",
        status: "error",
        configured: true,
        message: `PlantNet API error: ${res.status}`,
        durationMs: Date.now() - start,
      };
    }
    const projects = (await res.json()) as unknown[];
    return {
      provider: "plantnet",
      status: "connected",
      configured: true,
      message: `Connected — ${Array.isArray(projects) ? projects.length : 0} projects`,
      durationMs: Date.now() - start,
    };
  } catch (e) {
    return {
      provider: "plantnet",
      status: "error",
      configured: true,
      message: e instanceof Error ? e.message : "PlantNet health check failed",
      durationMs: Date.now() - start,
    };
  }
}

export async function enrichPlantContext(plantName: string, agentId?: string): Promise<string> {
  const { apiKey } = getPlantNetConfig();
  if (!isPlantNetConfigured()) {
    return `Plant context for ${plantName}: identification enrichment unavailable (PlantNet not configured).`;
  }

  return invokeIntegration({
    provider: "plantnet",
    action: "species_lookup",
    agentId,
    requestSummary: `plant=${plantName}`,
    fn: async () => {
      const url = `https://my-api.plantnet.org/v2/species?api-key=${apiKey}&q=${encodeURIComponent(plantName)}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`PlantNet ${res.status}`);
      const data = (await res.json()) as { results?: { species?: { scientificNameWithoutAuthor?: string } }[] };
      const scientific = data.results?.[0]?.species?.scientificNameWithoutAuthor;
      return scientific
        ? `${plantName} (${scientific}) — use PlantNet ID confidence for health diagnosis content.`
        : `${plantName} — general houseplant care content recommended.`;
    },
    summarize: (r) => r.slice(0, 60),
  });
}
