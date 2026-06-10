"use client";

import { GARDEN_ZONES } from "@/lib/hq/hq-world-layout";

/** Tiny office desk with screen + lamp. */
function Desk({ x, y, accent = "#92684a" }: { x: number; y: number; accent?: string }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-2.2" y="0" width="4.4" height="0.5" rx="0.2" fill={accent} opacity="0.8" />
      <rect x="-1.9" y="0.5" width="0.4" height="1.2" fill={accent} opacity="0.6" />
      <rect x="1.5" y="0.5" width="0.4" height="1.2" fill={accent} opacity="0.6" />
      {/* screen */}
      <rect x="-1.4" y="-1.4" width="1.6" height="1.2" rx="0.15" fill="#e8f4fd" stroke="#5b7c99" strokeWidth="0.12" />
      <rect x="-0.7" y="-0.2" width="0.2" height="0.25" fill="#5b7c99" />
      {/* warm desk lamp */}
      <path d="M1.3 -0.1 L1.7 -1.2" stroke="#6b7280" strokeWidth="0.15" />
      <circle cx="1.8" cy="-1.3" r="0.32" fill="#fbbf24" className="hq-anim-blink" opacity="0.9" />
      {/* coffee cup */}
      <rect x="0.5" y="-0.45" width="0.4" height="0.45" rx="0.1" fill="#fffdf6" stroke="#92684a" strokeWidth="0.1" />
      <path d="M0.62 -0.75 Q0.7 -1 0.78 -0.75" stroke="#9ca3af" strokeWidth="0.1" fill="none" opacity="0.8" />
    </g>
  );
}

/** Whiteboard on legs with a tiny chart. */
function Whiteboard({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-1.8" y="-2.6" width="3.6" height="2.3" rx="0.2" fill="#fffdf6" stroke="#8da18f" strokeWidth="0.15" />
      <path d="M-1.5 -2.4 L-1.6 0 M1.5 -2.4 L1.6 0" stroke="#8da18f" strokeWidth="0.15" />
      <path d="M-1.3 -1 L-0.6 -1.7 L0 -1.2 L0.9 -2" fill="none" stroke="#2d6a4f" strokeWidth="0.16" strokeLinecap="round" />
      <path d="M-1.3 -0.7 L1.2 -0.7" stroke="#d97706" strokeWidth="0.12" opacity="0.7" />
    </g>
  );
}

/** Stack of books. */
function Books({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-0.8" y="-0.3" width="1.6" height="0.35" rx="0.1" fill="#b54834" />
      <rect x="-0.7" y="-0.65" width="1.4" height="0.35" rx="0.1" fill="#2d6a4f" />
      <rect x="-0.6" y="-1" width="1.2" height="0.35" rx="0.1" fill="#d9a514" />
    </g>
  );
}

/** Potted plant. */
function PottedPlant({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <path d="M-0.5 0 L0.5 0 L0.35 0.8 L-0.35 0.8 Z" fill="#c97b3d" opacity="0.9" />
      <g className="hq-anim-sway" style={{ transformOrigin: "0px 0px" }}>
        <path d="M0 0 Q-0.8 -0.9 -0.4 -1.6 Q0 -0.9 0 0" fill="#4d8a5b" />
        <path d="M0 0 Q0.8 -0.9 0.4 -1.6 Q0 -0.9 0 0" fill="#74c365" />
        <path d="M0 0 Q0 -1.3 0 -1.9" stroke="#356645" strokeWidth="0.14" fill="none" />
      </g>
    </g>
  );
}

/** Butterfly that flutters along a small loop. */
function Butterfly({ x, y, color, delay }: { x: number; y: number; color: string; delay: string }) {
  return (
    <g transform={`translate(${x}, ${y})`} className="hq-anim-papers" style={{ animationDelay: delay }}>
      <ellipse cx="-0.35" cy="0" rx="0.4" ry="0.28" fill={color} opacity="0.85" />
      <ellipse cx="0.35" cy="0" rx="0.4" ry="0.28" fill={color} opacity="0.7" />
      <rect x="-0.07" y="-0.25" width="0.14" height="0.5" rx="0.07" fill="#4a2f17" />
    </g>
  );
}

