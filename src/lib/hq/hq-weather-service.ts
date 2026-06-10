import { getHQWeatherLocation } from "@/lib/hq/hq-weather-config";
import {
  defaultHQWeatherState,
  mockHQWeatherState,
  toWeatherApiResponse,
  weatherSnapshotToHQState,
  type HQWeatherApiResponse,
  type HQWeatherState,
} from "@/lib/hq/hq-weather";
import { isOpenWeatherConfigured } from "@/lib/integrations/config";
import { fetchCurrentWeather } from "@/lib/integrations/providers/openweather-provider";

export type WeatherMockMode = "clear" | "rain" | "wind" | "snow" | "clouds" | "error";

export async function fetchHQWeather(mock?: WeatherMockMode | null): Promise<HQWeatherState> {
  if (mock === "error") {
    throw new Error("Mock weather error");
  }

  if (mock) {
    return mockHQWeatherState(mock);
  }

  if (!isOpenWeatherConfigured()) {
    return defaultHQWeatherState();
  }

  try {
    const location = getHQWeatherLocation();
    const snap = await fetchCurrentWeather(location, "hq_weather");
    return weatherSnapshotToHQState(snap);
  } catch (e) {
    console.error("[HQ] OpenWeather fetch failed:", e);
    return defaultHQWeatherState();
  }
}

export async function getHQWeatherApiPayload(mock?: WeatherMockMode | null): Promise<{
  ok: boolean;
  weather: HQWeatherApiResponse;
  error?: string;
}> {
  try {
    const state = await fetchHQWeather(mock);
    return { ok: state.live, weather: toWeatherApiResponse(state) };
  } catch (e) {
    const fallback = defaultHQWeatherState();
    return {
      ok: false,
      weather: toWeatherApiResponse(fallback),
      error: e instanceof Error ? e.message : "Weather unavailable",
    };
  }
}
