"use client";

import { cn } from "@/lib/utils";
import { AgentCharacter } from "@/components/hq/agent-character";
import type { ActivityItem, AgentId, HQAgent } from "@/lib/hq/types";

/**
 * Phase 34 — HQ Command Center "operations map".
 * Fixed stations laid out like a strategy-game map: small character,
 * small name, tiny status pill. Stations never move and never overlap.
 */

interface Station {
  x: number; // % of map width (station center)
  y: number; // % of map height (station top)
}

/** 4 rows × 3 columns, staggered so the map feels organic but never collides. */
const STATIONS: Record<AgentId, Station> = {
  // Row 1 — Discovery
  creator: { x: 18, y: 6 },
  community: { x: 50, y: 8 },
  competitor: { x: 82, y: 6 },
  // Row 2 — Creation
  content: { x: 12, y: 30 },
  acquisition: { x: 44, y: 32 },
  creative_director: { x: 76, y: 30 },
  // Row 3 — Growth
  growth: { x: 24, y: 54 },
  partnerships: { x: 56, y: 56 },
  customer_voice: { x: 88, y: 54 },
  // Row 4 — Operations
  approval: { x: 18, y: 78 },
  chief_of_staff: { x: 50, y: 80 },
  publishing: { x: 82, y: 78 },
};

const ROW_LABELS: { y: number; label: string }[] = [
  { y: 2, label: "Discovery" },
  { y: 26, label: "Creation" },
  { y: 50, label: "Growth" },
  { y: 74, label: "Operations" },
];

/** Tiny status pills — max 120px, game-HUD style. */
const STATUS_PILLS: Record<string, { label: string; tone: string }> = {
  researching: { label: "Scanning", tone: "bg-sky-100 text-sky-700 border-sky-200" },
  writing: { label: "Generating", tone: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  reviewing: { label: "Reviewing", tone: "bg-violet-100 text-violet-700 border-violet-200" },
  waiting_for_approval: { label: "Review needed", tone: "bg-amber-100 text-amber-800 border-amber-200" },
  approved: { label: "Completed", tone: "bg-lime-100 text-lime-700 border-lime-200" },
  needs_attention: { label: "Attention", tone: "bg-rose-100 text-rose-700 border-rose-200" },
  paused: { label: "Idle", tone: "bg-gray-100 text-gray-500 border-gray-200" },
};

/** Per-agent flavor when the generic status is "researching"/"writing". */
const FLAVOR_PILLS: Partial<Record<AgentId, Partial<Record<string, string>>>> = {
  creator: { researching: "Scouting creators" },
  community: { researching: "Scanning Reddit" },
  competitor: { researching: "Monitoring" },
  content: { writing: "Generating content" },
  acquisition: { writing: "Designing assets" },
  creative_director: { reviewing: "Reviewing drafts" },
  publishing: { approved: "Published", writing: "Scheduling" },
  approval: { waiting_for_approval: "Waiting approval" },
};

function pillFor(agent: HQAgent): { label: string; tone: string } {
  const base = STATUS_PILLS[agent.status] ?? { label: "Working", tone: "bg-gray-100 text-gray-600 border-gray-200" };
  const flavor = FLAVOR_PILLS[agent.id]?.[agent.status];
  return flavor ? { ...base, label: flavor } : base;
}

export function HQStationMap({
  agents,
  activity,
  selectedId,
  onSelectAgent,
}: {
  agents: HQAgent[];
  activity: ActivityItem[];
  selectedId: AgentId | null;
  onSelectAgent: (id: AgentId) => void;
}) {
  const safeAgents = Array.isArray(agents) ? agents.filter((a) => a && a.id && STATIONS[a.id]) : [];
  const pendingByAgent = new Map<AgentId, number>();
  for (const item of activity) {
    if (item.agentId && item.status === "pending") {
      pendingByAgent.set(item.agentId, (pendingByAgent.get(item.agentId) ?? 0) + 1);
    }
  }

  return (
    <div className="relative h-[560px] w-full overflow-hidden rounded-3xl border border-brand-border/60 bg-gradient-to-b from-[#eef6ea] via-[#f3f8ef] to-[#e9f2e3] shadow-sm sm:h-[600px]">
      {/* Subtle map grid */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.16]" aria-hidden>
        <defs>
          <pattern id="hq-map-grid" width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M44 0H0V44" fill="none" stroke="#6b9b7a" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hq-map-grid)" />
      </svg>

      {/* Connecting paths between rows (operations-map feel) */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <path d="M18 14 C 24 22, 10 24, 12 36" className="hq-map-path" />
        <path d="M50 16 C 50 22, 44 24, 44 38" className="hq-map-path" />
        <path d="M82 14 C 78 22, 78 24, 76 36" className="hq-map-path" />
        <path d="M12 42 C 14 50, 22 48, 24 60" className="hq-map-path" />
        <path d="M44 44 C 48 50, 54 50, 56 62" className="hq-map-path" />
        <path d="M76 42 C 82 50, 86 48, 88 60" className="hq-map-path" />
        <path d="M24 66 C 22 72, 18 72, 18 84" className="hq-map-path" />
        <path d="M56 68 C 54 72, 50 74, 50 86" className="hq-map-path" />
        <path d="M88 66 C 86 72, 82 72, 82 84" className="hq-map-path" />
        <style>{`.hq-map-path { fill: none; stroke: #6b9b7a; stroke-opacity: 0.28; stroke-width: 0.5; stroke-dasharray: 1.6 2; vector-effect: non-scaling-stroke; }`}</style>
      </svg>

      {/* Row zone labels */}
      {ROW_LABELS.map((row) => (
        <span
          key={row.label}
          className="absolute left-3 rounded-full bg-white/60 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-brand-sage backdrop-blur-sm"
          style={{ top: `${row.y}%` }}
        >
          {row.label}
        </span>
      ))}

      {/* Stations */}
      {safeAgents.map((agent, i) => {
        const station = STATIONS[agent.id];
        const pill = pillFor(agent);
        const pending = pendingByAgent.get(agent.id) ?? 0;
        const selected = selectedId === agent.id;
        return (
          <button
            key={agent.id}
            type="button"
            onClick={() => onSelectAgent(agent.id)}
            className={cn(
              "group absolute flex w-[88px] -translate-x-1/2 flex-col items-center text-center outline-none transition-transform duration-150 hover:scale-[1.06] focus-visible:scale-[1.06]",
              selected && "scale-[1.06]"
            )}
            style={{ left: `${station.x}%`, top: `${station.y}%`, zIndex: selected ? 20 : 10 }}
            aria-label={`${agent.name} — ${pill.label}`}
          >
            <div className={cn("relative", selected && "drop-shadow-md")}>
              <AgentCharacter agent={agent} floatDelay={`hq-float-delay-${(i % 4) + 1}`} isActive={selected} />
              {pending > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white shadow">
                  {pending}
                </span>
              )}
            </div>
            <span className="mt-0.5 max-w-[88px] truncate text-[11px] font-bold leading-tight text-brand-primary">
              {agent.name}
            </span>
            <span
              className={cn(
                "mt-0.5 max-w-[120px] truncate rounded-full border px-1.5 py-px text-[9px] font-semibold leading-tight",
                pill.tone
              )}
            >
              {pill.label}
            </span>
          </button>
        );
      })}

      {safeAgents.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="rounded-2xl bg-white/80 px-4 py-3 text-xs text-brand-muted">
            Agents will appear on the map after their next run.
          </p>
        </div>
      )}
    </div>
  );
}
