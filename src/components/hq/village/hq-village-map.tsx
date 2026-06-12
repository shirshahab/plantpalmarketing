"use client";

import { cn } from "@/lib/utils";
import type { ActivityItem, AgentId, HQAgent } from "@/lib/hq/types";

/** Phase 40 — Game Boy / Stardew-style village. Buildings, status dots, tiny tags. No bubbles. */

type VillageBuilding = {
  id: AgentId | "moss" | "planty";
  name: string;
  building: string;
  row: string;
  x: number;
  y: number;
};

const BUILDINGS: VillageBuilding[] = [
  { id: "chief_of_staff", name: "Ivy", building: "Town Hall", row: "Town Center", x: 50, y: 8 },
  { id: "planty", name: "Planty", building: "Town Square", row: "Town Center", x: 72, y: 12 },
  { id: "creator", name: "Scout", building: "Scout Cabin", row: "Discovery Row", x: 14, y: 28 },
  { id: "community", name: "Roots", building: "Roots Garden", row: "Discovery Row", x: 50, y: 30 },
  { id: "competitor", name: "Sentinel", building: "Watchtower", row: "Discovery Row", x: 86, y: 28 },
  { id: "content", name: "Bloom", building: "Bloom Studio", row: "Creation Row", x: 12, y: 52 },
  { id: "acquisition", name: "Fern", building: "Creative House", row: "Creation Row", x: 38, y: 54 },
  { id: "moss", name: "Moss", building: "Brand Hut", row: "Creation Row", x: 62, y: 52 },
  { id: "creative_director", name: "Sage", building: "Sage Library", row: "Creation Row", x: 88, y: 54 },
  { id: "growth", name: "Atlas", building: "Observatory", row: "Growth Row", x: 22, y: 74 },
  { id: "partnerships", name: "Oak", building: "Workshop", row: "Growth Row", x: 50, y: 76 },
  { id: "customer_voice", name: "Echo", building: "Echo Pond", row: "Growth Row", x: 78, y: 74 },
  { id: "approval", name: "Gate", building: "Gate Station", row: "Operations Row", x: 30, y: 92 },
  { id: "publishing", name: "Sprout", building: "Greenhouse", row: "Operations Row", x: 70, y: 92 },
];

const STATUS_DOT: Record<string, string> = {
  researching: "bg-sky-400",
  writing: "bg-emerald-400",
  reviewing: "bg-violet-400",
  waiting_for_approval: "bg-amber-400",
  approved: "bg-lime-500",
  needs_attention: "bg-red-500",
  paused: "bg-gray-300",
};

const STATUS_TAG: Record<string, string> = {
  researching: "Scanning",
  writing: "Writing",
  reviewing: "Reviewing",
  waiting_for_approval: "Waiting",
  approved: "Ready",
  needs_attention: "Blocked",
  paused: "Idle",
};

function agentForBuilding(id: VillageBuilding["id"], agents: HQAgent[]): HQAgent | null {
  if (id === "moss" || id === "planty") return null;
  return agents.find((a) => a.id === id) ?? null;
}

export function HQVillageMap({
  agents,
  activity,
  selectedId,
  onSelectAgent,
  compact = false,
}: {
  agents: HQAgent[];
  activity: ActivityItem[];
  selectedId: AgentId | null;
  onSelectAgent: (id: AgentId) => void;
  compact?: boolean;
}) {
  const pendingByAgent = new Map<AgentId, number>();
  for (const item of activity) {
    if (item.agentId && item.status === "pending") {
      pendingByAgent.set(item.agentId, (pendingByAgent.get(item.agentId) ?? 0) + 1);
    }
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-x-auto overflow-y-hidden rounded-3xl border border-brand-border/60 bg-gradient-to-b from-[#e8f3e4] via-[#f0f7ec] to-[#dcebd6]",
        compact ? "h-[420px]" : "h-[420px] sm:h-[560px] lg:h-[620px]"
      )}
    >
      {/* Roads */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-30" aria-hidden>
        <path d="M10% 20% Q 50% 18%, 90% 22%" stroke="#8fb88a" strokeWidth="3" fill="none" strokeDasharray="6 4" />
        <path d="M8% 45% L 92% 47%" stroke="#8fb88a" strokeWidth="3" fill="none" />
        <path d="M15% 70% Q 50% 68%, 85% 72%" stroke="#8fb88a" strokeWidth="3" fill="none" />
        <path d="M25% 88% L 75% 90%" stroke="#8fb88a" strokeWidth="3" fill="none" />
      </svg>

      {BUILDINGS.map((b) => {
        const agent = agentForBuilding(b.id, agents);
        const isPlanty = b.id === "planty";
        const isMoss = b.id === "moss";
        const selected = agent && selectedId === agent.id;
        const pending = agent ? pendingByAgent.get(agent.id) ?? 0 : 0;
        const dotClass = agent ? STATUS_DOT[agent.status] ?? "bg-gray-300" : isMoss ? "bg-teal-400" : "bg-lime-400";
        const tag = agent ? STATUS_TAG[agent.status] ?? "Working" : isMoss ? "Reviewing" : "Roaming";

        return (
          <button
            key={b.id}
            type="button"
            disabled={isPlanty}
            onClick={() => agent && onSelectAgent(agent.id)}
            className={cn(
              "absolute flex -translate-x-1/2 flex-col items-center transition-transform",
              selected && "scale-110",
              !isPlanty && agent && "hover:scale-105",
              isPlanty && "pointer-events-none opacity-90"
            )}
            style={{ left: `${b.x}%`, top: `${b.y}%` }}
          >
            {/* Building */}
            <div
              className={cn(
                "relative flex flex-col items-center rounded-lg border-2 bg-white/90 px-2 py-1.5 shadow-sm",
                selected ? "border-brand-accent" : "border-brand-border/70",
                compact ? "min-w-[64px]" : "min-w-[76px]"
              )}
            >
              <span className={cn("absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full ring-2 ring-white", dotClass)} />
              {pending > 0 && (
                <span className="absolute -left-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-accent px-0.5 text-[9px] font-bold text-white">
                  {pending}
                </span>
              )}
              {agent ? (
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: agent.accent }}
                >
                  {agent.name.slice(0, 1)}
                </span>
              ) : isPlanty ? (
                <span className="text-2xl" title="Planty mascot">🌿</span>
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-sm">🍀</span>
              )}
              <span className="mt-0.5 max-w-[72px] truncate text-[9px] font-bold text-brand-primary">{b.name}</span>
            </div>
            <span className="mt-0.5 max-w-[80px] truncate text-[8px] font-medium uppercase tracking-wide text-brand-muted">
              {b.building}
            </span>
            <span className="mt-0.5 rounded-full bg-white/80 px-1.5 py-0.5 text-[8px] font-semibold text-brand-sage">
              {tag}
            </span>
          </button>
        );
      })}

      <div className="pointer-events-none absolute bottom-2 left-3 text-[10px] text-brand-muted/80">
        Phase 40 Village · click a building for details
      </div>
    </div>
  );
}
