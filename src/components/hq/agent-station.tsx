"use client";

import { cn } from "@/lib/utils";
import { AgentCharacter } from "@/components/hq/agent-character";
import { AgentHoverPopover } from "@/components/hq/agent-hover-popover";
import { AgentStatusBadge } from "@/components/hq/agent-status-badge";
import type { HQAgent } from "@/lib/hq/types";

export function AgentStation({
  agent,
  floatDelay,
  isSelected,
  onSelect,
}: {
  agent: HQAgent;
  floatDelay: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const working = ["researching", "writing", "reviewing"].includes(agent.status);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative flex w-full flex-col items-center rounded-3xl border border-white/60 bg-white/50 p-4 text-left shadow-sm backdrop-blur-sm transition-all duration-300",
        "hover:-translate-y-1 hover:border-brand-accent/30 hover:bg-white/80 hover:shadow-lg",
        isSelected && "border-brand-accent/50 bg-white/90 shadow-lg ring-2 ring-brand-accent/20"
      )}
    >
      <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-brand-accent/40 to-transparent opacity-0 transition group-hover:opacity-100" />

      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-brand-sage">
        {agent.station}
      </p>

      <div className="relative">
        <div className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <AgentHoverPopover agent={agent} />
        </div>
        <AgentCharacter agent={agent} floatDelay={floatDelay} isActive={isSelected} />
      </div>

      <div className="mt-3 w-full text-center">
        <p className="font-heading text-sm font-bold text-brand-primary">{agent.name}</p>
        <p className="text-[11px] text-brand-muted">{agent.role}</p>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
        <AgentStatusBadge status={agent.status} size="xs" />
        {(agent.unreadMessages ?? 0) > 0 && (
          <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-semibold text-sky-700">
            {agent.unreadMessages} msg
          </span>
        )}
        {(agent.activeTasks ?? 0) > 0 && (
          <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-semibold text-violet-700">
            {agent.activeTasks} task
          </span>
        )}
      </div>

      <div className="mt-3 w-full">
        <div className="mb-1 flex justify-between text-[10px] text-brand-muted">
          <span>Progress</span>
          <span>{agent.progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-brand-primary/10">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              working ? "hq-shimmer bg-brand-accent" : "bg-brand-sage"
            )}
            style={{ width: `${agent.progress}%` }}
          />
        </div>
      </div>
    </button>
  );
}
