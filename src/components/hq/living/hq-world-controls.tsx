"use client";

import { ZoomIn, ZoomOut, Maximize2, Volume2, VolumeX, Sun, Moon, Cloud, CloudRain, Snowflake, Wind } from "lucide-react";
import type { WorldTimeState } from "@/lib/hq/world-time";
import type { HQWeatherState } from "@/lib/hq/hq-weather";
import { getSeasonAccent } from "@/lib/hq/world-time";

function pickWeatherIcon(weather: HQWeatherState) {
  if (weather.isSnowing || weather.condition === "snow") return Snowflake;
  if (weather.isRaining || weather.condition === "storm" || weather.condition === "drizzle") return CloudRain;
  if (weather.isWindy) return Wind;
  if (weather.condition === "clouds" || weather.condition === "mist") return Cloud;
  return Sun;
}

export function HQWorldControls({
  worldTime,
  weather,
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  soundEnabled,
  onToggleSound,
}: {
  worldTime: WorldTimeState;
  weather: HQWeatherState;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}) {
  const PhaseIcon = worldTime.phase === "night" ? Moon : worldTime.phase === "dusk" ? Cloud : Sun;
  const WIcon = pickWeatherIcon(weather);
  const seasonColor = getSeasonAccent(worldTime.season);
  const badge = weather.live ? weather.label : `${weather.location} · seasonal`;

  return (
    <div className="absolute bottom-3 left-2 right-2 z-30 flex flex-wrap items-center justify-between gap-2 sm:left-3 sm:right-auto">
      <div
        className="flex max-w-[70%] flex-col gap-0.5 rounded-2xl border border-white/50 bg-white/88 px-2.5 py-1.5 shadow-sm backdrop-blur-md sm:max-w-none sm:px-3"
        style={{ borderColor: `${seasonColor}44` }}
      >
        <div className="flex items-center gap-1.5 text-[9px] font-medium text-brand-primary sm:gap-2 sm:text-[10px]">
          <PhaseIcon className="h-3.5 w-3.5 shrink-0" style={{ color: seasonColor }} />
          <span className="capitalize">{worldTime.season}</span>
          <span className="text-brand-muted">·</span>
          <WIcon className="h-3 w-3 shrink-0 text-sky-600" />
          <span className="truncate font-semibold">{badge}</span>
        </div>
        {weather.live && (
          <p className="hidden truncate text-[8px] text-brand-muted sm:block">
            Wind {weather.wind_speed.toFixed(1)} m/s · Clouds {weather.clouds}%
          </p>
        )}
      </div>

      <div className="flex items-center gap-0.5 rounded-2xl border border-white/50 bg-white/88 p-0.5 shadow-sm backdrop-blur-md sm:gap-1 sm:p-1">
        <button type="button" onClick={onZoomOut} className="rounded-xl p-1.5 text-brand-muted transition hover:bg-brand-bg hover:text-brand-primary sm:p-2" aria-label="Zoom out">
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-[2.25rem] text-center text-[9px] font-semibold text-brand-primary sm:text-[10px]">
          {Math.round(zoom * 100)}%
        </span>
        <button type="button" onClick={onZoomIn} className="rounded-xl p-1.5 text-brand-muted transition hover:bg-brand-bg hover:text-brand-primary sm:p-2" aria-label="Zoom in">
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={onReset} className="rounded-xl p-1.5 text-brand-muted transition hover:bg-brand-bg hover:text-brand-primary sm:p-2" aria-label="Reset view">
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={onToggleSound} className="rounded-xl p-1.5 text-brand-muted transition hover:bg-brand-bg hover:text-brand-primary sm:p-2" aria-label={soundEnabled ? "Mute ambience" : "Play ambience"}>
          {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
