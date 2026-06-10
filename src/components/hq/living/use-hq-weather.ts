"use client";

import { useCallback, useEffect, useState } from "react";
import type { HQWeatherApiResponse } from "@/lib/hq/hq-weather";
import { defaultHQWeatherState, type HQWeatherState } from "@/lib/hq/hq-weather";

function apiToState(data: HQWeatherApiResponse & { ok?: boolean }): HQWeatherState {
  const base = defaultHQWeatherState();
  const condition = data.condition;
  const isRaining = data.rain > 0 || condition === "rain" || condition === "drizzle" || condition === "storm";
  const isSnowing = data.snow > 0 || condition === "snow";
  const windIntensity = Math.min(1, data.wind_speed / 12);
  const particleDensity = isSnowing
    ? Math.min(1, 0.5 + data.snow * 0.15)
    : isRaining
      ? Math.min(1, 0.4 + data.rain * 0.2)
      : 0;
  const cloudOpacity = Math.min(0.95, 0.2 + data.clouds / 100);
  const warmLight = condition === "clear" ? 0.85 : condition === "clouds" ? 0.35 : 0.1;
  const coolTint = condition === "clouds" || condition === "mist" ? 0.45 : isRaining || isSnowing ? 0.55 : 0.15;

  const tempF = data.temperature;
  const label = data.live
    ? `${data.location} · ${tempF}°F · ${condition.charAt(0).toUpperCase() + condition.slice(1)}`
    : base.label;

  return {
    ...data,
    tempC: Math.round((tempF - 32) * (5 / 9)),
    label,
    windIntensity,
    particleDensity,
    cloudOpacity,
    warmLight,
    coolTint,
    isRaining,
    isSnowing,
    isWindy: data.wind_speed >= 5,
  };
}

const REFRESH_MS = 15 * 60 * 1000;

export function useHQWeather(initial: HQWeatherState) {
  const [weather, setWeather] = useState<HQWeatherState>(initial);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/hq/weather", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as HQWeatherApiResponse & { ok?: boolean };
      setWeather(apiToState(data));
    } catch {
      // keep last good state
    }
  }, []);

  useEffect(() => {
    setWeather(initial);
  }, [initial]);

  useEffect(() => {
    const id = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return { weather, refresh };
}
