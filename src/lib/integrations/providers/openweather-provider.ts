import { invokeIntegration } from "@/lib/integrations/invoke";
import { getOpenWeatherConfig, isOpenWeatherConfigured } from "@/lib/integrations/config";
import type { HealthCheckResult } from "@/lib/integrations/types";

export interface WeatherSnapshot {
  city: string;
  tempC: number;
  description: string;
  humidity: number;
  gardeningTip: string;
}

export async function healthCheckOpenWeather(): Promise<HealthCheckResult> {
  const start = Date.now();
  if (!isOpenWeatherConfigured()) {
    return {
      provider: "openweather",
      status: "disconnected",
      configured: false,
      message: "OPENWEATHER_API_KEY not configured",
      durationMs: Date.now() - start,
    };
  }

  try {
    const snap = await fetchCurrentWeather("London", "health_check");
    return {
      provider: "openweather",
      status: "connected",
      configured: true,
      message: `Connected — ${snap.city}: ${snap.tempC}°C, ${snap.description}`,
      durationMs: Date.now() - start,
      metadata: { tempC: snap.tempC },
    };
  } catch (e) {
    return {
      provider: "openweather",
      status: "error",
      configured: true,
      message: e instanceof Error ? e.message : "OpenWeather health check failed",
      durationMs: Date.now() - start,
    };
  }
}

export async function fetchCurrentWeather(city = "London", agentId?: string): Promise<WeatherSnapshot> {
  const { apiKey } = getOpenWeatherConfig();
  return invokeIntegration({
    provider: "openweather",
    action: "current_weather",
    agentId,
    requestSummary: `city=${city}`,
    fn: async () => {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`OpenWeather ${res.status}`);
      const data = (await res.json()) as {
        name: string;
        main: { temp: number; humidity: number };
        weather: { description: string }[];
      };
      const desc = data.weather[0]?.description ?? "clear";
      const temp = Math.round(data.main.temp);
      const tip =
        temp > 28
          ? "Heat alert — remind users to water early morning and shade sensitive plants."
          : temp < 5
            ? "Frost risk — cover outdoor containers and pause repotting."
            : "Mild conditions — good window for pruning and fertilizing.";
      return {
        city: data.name,
        tempC: temp,
        description: desc,
        humidity: data.main.humidity,
        gardeningTip: tip,
      };
    },
    summarize: (r) => `${r.city} ${r.tempC}°C`,
  });
}

export async function getGardeningWeatherContent(city?: string, agentId?: string): Promise<string> {
  const snap = await fetchCurrentWeather(city ?? "London", agentId);
  return `Weather in ${snap.city}: ${snap.tempC}°C, ${snap.description}. ${snap.gardeningTip}`;
}
