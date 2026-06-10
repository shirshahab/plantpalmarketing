"use client";

import { GARDEN_ZONES } from "@/lib/hq/hq-world-layout";

export function HQWorldScenery() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <radialGradient id="skyGlow" cx="50%" cy="0%" r="80%">
          <stop offset="0%" stopColor="#e8f5e9" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#dceee3" stopOpacity="0.3" />
        </radialGradient>
        <pattern id="grassTexture" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.3" fill="#2d6a4f" opacity="0.08" />
        </pattern>
      </defs>

      <rect width="100" height="100" fill="url(#skyGlow)" />
      <rect width="100" height="100" fill="url(#grassTexture)" />

      {/* Garden paths connecting zones */}
      <path
        d="M 50 20 Q 35 40 18 38 M 50 20 Q 65 40 82 38 M 50 48 Q 18 52 18 58 M 50 48 Q 82 52 82 58 M 50 48 L 50 76"
        fill="none"
        stroke="#2d6a4f"
        strokeWidth="0.6"
        strokeDasharray="1.5 1"
        opacity="0.25"
      />

      {GARDEN_ZONES.map((zone) => (
        <g key={zone.id}>
          <ellipse
            cx={zone.center.x}
            cy={zone.center.y}
            rx={zone.width / 2}
            ry={zone.height / 2}
            fill={zone.color}
            stroke={zone.accent}
            strokeWidth="0.4"
            opacity="0.85"
          />
          <ellipse
            cx={zone.center.x}
            cy={zone.center.y + zone.height / 4}
            rx={zone.width / 2.5}
            ry={zone.height / 6}
            fill={zone.accent}
            opacity="0.06"
          />
        </g>
      ))}

      {/* Decorative trees */}
      {[
        { x: 8, y: 20 }, { x: 92, y: 18 }, { x: 6, y: 75 }, { x: 94, y: 72 }, { x: 30, y: 90 }, { x: 70, y: 90 },
      ].map((t, i) => (
        <g key={i} transform={`translate(${t.x}, ${t.y})`}>
          <rect x="-0.3" y="0" width="0.6" height="2" fill="#92400e" opacity="0.5" />
          <circle cx="0" cy="-0.5" r="1.8" fill="#2d6a4f" opacity="0.35" />
        </g>
      ))}
    </svg>
  );
}
