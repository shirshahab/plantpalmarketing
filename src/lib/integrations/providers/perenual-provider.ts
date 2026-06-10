import { invokeIntegration } from "@/lib/integrations/invoke";
import { getPerenualConfig, isPerenualConfigured } from "@/lib/integrations/config";
import type { HealthCheckResult } from "@/lib/integrations/types";

export interface PlantCareInfo {
  name: string;
  watering: string;
  sunlight: string;
  careLevel: string;
}

export async function healthCheckPerenual(): Promise<HealthCheckResult> {
  const start = Date.now();
  if (!isPerenualConfigured()) {
    return {
      provider: "perenual",
      status: "disconnected",
      configured: false,
      message: "PERENUAL_API_KEY not configured",
      durationMs: Date.now() - start,
    };
  }

  try {
    const info = await fetchPlantCare("monstera", "health_check");
    return {
      provider: "perenual",
      status: "connected",
      configured: true,
      message: `Connected — sample: ${info.name}, ${info.watering}`,
      durationMs: Date.now() - start,
    };
  } catch (e) {
    return {
      provider: "perenual",
      status: "error",
      configured: true,
      message: e instanceof Error ? e.message : "Perenual health check failed",
      durationMs: Date.now() - start,
    };
  }
}

export async function fetchPlantCare(plantName: string, agentId?: string): Promise<PlantCareInfo> {
  const { apiKey } = getPerenualConfig();
  return invokeIntegration({
    provider: "perenual",
    action: "species_detail",
    agentId,
    requestSummary: `plant=${plantName}`,
    fn: async () => {
      const url = `https://perenual.com/api/species-list?key=${apiKey}&q=${encodeURIComponent(plantName)}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Perenual ${res.status}`);
      const data = (await res.json()) as {
        data?: {
          common_name?: string;
          watering?: string;
          sunlight?: string[];
          care_level?: string;
        }[];
      };
      const row = data.data?.[0];
      return {
        name: row?.common_name ?? plantName,
        watering: row?.watering ?? "Average",
        sunlight: (row?.sunlight ?? ["partial shade"]).join(", "),
        careLevel: row?.care_level ?? "Moderate",
      };
    },
    summarize: (r) => r.name,
  });
}

export async function getPlantCareSummary(plantName: string, agentId?: string): Promise<string> {
  if (!isPerenualConfigured()) {
    return `${plantName}: care data unavailable (Perenual not configured).`;
  }
  const care = await fetchPlantCare(plantName, agentId);
  return `${care.name}: water ${care.watering}, light ${care.sunlight}, care level ${care.careLevel}.`;
}
