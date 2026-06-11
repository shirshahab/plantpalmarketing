"use client";

import { GARDEN_ZONES, WORLD_PATHS } from "@/lib/hq/hq-world-layout";

/** Top-down garden ground — Animal Crossing / Tiny Glade inspired */
export function HQTerrainLayer() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <radialGradient id="hq-ground-glow" cx="50%" cy="42%" r="65%">
          <stop offset="0%" stopColor="#e8f5ec" stopOpacity="1" />
          <stop offset="55%" stopColor="#d4ead9" stopOpacity="1" />
          <stop offset="100%" stopColor="#b8d4c4" stopOpacity="1" />
        </radialGradient>
        <pattern id="hq-grass-dots" width="3" height="3" patternUnits="userSpaceOnUse">
          <circle cx="0.8" cy="0.8" r="0.25" fill="#2d6a4f" opacity="0.07" />
          <circle cx="2.2" cy="2" r="0.2" fill="#74c365" opacity="0.06" />
        </pattern>
        <linearGradient id="hq-path-fill" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e8dcc8" />
          <stop offset="100%" stopColor="#d4c4a8" />
        </linearGradient>
      </defs>

      <rect width="100" height="100" fill="url(#hq-ground-glow)" />
      <rect width="100" height="100" fill="url(#hq-grass-dots)" />

      {/* Soft zone meadows */}
      {GARDEN_ZONES.map((zone) => (
        <ellipse
          key={zone.id}
          cx={zone.center.x}
          cy={zone.center.y}
          rx={zone.width / 2 + 1.5}
          ry={zone.height / 2 + 1}
          fill={zone.color}
          opacity="0.55"
        />
      ))}

      {/* Dirt paths between departments */}
      {WORLD_PATHS.map((path, i) => {
        const from = GARDEN_ZONES.find((z) => z.id === path.from);
        const to = GARDEN_ZONES.find((z) => z.id === path.to);
        if (!from || !to) return null;
        const mx = (from.center.x + to.center.x) / 2;
        const my = (from.center.y + to.center.y) / 2 - 2;
        return (
          <path
            key={`${path.from}-${path.to}-${i}`}
            d={`M ${from.center.x} ${from.center.y} Q ${mx} ${my} ${to.center.x} ${to.center.y}`}
            fill="none"
            stroke="url(#hq-path-fill)"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0.65"
          />
        );
      })}

      {/* Central plaza */}
      <ellipse cx="50" cy="46" rx="8" ry="5" fill="#dceee3" opacity="0.7" />
      <ellipse cx="50" cy="46" rx="5" ry="3" fill="#c8e6c9" opacity="0.5" />

      {/* Decorative shrubs */}
      {[
        { x: 32, y: 22 },
        { x: 68, y: 22 },
        { x: 10, y: 48 },
        { x: 90, y: 48 },
        { x: 28, y: 74 },
        { x: 72, y: 74 },
      ].map((s, i) => (
        <g key={i} transform={`translate(${s.x}, ${s.y})`}>
          <circle cx="0" cy="0" r="1.4" fill="#2d6a4f" opacity="0.22" />
          <circle cx="-0.6" cy="0.3" r="0.9" fill="#74c365" opacity="0.18" />
          <circle cx="0.6" cy="0.2" r="0.85" fill="#95b89b" opacity="0.18" />
        </g>
      ))}

      {/* Creative studio — asset wall with hanging frames (near Fern/Atlas side) */}
      <g transform="translate(86, 64)" opacity="0.85">
        <rect x="-5" y="-3" width="10" height="6" rx="0.6" fill="#fdf8ee" stroke="#c9b48a" strokeWidth="0.25" />
        <line x1="-4.2" y1="-3" x2="-4.2" y2="-2.2" stroke="#c9b48a" strokeWidth="0.18" />
        <line x1="0" y1="-3" x2="0" y2="-2.2" stroke="#c9b48a" strokeWidth="0.18" />
        <line x1="4.2" y1="-3" x2="4.2" y2="-2.2" stroke="#c9b48a" strokeWidth="0.18" />
        <rect x="-4.7" y="-2.2" width="2.4" height="1.8" rx="0.2" fill="#f3c9dd" stroke="#b88aa4" strokeWidth="0.15" />
        <rect x="-1.2" y="-2.2" width="2.4" height="1.8" rx="0.2" fill="#cfe6f7" stroke="#8ab0c9" strokeWidth="0.15" />
        <rect x="2.3" y="-2.2" width="2.4" height="1.8" rx="0.2" fill="#d8f0d2" stroke="#8fbf85" strokeWidth="0.15" />
        <rect x="-3.2" y="0.4" width="2.4" height="1.8" rx="0.2" fill="#f7ecc9" stroke="#c9b88a" strokeWidth="0.15" />
        <rect x="0.6" y="0.4" width="2.4" height="1.8" rx="0.2" fill="#e3d4f5" stroke="#a98ac9" strokeWidth="0.15" />
      </g>

      {/* Video review room — screen with play button */}
      <g transform="translate(13, 70)" opacity="0.85">
        <rect x="-4" y="-2.6" width="8" height="5" rx="0.6" fill="#1f2937" stroke="#0f172a" strokeWidth="0.25" />
        <rect x="-3.5" y="-2.1" width="7" height="4" rx="0.4" fill="#334155" />
        <path d="M -0.8 -1.2 L 1.4 0 L -0.8 1.2 Z" fill="#93c5fd" />
        <rect x="-1.6" y="2.4" width="3.2" height="0.6" rx="0.3" fill="#475569" />
      </g>

      {/* Calendar board — by the central plaza */}
      <g transform="translate(50, 38)" opacity="0.8">
        <rect x="-3.4" y="-2.4" width="6.8" height="4.8" rx="0.5" fill="#fffdf7" stroke="#c9b48a" strokeWidth="0.25" />
        <rect x="-3.4" y="-2.4" width="6.8" height="1.1" rx="0.5" fill="#74c365" opacity="0.7" />
        {[-2.4, -0.8, 0.8, 2.4].map((cx) =>
          [-0.6, 0.6, 1.7].map((cy) => (
            <rect key={`${cx}-${cy}`} x={cx - 0.55} y={cy - 0.4} width="1.1" height="0.8" rx="0.15" fill="#e8f0e4" stroke="#b8d4c4" strokeWidth="0.08" />
          ))
        )}
        <rect x="-0.25" y="-0.95" width="1.1" height="0.8" rx="0.15" fill="#f3c9dd" />
      </g>

      {/* Phase 31 HQ 2.0 — radar room (Sentinel) with sweeping scan */}
      <g transform="translate(87, 28)" opacity="0.85">
        <circle cx="0" cy="0" r="3" fill="#0f172a" stroke="#1e293b" strokeWidth="0.25" />
        <circle cx="0" cy="0" r="2.2" fill="none" stroke="#22c55e" strokeWidth="0.12" opacity="0.5" />
        <circle cx="0" cy="0" r="1.3" fill="none" stroke="#22c55e" strokeWidth="0.1" opacity="0.4" />
        <line x1="0" y1="0" x2="0" y2="-2.6" stroke="#4ade80" strokeWidth="0.22" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="6s" repeatCount="indefinite" />
        </line>
        <circle cx="1.2" cy="-0.8" r="0.22" fill="#4ade80">
          <animate attributeName="opacity" values="0;1;0" dur="6s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Conference room — table with chairs near the plaza */}
      <g transform="translate(38, 30)" opacity="0.8">
        <ellipse cx="0" cy="0" rx="3" ry="1.6" fill="#c9a877" stroke="#a8854f" strokeWidth="0.2" />
        <ellipse cx="0" cy="-0.2" rx="2.2" ry="1" fill="#dbc191" opacity="0.7" />
        {[
          { x: -3.6, y: 0 },
          { x: 3.6, y: 0 },
          { x: -1.8, y: -1.9 },
          { x: 1.8, y: -1.9 },
          { x: -1.8, y: 1.9 },
          { x: 1.8, y: 1.9 },
        ].map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="0.55" fill="#8a6d44" opacity="0.7" />
        ))}
      </g>

      {/* Content cards traveling Bloom → plaza → Gate (the pipeline, visibly moving) */}
      <g opacity="0.9">
        <rect x="-1" y="-0.7" width="2" height="1.4" rx="0.25" fill="#fffdf7" stroke="#74c365" strokeWidth="0.18">
          <animateMotion dur="9s" repeatCount="indefinite" path="M 28 50 Q 39 44 50 46 Q 61 48 70 46" />
        </rect>
        <rect x="-1" y="-0.7" width="2" height="1.4" rx="0.25" fill="#fdf3f8" stroke="#d48ab0" strokeWidth="0.18">
          <animateMotion dur="9s" begin="4.5s" repeatCount="indefinite" path="M 28 50 Q 39 44 50 46 Q 61 48 70 46" />
        </rect>
      </g>

      {/* Approval envelope traveling Gate → Sprout (publishing run) */}
      <g opacity="0.9">
        <g>
          <rect x="-1.1" y="-0.75" width="2.2" height="1.5" rx="0.2" fill="#fff8e8" stroke="#d4a847" strokeWidth="0.18" />
          <path d="M -1.1 -0.75 L 0 0.2 L 1.1 -0.75" fill="none" stroke="#d4a847" strokeWidth="0.15" />
          <animateMotion dur="11s" repeatCount="indefinite" path="M 70 46 Q 76 56 70 66 Q 60 74 48 72" />
        </g>
      </g>

      {/* Growing plants — sprouts that breathe near the plaza */}
      {[
        { x: 44, y: 52, dur: "5s" },
        { x: 56, y: 52, dur: "6.5s" },
        { x: 50, y: 54, dur: "5.8s" },
      ].map((p, i) => (
        <g key={i} transform={`translate(${p.x}, ${p.y})`} opacity="0.8">
          <line x1="0" y1="0" x2="0" y2="-1.2" stroke="#2d6a4f" strokeWidth="0.18" />
          <ellipse cx="-0.5" cy="-1" rx="0.5" ry="0.3" fill="#74c365" transform="rotate(-30 -0.5 -1)">
            <animate attributeName="ry" values="0.3;0.42;0.3" dur={p.dur} repeatCount="indefinite" />
          </ellipse>
          <ellipse cx="0.5" cy="-1.2" rx="0.5" ry="0.3" fill="#95d68a" transform="rotate(30 0.5 -1.2)">
            <animate attributeName="ry" values="0.3;0.45;0.3" dur={p.dur} repeatCount="indefinite" />
          </ellipse>
        </g>
      ))}

      {/* Video room screen flicker — the review session is live */}
      <g transform="translate(13, 70)">
        <rect x="-3.5" y="-2.1" width="7" height="4" rx="0.4" fill="#93c5fd" opacity="0.08">
          <animate attributeName="opacity" values="0.04;0.14;0.04" dur="3.5s" repeatCount="indefinite" />
        </rect>
      </g>
    </svg>
  );
}
