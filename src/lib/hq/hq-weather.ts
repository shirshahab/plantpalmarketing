import type { WeatherSnapshot } from "@/lib/integrations/providers/openweather-provider";
import { getDayPhase, type DayPhase } from "@/lib/hq/world-time";

export type HQWeatherCondition = "clear" | "clouds" | "rain" | "drizzle" | "snow" | "mist" | "storm";

export interface HQWeatherApiResponse {
  condition: HQWeatherCondition;
  temperature: number;
  temperature_unit: "F";
  humidity: number;
  wind_speed: number;
  clouds: number;
  rain: number;
  snow: number;
  day_phase: DayPhase;
  gardening_tip: string;
  location: string;
  description: string;
  live: boolean;
}

export interface HQWeatherState extends HQWeatherApiResponse {
  tempC: number;
  label: string;
  windIntensity: number;
  particleDensity: number;
  cloudOpacity: number;
  warmLight: number;
  coolTint: number;
  isRaining: boolean;
  isSnowing: boolean;
  isWindy: boolean;
}

function cToF(c: number) {
  return Math.round(c * (9 / 5) + 32);
}

function conditionLabel(condition: HQWeatherCondition): string {
  const labels: Record<HQWeatherCondition, string> = {
    clear: "Clear",
    clouds: "Cloudy",
    rain: "Rain",
    drizzle: "Drizzle",
    snow: "Snow",
    mist: "Misty",
    storm: "Storm",
  };
  return labels[condition];
}

export function inferWeatherCondition(description: string, main?: string, snow1h?: number, rain1h?: number): HQWeatherCondition {
  if (snow1h && snow1h > 0) return "snow";
  if (rain1h && rain1h > 0) return rain1h < 1 ? "drizzle" : "rain";
  const d = `${main ?? ""} ${description}`.toLowerCase();
  if (d.includes("thunder") || d.includes("storm")) return "storm";
  if (d.includes("snow") || d.includes("sleet")) return "snow";
  if (d.includes("drizzle")) return "drizzle";
  if (d.includes("rain")) return "rain";
  if (d.includes("mist") || d.includes("fog") || d.includes("haze")) return "mist";
  if (d.includes("cloud") || d.includes("overcast")) return "clouds";
  return "clear";
}

function deriveVisuals(condition: HQWeatherCondition, windSpeed: number, clouds: number, rain1h: number, snow1h: number) {
  const isRaining = rain1h > 0 || condition === "rain" || condition === "drizzle" || condition === "storm";
  const isSnowing = snow1h > 0 || condition === "snow";
  const isWindy = windSpeed >= 5;
  const windIntensity = Math.min(1, windSpeed / 12 + (condition === "storm" ? 0.35 : 0));
  const particleDensity = isSnowing
    ? Math.min(1, 0.5 + snow1h * 0.15)
    : isRaining
      ? Math.min(1, 0.4 + rain1h * 0.2 + (condition === "storm" ? 0.3 : 0))
      : 0;
  const cloudOpacity = Math.min(0.95, 0.2 + clouds / 100);
  const warmLight = condition === "clear" ? 0.85 : condition === "clouds" ? 0.35 : 0.1;
  const coolTint = condition === "clouds" || condition === "mist" ? 0.45 : isRaining || isSnowing ? 0.55 : 0.15;

  return { windIntensity, particleDensity, cloudOpacity, warmLight, coolTint, isRaining, isSnowing, isWindy };
}

export function weatherSnapshotToHQState(snap: WeatherSnapshot, date = new Date()): HQWeatherState {
  const condition = inferWeatherCondition(snap.description, snap.weatherMain, snap.snow1h, snap.rain1h);
  const dayPhase = getDayPhase(date.getHours());
  const tempF = cToF(snap.tempC);
  const visuals = deriveVisuals(condition, snap.windSpeed, snap.clouds, snap.rain1h, snap.snow1h);

  return {
    condition,
    temperature: tempF,
    temperature_unit: "F",
    humidity: snap.humidity,
    wind_speed: snap.windSpeed,
    clouds: snap.clouds,
    rain: snap.rain1h,
    snow: snap.snow1h,
    day_phase: dayPhase,
    gardening_tip: snap.gardeningTip,
    location: snap.city,
    description: snap.description,
    live: true,
    tempC: snap.tempC,
    label: `${snap.city} · ${tempF}°F · ${conditionLabel(condition)}`,
    ...visuals,
  };
}