/**
 * Phase 28 — cozy campus scenery: warm lighting, layered light pools,
 * office props (desks, lamps, whiteboards, books, coffee), garden details.
 * Pure SVG + a few cheap CSS loops so mobile stays smooth.
 */
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
          <stop offset="0%" stopColor="#fdf6e3" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#e8f5e9" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#dceee3" stopOpacity="0.3" />
        </radialGradient>
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="warmPool" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff7d6" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#fff7d6" stopOpacity="0" />
        </radialGradient>
        <pattern id="grassTexture" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.3" fill="#2d6a4f" opacity="0.08" />
          <circle cx="3" cy="3" r="0.22" fill="#74c365" opacity="0.07" />
        </pattern>
      </defs>

      <rect width="100" height="100" fill="url(#skyGlow)" />
      <rect width="100" height="100" fill="url(#grassTexture)" />

      {/* morning sun, top-right */}
      <circle cx="86" cy="8" r="14" fill="url(#sunGlow)" />

      {/* Garden paths connecting zones — warm sand tone */}
      <path
        d="M 50 20 Q 35 40 18 38 M 50 20 Q 65 40 82 38 M 50 48 Q 18 52 18 58 M 50 48 Q 82 52 82 58 M 50 48 L 50 76"
        fill="none"
        stroke="#c9a86c"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.3"
      />
      <path
        d="M 50 20 Q 35 40 18 38 M 50 20 Q 65 40 82 38 M 50 48 Q 18 52 18 58 M 50 48 Q 82 52 82 58 M 50 48 L 50 76"
        fill="none"
        stroke="#2d6a4f"
        strokeWidth="0.5"
        strokeDasharray="1.5 1"
        opacity="0.25"
      />

      {GARDEN_ZONES.map((zone) => (
        <g key={zone.id}>
          {/* warm light pool under each zone — cozy lamp-lit feel */}
          <ellipse
            cx={zone.center.x}
            cy={zone.center.y}
            rx={zone.width / 1.6}
            ry={zone.height / 1.6}
            fill="url(#warmPool)"
          />
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
          {/* soft contact shadow */}
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

      {/* string lights swooping across the campus */}
      <path d="M 4 14 Q 26 22 50 15 Q 74 8 96 16" fill="none" stroke="#92684a" strokeWidth="0.18" opacity="0.5" />
      {[8, 16, 25, 34, 43, 52, 61, 70, 79, 88].map((x, i) => {
        const t = (x - 4) / 92;
        const y = 14 + Math.sin(t * Math.PI) * (x < 50 ? 5 : -4) + (x < 50 ? 2 : 1);
        return (
          <circle
            key={x}
            cx={x}
            cy={y}
            r="0.45"
            fill={i % 2 === 0 ? "#fbbf24" : "#fda4af"}
            className="hq-anim-blink"
            style={{ animationDelay: `${i * 0.3}s` }}
            opacity="0.9"
          />
        );
      })}

      {/* outdoor office props */}
      <Desk x={28} y={26} />
      <Desk x={72} y={27} accent="#7a5c3f" />
      <Desk x={36} y={62} />
      <Whiteboard x={60} y={64} />
      <Books x={44} y={31} />
      <Books x={24} y={56} />
      <PottedPlant x={12} y={30} />
      <PottedPlant x={88} y={30} scale={0.85} />
      <PottedPlant x={46} y={84} scale={1.1} />
      <PottedPlant x={66} y={45} scale={0.7} />

      {/* picnic bench near the pond */}
      <g transform="translate(50, 88)">
        <rect x="-3" y="-0.6" width="6" height="0.55" rx="0.25" fill="#a8795155" stroke="#92684a" strokeWidth="0.12" />
        <rect x="-2.4" y="-0.05" width="0.45" height="1.4" fill="#92684a" opacity="0.7" />
        <rect x="1.95" y="-0.05" width="0.45" height="1.4" fill="#92684a" opacity="0.7" />
        <rect x="-2 " y="-1.6" width="0.35" height="1" fill="#92684a" opacity="0.5" />
        <rect x="1.65" y="-1.6" width="0.35" height="1" fill="#92684a" opacity="0.5" />
        <rect x="-2.4" y="-1.75" width="4.8" height="0.35" rx="0.15" fill="#a87951" opacity="0.7" />
      </g>

      {/* flower patches */}
      {[
        { x: 14, y: 47, c: "#f472b6" },
        { x: 86, y: 49, c: "#fbbf24" },
        { x: 40, y: 90, c: "#a78bfa" },
        { x: 62, y: 18, c: "#fb7185" },
        { x: 9, y: 62, c: "#fbbf24" },
        { x: 92, y: 64, c: "#f472b6" },
      ].map((f, i) => (
        <g key={i} transform={`translate(${f.x}, ${f.y})`}>
          <circle cx="0" cy="0" r="0.45" fill={f.c} opacity="0.85" />
          <circle cx="0.9" cy="0.4" r="0.35" fill={f.c} opacity="0.6" />
          <circle cx="-0.8" cy="0.5" r="0.3" fill={f.c} opacity="0.5" />
          <circle cx="0" cy="0" r="0.15" fill="#fffdf6" />
        </g>
      ))}

      {/* butterflies drifting */}
      <Butterfly x={22} y={20} color="#f9a8d4" delay="0s" />
      <Butterfly x={78} y={54} color="#93c5fd" delay="1.2s" />
      <Butterfly x={55} y={80} color="#fbbf24" delay="0.6s" />

      {/* Decorative trees — layered canopies for depth */}
      {[
        { x: 8, y: 20 }, { x: 92, y: 18 }, { x: 6, y: 75 }, { x: 94, y: 72 }, { x: 30, y: 90 }, { x: 70, y: 90 },
      ].map((t, i) => (
        <g key={i} transform={`translate(${t.x}, ${t.y})`}>
          <ellipse cx="0.3" cy="2.1" rx="1.8" ry="0.4" fill="#2d6a4f" opacity="0.12" />
          <rect x="-0.3" y="0" width="0.6" height="2" fill="#92400e" opacity="0.6" />
          <circle cx="0" cy="-0.5" r="1.9" fill="#2d6a4f" opacity="0.35" />
          <circle cx="-0.7" cy="-1" r="1.2" fill="#3c8765" opacity="0.4" />
          <circle cx="0.8" cy="-0.9" r="1" fill="#74c365" opacity="0.3" />
        </g>
      ))}

      {/* warm vignette for the cozy Pixar-office glow */}
      <rect width="100" height="100" fill="url(#warmPool)" opacity="0.25" />
    </svg>
  );
}
