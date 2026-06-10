import { AgentStatusBadge } from "@/components/hq/agent-status-badge";
import type { HQAgent } from "@/lib/hq/types";

export function AgentHoverPopover({ agent }: { agent: HQAgent }) {
  return (
    <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-3 w-64 -translate-x-1/2 rounded-2xl border border-brand-border/80 bg-white/95 p-4 shadow-xl backdrop-blur-md">
      <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-brand-border/80 bg-white/95" />
      <p className="font-heading text-sm font-bold text-brand-primary">{agent.name}</p>
      <p className="text-xs text-brand-muted">{agent.role}</p>
      <div className="mt-2">
        <AgentStatusBadge status={agent.status} size="xs" />
      </div>
      <p className="mt-3 text-xs leading-relaxed text-gray-700">
        <span className="font-medium text-brand-primary">Now:</span> {agent.currentTask}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-lg bg-brand-bg px-2 py-1.5">
          <span className="text-brand-muted">Created</span>
          <p className="font-semibold text-brand-primary">{agent.itemsCreated}</p>
        </div>
        <div className="rounded-lg bg-brand-bg px-2 py-1.5">
          <span className="text-brand-muted">Review</span>
          <p className="font-semibold text-brand-primary">{agent.itemsNeedingReview}</p>
        </div>
      </div>
      <p className="mt-2 text-[10px] text-brand-sage">Updated {agent.lastUpdate}</p>
    </div>
  );
}
