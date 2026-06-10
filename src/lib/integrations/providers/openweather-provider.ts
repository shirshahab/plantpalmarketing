import { invokeIntegration } from "@/lib/integrations/invoke";
import { getOpenWeatherConfig, isOpenWeatherConfigured } from "@/lib/integrations/config";
import type { HealthCheckResult } from "@/lib/integrations/types";

export interface WeatherSnapshot {
  city: string;
  tempC: number;
  description: string;
  humidity: number;
  windSpeed: number;
  clouds: number;
  rain1h: number;
  snow1h: number;
  weatherMain: string;
  gardeningTip: string;
}

function gardeningTipFromConditions(tempC: number, humidity: number, rain1h: number, main: string): string {
  const mainLower = main.toLowerCase();
  if (rain1h > 0 || mainLower.includes("rain") || mainLower.includes("drizzle")) {
    return "Rainy stretch — Roots should engage plant parents with indoor care tips. Bloom can draft cozy rainy-day content.";
  }
  if (tempC > 32 && humidity < 45) {
    return "OpenWeather reports warm dry conditions. Bloom should create watering reminders and heat-stress content.";
  }
  if (tempC > 28) {
    return "Heat alert — remind users to water early morning and shade sensitive plants.";
  }
  if (tempC < 5) {
    return "Frost risk — cover outdoor containers and pause repotting.";
  }
  if (humidity > 75) {
    return "Humid air — watch for fungal issues; Roots can share ventilation tips.";
  }
  return "Mild gardening weather — good window for pruning, repotting, and educational posts.";
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

export async function fetchCurrentWeather(location = "Pasadena,CA,US", agentId?: string): Promise<WeatherSnapshot> {
  const { apiKey } = getOpenWeatherConfig();
  return invokeIntegration({
    provider: "openweather",
    action: "current_weather",
    agentId,
    requestSummary: `location=${location}`,
    fn: async () => {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=metric&appid=${apiKey}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`OpenWeather ${res.status}`);
      const data = (await res.json()) as {
        name: string;
        main: { temp: number; humidity: number };
        weather: { main: string; description: string }[];
        wind?: { speed: number };
        clouds?: { all: number };
        rain?: { "1h"?: number };
        snow?: { "1h"?: number };
      };
      const desc = data.weather[0]?.description ?? "clear";
      const main = data.weather[0]?.main ?? "Clear";
      const temp = Math.round(data.main.temp);
      const rain1h = data.rain?.["1h"] ?? 0;
      const snow1h = data.snow?.["1h"] ?? 0;
      return {
        city: data.name,
        tempC: temp,
        description: desc,
        humidity: data.main.humidity,
        windSpeed: data.wind?.speed ?? 0,
        clouds: data.clouds?.all ?? 0,
        rain1h,
        snow1h,
        weatherMain: main,
        gardeningTip: gardeningTipFromConditions(temp, data.main.humidity, rain1h, main),
      };
    },
    summarize: (r) => `${r.city} ${r.tempC}°C`,
  });
}

export async function getGardeningWeatherContent(location?: string, agentId?: string): Promise<string> {
  const snap = await fetchCurrentWeather(location ?? "Pasadena,CA,US", agentId);
  return `Weather in ${snap.city}: ${snap.tempC}°C, ${snap.description}. ${snap.gardeningTip}`;
}
