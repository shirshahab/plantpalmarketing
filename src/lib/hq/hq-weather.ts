import type { WeatherSnapshot } from "@/lib/integrations/providers/openweather-provider";

export type HQWeatherCondition = "clear" | "clouds" | "rain" | "drizzle" | "snow" | "mist" | "storm";

export interface HQWeatherState {
  condition: HQWeatherCondition;
  tempC: number;
  humidity: number;
  description: string;
  city: string;
  label: string;
  windIntensity: number;
  particleDensity: number;
  cloudOpacity: number;
  live: boolean;
}

export function inferWeatherCondition(description: string): HQWeatherCondition {
  const d = description.toLowerCase();
  if (d.includes("thunder") || d.includes("storm")) return "storm";
  if (d.includes("snow") || d.includes("sleet")) return "snow";
  if (d.includes("drizzle")) return "drizzle";
  if (d.includes("rain")) return "rain";
  if (d.includes("mist") || d.includes("fog") || d.includes("haze")) return "mist";
  if (d.includes("cloud") || d.includes("overcast")) return "clouds";
  return "clear";
}

export function weatherSnapshotToHQState(snap: WeatherSnapshot): HQWeatherState {
  const condition = inferWeatherCondition(snap.description);
  return {
    condition,
    tempC: snap.tempC,
    humidity: snap.humidity,
    description: snap.description,
    city: snap.city,
    label: `${snap.city} · ${snap.tempC}°C · ${snap.description}`,
    windIntensity: condition === "storm" ? 1 : condition === "rain" ? 0.7 : condition === "clouds" ? 0.35 : 0.15,
    particleDensity: condition === "storm" ? 1 : condition === "rain" ? 0.75 : condition === "drizzle" ? 0.45 : condition === "snow" ? 0.8 : 0,
    cloudOpacity: condition === "clear" ? 0.35 : condition === "clouds" ? 0.75 : condition === "mist" ? 0.55 : 0.9,
    live: true,
  };
}

export function defaultHQWeatherState(): HQWeatherState {
  return {
    condition: "clear",
    tempC: 22,
    humidity: 50,
    description: "clear sky",
    city: "Garden",
    label: "Garden weather · simulated clear skies",
    windIntensity: 0.15,
    particleDensity: 0,
    cloudOpacity: 0.35,
    live: false,
  };
}
