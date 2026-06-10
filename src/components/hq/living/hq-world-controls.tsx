"use client";

import { ZoomIn, ZoomOut, Maximize2, Volume2, VolumeX, Sun, Moon, Cloud } from "lucide-react";
import type { WorldTimeState } from "@/lib/hq/world-time";
import { getSeasonAccent } from "@/lib/hq/world-time";

export function HQWorldControls({
  worldTime,
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  soundEnabled,
  onToggleSound,
}: {
  worldTime: WorldTimeState;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}) {
  const PhaseIcon = worldTime.phase === "night" ? Moon : worldTime.phase === "dusk" ? Cloud : Sun;
  const seasonColor = getSeasonAccent(worldTime.season);

  return (
    <div className="absolute bottom-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2">
      <div
        className="flex items-center gap-2 rounded-2xl border border-white/50 bg-white/85 px-3 py-1.5 text-[10px] font-medium text-brand-primary shadow-sm backdrop-blur-md"
        style={{ borderColor: `${seasonColor}44` }}
      >
        <PhaseIcon className="h-3.5 w-3.5" style={{ color: seasonColor }} />
        <span className="capitalize">{worldTime.season}</span>
        <span className="text-brand-muted">·</span>
        <span>{worldTime.label.split("·")[0]?.trim()}</span>
      </div>

      <div className="flex items-center gap-1 rounded-2xl border border-white/50 bg-white/85 p-1 shadow-sm backdrop-blur-md">
        <button
          type="button"
          onClick={onZoomOut}
          className="rounded-xl p-2 text-brand-muted transition hover:bg-brand-bg hover:text-brand-primary"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-[2.5rem] text-center text-[10px] font-semibold text-brand-primary">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={onZoomIn}
          className="rounded-xl p-2 text-brand-muted transition hover:bg-brand-bg hover:text-brand-primary"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-xl p-2 text-brand-muted transition hover:bg-brand-bg hover:text-brand-primary"
          aria-label="Reset view"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onToggleSound}
          className="rounded-xl p-2 text-brand-muted transition hover:bg-brand-bg hover:text-brand-primary"
          aria-label={soundEnabled ? "Mute ambience" : "Play ambience"}
        >
          {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
