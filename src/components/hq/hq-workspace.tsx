"use client";

import { Leaf, Radio } from "lucide-react";
import { AgentStation } from "@/components/hq/agent-station";
import { HQCollaborationOverlay } from "@/components/hq/hq-collaboration-overlay";
import type { AgentId, HQAgent } from "@/lib/hq/types";
import type { AgentSlug, CollaborationPriority } from "@/lib/types";

const FLOAT_DELAYS = [
  "hq-float-delay-1",
  "hq-float-delay-2",
  "hq-float-delay-3",
  "hq-float-delay-4",
  "hq-float-delay-5",
  "hq-float-delay-6",
  "",
];

const STATION_LAYOUT: AgentId[][] = [
  ["publishing", "content", "creative_director"],
  ["community", "approval", "creator"],
  ["competitor", "partnerships", "growth"],
  ["acquisition", "customer_voice"],
];

export function HQWorkspace({
  agents,
  selectedId,
  onSelectAgent,
  messageLines = [],
  collaborationStats,
}: {
  agents: HQAgent[];
  selectedId: AgentId | null;
  onSelectAgent: (id: AgentId) => void;
  messageLines?: { from: AgentSlug; to: AgentSlug; priority: CollaborationPriority; id: string }[];
  collaborationStats?: { unreadMessages: number; activeTasks: number };
}) {
  const ivyAgent = agents.find((a) => a.id === "chief_of_staff");
  const stationAgents = agents.filter((a) => a.id !== "chief_of_staff");
  const agentMap = Object.fromEntries(stationAgents.map((a) => [a.id, a])) as Record<AgentId, HQAgent>;
  let delayIdx = 0;

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-brand-border/60 bg-gradient-to-br from-[#e8f3ec] via-[#f4f9f5] to-[#dceee3] shadow-inner">
      {/* Ambient floor grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #2d6a4f22 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Header strip */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/50 px-6 py-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-primary text-white shadow-sm">
              <Leaf className="h-4 w-4" />
            </div>
            <div>
              <h1 className="font-heading text-lg font-bold text-brand-primary">PlantPal HQ</h1>
              <p className="text-xs text-brand-muted">Living marketing command center</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {collaborationStats && collaborationStats.unreadMessages > 0 && (
            <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
              {collaborationStats.unreadMessages} messages
            </span>
          )}
          {collaborationStats && collaborationStats.activeTasks > 0 && (
            <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
              {collaborationStats.activeTasks} active tasks
            </span>
          )}
          <div className="flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/70 px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-sm">
            <Radio className="h-3 w-3 animate-pulse text-emerald-500" />
            12 agents online
          </div>
        </div>
      </div>

      {/* Central hub + stations */}
      <div className="relative z-10 flex flex-1 flex-col gap-4 p-5">
        <HQCollaborationOverlay messageLines={messageLines} />
        {/* Ivy — Executive Garden (center) */}
        {ivyAgent ? (
          <div className="mx-auto w-full max-w-md">
            <AgentStation
              agent={ivyAgent}
              floatDelay="hq-float-delay-2"
              isSelected={selectedId === "chief_of_staff"}
              onSelect={() => onSelectAgent("chief_of_staff")}
            />
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-xs flex-col items-center rounded-2xl border border-brand-primary/15 bg-white/60 px-6 py-4 backdrop-blur-sm">
            <div className="hq-breathe flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary to-brand-accent text-white shadow-lg">
              <Leaf className="h-7 w-7" />
            </div>
            <p className="mt-2 font-heading text-sm font-bold text-brand-primary">Mission Control</p>
            <p className="text-center text-[11px] text-brand-muted">
              All outputs route through human approval before publishing
            </p>
          </div>
        )}

        {/* Station grid */}
        <div className="flex flex-1 flex-col justify-center gap-4">
          {STATION_LAYOUT.map((row, rowIdx) => (
            <div
              key={rowIdx}
              className={`grid gap-3 ${
                row.length === 1
                  ? "mx-auto max-w-xs grid-cols-1"
                  : row.length === 3
                    ? "grid-cols-1 sm:grid-cols-3"
                    : "grid-cols-2"
              }`}
            >
              {row.map((id) => {
                const agent = agentMap[id];
                const delay = FLOAT_DELAYS[delayIdx++] ?? "";
                return (
                  <AgentStation
                    key={id}
                    agent={agent}
                    floatDelay={delay}
                    isSelected={selectedId === id}
                    onSelect={() => onSelectAgent(id)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Floor glow */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-32 w-3/4 -translate-x-1/2 rounded-full bg-brand-accent/10 blur-3xl" />
    </div>
  );
}