export function defaultHQWeatherState(date = new Date()): HQWeatherState {
  const dayPhase = getDayPhase(date.getHours());
  return {
    condition: "clear",
    temperature: 72,
    temperature_unit: "F",
    humidity: 50,
    wind_speed: 2,
    clouds: 15,
    rain: 0,
    snow: 0,
    day_phase: dayPhase,
    gardening_tip: "Seasonal garden mode — connect OpenWeather for live local tips.",
    location: "Garden",
    description: "clear sky",
    live: false,
    tempC: 22,
    label: "Garden · seasonal skies",
    windIntensity: 0.15,
    particleDensity: 0,
    cloudOpacity: 0.3,
    warmLight: 0.5,
    coolTint: 0.2,
    isRaining: false,
    isSnowing: false,
    isWindy: false,
  };
}

export function mockHQWeatherState(
  mock: "clear" | "rain" | "wind" | "snow" | "clouds",
  date = new Date()
): HQWeatherState {
  const base = defaultHQWeatherState(date);
  const dayPhase = getDayPhase(date.getHours());

  const presets: Record<string, Partial<HQWeatherState>> = {
    clear: {
      condition: "clear",
      temperature: 78,
      tempC: 26,
      humidity: 35,
      wind_speed: 2,
      clouds: 5,
      rain: 0,
      snow: 0,
      description: "clear sky",
      gardening_tip: "OpenWeather reports warm dry conditions. Bloom should create watering content.",
      location: "Pasadena",
      label: "Pasadena · 78°F · Clear",
    },
    rain: {
      condition: "rain",
      temperature: 62,
      tempC: 17,
      humidity: 88,
      wind_speed: 4,
      clouds: 90,
      rain: 2.4,
      snow: 0,
      description: "moderate rain",
      gardening_tip: "Rainy stretch — Roots should engage plant parents with indoor care tips.",
      location: "Pasadena",
      label: "Pasadena · 62°F · Rain",
    },
    wind: {
      condition: "clouds",
      temperature: 68,
      tempC: 20,
      humidity: 55,
      wind_speed: 9,
      clouds: 60,
      rain: 0,
      snow: 0,
      description: "broken clouds",
      gardening_tip: "Windy afternoon — secure tall planters and draft staking guides.",
      location: "Pasadena",
      label: "Pasadena · 68°F · Cloudy",
    },
    snow: {
      condition: "snow",
      temperature: 34,
      tempC: 1,
      humidity: 70,
      wind_speed: 3,
      clouds: 95,
      rain: 0,
      snow: 1.2,
      description: "light snow",
      gardening_tip: "Snow cover — protect outdoor pots and pause repotting.",
      location: "Pasadena",
      label: "Pasadena · 34°F · Snow",
    },
    clouds: {
      condition: "clouds",
      temperature: 65,
      tempC: 18,
      humidity: 62,
      wind_speed: 3,
      clouds: 75,
      rain: 0,
      snow: 0,
      description: "overcast clouds",
      gardening_tip: "Overcast but mild — good day for educational content and community check-ins.",
      location: "Pasadena",
      label: "Pasadena · 65°F · Cloudy",
    },
  };

  const preset = presets[mock] ?? presets.clear;
  const merged = { ...base, ...preset, day_phase: dayPhase, live: true };
  const visuals = deriveVisuals(
    merged.condition!,
    merged.wind_speed!,
    merged.clouds!,
    merged.rain!,
    merged.snow!
  );
  return { ...merged, ...visuals } as HQWeatherState;
}

export function toWeatherApiResponse(state: HQWeatherState): HQWeatherApiResponse {
  return {
    condition: state.condition,
    temperature: state.temperature,
    temperature_unit: state.temperature_unit,
    humidity: state.humidity,
    wind_speed: state.wind_speed,
    clouds: state.clouds,
    rain: state.rain,
    snow: state.snow,
    day_phase: state.day_phase,
    gardening_tip: state.gardening_tip,
    location: state.location,
    description: state.description,
    live: state.live,
  };
}
