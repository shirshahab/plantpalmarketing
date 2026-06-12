"use client";

import {
  VILLAGE_DISTRICTS,
  VILLAGE_SIZE,
  type VillagePoint,
} from "@/lib/hq/hq-village-layout";

/** Grass, paths, trees, district zones — pixel-inspired terrain layer. */
export function HQVillageTerrain() {
  return (
    <div
      className="absolute left-0 top-0"
      style={{ width: VILLAGE_SIZE.width, height: VILLAGE_SIZE.height }}
    >
      {/* Base grass */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(180deg, #b8e6c1 0%, #a3d9a5 40%, #8ecf94 100%)
          `,
        }}
      />

      {/* District zones — soft tinted areas, no hard boxes */}
      {VILLAGE_DISTRICTS.map((d) => (
        <div
          key={d.id}
          className="absolute rounded-[2rem] border-2 border-dashed opacity-70"
          style={{
            left: d.labelAt.x - d.width / 2,
            top: d.labelAt.y - d.height / 2 + 40,
            width: d.width,
            height: d.height,
            backgroundColor: `${d.fill}99`,
            borderColor: `${d.stroke}44`,
          }}
        >
          <p
            className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-0.5 text-[11px] font-bold shadow-sm"
            style={{ backgroundColor: d.fill, color: d.stroke }}
          >
            {d.name}
          </p>
          <p
            className="absolute -top-6 left-1/2 mt-4 -translate-x-1/2 whitespace-nowrap text-[9px] font-medium opacity-80"
            style={{ color: d.stroke, top: "-0.25rem", marginTop: "1.1rem" }}
          >
            {d.theme}
          </p>
        </div>
      ))}

      {/* Stone paths — SVG, no dashed workflow lines */}
      <svg
        className="pointer-events-none absolute inset-0"
        width={VILLAGE_SIZE.width}
        height={VILLAGE_SIZE.height}
        aria-hidden
      >
        <defs>
          <pattern id="path-stone" width="12" height="12" patternUnits="userSpaceOnUse">
            <rect width="12" height="12" fill="#e8dcc8" />
            <circle cx="3" cy="3" r="2" fill="#d4c4a8" />
            <circle cx="9" cy="8" r="1.5" fill="#c9b896" />
          </pattern>
        </defs>
        <path
          d="M 800 260 L 800 340 L 320 520 L 140 480"
          fill="none"
          stroke="url(#path-stone)"
          strokeWidth="28"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path
          d="M 800 260 L 800 500 L 620 500"
          fill="none"
          stroke="url(#path-stone)"
          strokeWidth="24"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path
          d="M 800 260 L 1180 520 L 1380 460"
          fill="none"
          stroke="url(#path-stone)"
          strokeWidth="24"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path
          d="M 800 600 L 480 880 L 800 920 L 1120 860"
          fill="none"
          stroke="url(#path-stone)"
          strokeWidth="28"
          strokeLinecap="round"
          opacity="0.85"
        />
      </svg>

      {/* Decorative trees & flowers */}
      {TREE_SPOTS.map((t, i) => (
        <div
          key={i}
          className="pointer-events-none absolute text-2xl opacity-80"
          style={{ left: t.x, top: t.y }}
        >
          {t.emoji}
        </div>
      ))}
    </div>
  );
}

const TREE_SPOTS: (VillagePoint & { emoji: string })[] = [
  { x: 60, y: 200, emoji: "🌳" },
  { x: 1500, y: 180, emoji: "🌲" },
  { x: 100, y: 700, emoji: "🌳" },
  { x: 1450, y: 750, emoji: "🌲" },
  { x: 550, y: 650, emoji: "🌸" },
  { x: 1050, y: 350, emoji: "🌼" },
  { x: 250, y: 300, emoji: "🌻" },
  { x: 1300, y: 600, emoji: "🌸" },
];
