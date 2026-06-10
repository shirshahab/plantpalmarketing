"use client";

import type { WorldTimeState } from "@/lib/hq/world-time";

export function HQDayNightOverlay({ worldTime }: { worldTime: WorldTimeState }) {
  const [top, mid, bottom] = worldTime.skyGradient;

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-all duration-[3000ms]"
        style={{
          background: `linear-gradient(180deg, ${top} 0%, ${mid} 45%, ${bottom} 100%)`,
        }}
        aria-hidden
      />
      {worldTime.overlayOpacity > 0 && (
        <div
          className="pointer-events-none absolute inset-0 z-[4] transition-opacity duration-[3000ms]"
          style={{
            background: worldTime.ambientTint,
            opacity: worldTime.overlayOpacity,
          }}
          aria-hidden
        />
      )}
      {worldTime.phase === "night" && (
        <div className="pointer-events-none absolute inset-0 z-[4]" aria-hidden>
          {[
            { x: 15, y: 12 },
            { x: 72, y: 8 },
            { x: 88, y: 22 },
            { x: 42, y: 6 },
          ].map((s, i) => (
            <div
              key={i}
              className="absolute h-0.5 w-0.5 rounded-full bg-white"
              style={{ left: `${s.x}%`, top: `${s.y}%`, opacity: 0.6 + (i % 3) * 0.15 }}
            />
          ))}
          <div
            className="absolute rounded-full bg-yellow-100/80 blur-sm"
            style={{ right: "12%", top: "8%", width: 28, height: 28 }}
          />
        </div>
      )}
    </>
  );
}
