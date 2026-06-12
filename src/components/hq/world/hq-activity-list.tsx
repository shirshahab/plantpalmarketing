"use client";

import { HQStatusPill, agentStatusToVillage } from "@/components/hq/world/hq-status-pill";
import type { ActivityItem, AgentId, HQAgent } from "@/lib/hq/types";

/** Minimal fallback — no maps, no floating cards. */
export function HQActivityList({
  agents,
  activity,
  onSelectAgent,
  onSelectActivity,
}: {
  agents: HQAgent[];
  activity: ActivityItem[];
  onSelectAgent: (id: AgentId) => void;
  onSelectActivity: (id: string) => void;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-brand-border/60 bg-white p-4">
      <section>
        <h2 className="mb-2 text-sm font-semibold text-brand-primary">Agents</h2>
        <div className="space-y-1.5">
          {agents.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onSelectAgent(a.id)}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-brand-border/50 px-3 py-2 text-left hover:bg-brand-bg"
            >
              <span className="text-sm font-medium text-brand-primary">{a.name}</span>
              <HQStatusPill status={agentStatusToVillage(a.status)} />
            </button>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-sm font-semibold text-brand-primary">Recent activity</h2>
        <div className="space-y-1.5">
          {activity.slice(0, 20).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectActivity(item.id)}
              className="w-full rounded-xl border border-brand-border/40 px-3 py-2 text-left hover:bg-brand-bg"
            >
              <p className="text-sm font-medium text-brand-primary">{item.title}</p>
              <p className="line-clamp-1 text-xs text-brand-muted">{item.summary}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
