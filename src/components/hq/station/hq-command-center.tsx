"use client";

import { useState } from "react";
import { HQStationMap } from "@/components/hq/station/hq-station-map";
import { HQVillageMap } from "@/components/hq/village/hq-village-map";
import { HQActivityTicker } from "@/components/hq/station/hq-activity-ticker";
import { HQPulsePanel } from "@/components/hq/station/hq-pulse-panel";
import { HQQuickActions } from "@/components/hq/station/hq-quick-actions";
import type { ActivityItem, AgentId, HQAgent } from "@/lib/hq/types";

type HQViewMode = "village" | "operations" | "list";

/**
 * Phase 40 — HQ with Village (default), Operations Map, Compact List.
 */
export function HQCommandCenter({
  agents,
  activity,
  selectedAgentId,
  onSelectAgent,
  onSelectActivity,
  onApproveActivity,
  onRejectActivity,
  onDailyReportGenerated,
}: {
  agents: HQAgent[];
  activity: ActivityItem[];
  selectedAgentId: AgentId | null;
  onSelectAgent: (id: AgentId) => void;
  onSelectActivity: (id: string) => void;
  onApproveActivity?: (id: string) => void;
  onRejectActivity?: (id: string) => void;
  onDailyReportGenerated?: () => void;
}) {
  const [viewMode, setViewMode] = useState<HQViewMode>("village");

  return (
    <div className="space-y-3 pb-20 lg:pb-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <HQActivityTicker activity={activity} onSelectActivity={onSelectActivity} />
        <div className="flex gap-1 rounded-xl border border-brand-border bg-white p-1">
          {(
            [
              ["village", "Village"],
              ["operations", "Operations Map"],
              ["list", "Compact List"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setViewMode(key)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium ${
                viewMode === key ? "bg-brand-primary text-white" : "text-brand-muted hover:bg-brand-bg"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[200px_minmax(0,1fr)_280px]">
        <div className="order-3 lg:order-1">
          <HQQuickActions activity={activity} onDailyReportGenerated={onDailyReportGenerated} />
        </div>

        <div className="order-1 lg:order-2">
          {viewMode === "village" && (
            <HQVillageMap
              agents={agents}
              activity={activity}
              selectedId={selectedAgentId}
              onSelectAgent={onSelectAgent}
            />
          )}
          {viewMode === "operations" && (
            <HQStationMap
              agents={agents}
              activity={activity}
              selectedId={selectedAgentId}
              onSelectAgent={onSelectAgent}
            />
          )}
          {viewMode === "list" && (
            <div className="space-y-2 rounded-2xl border border-brand-border bg-white p-3">
              {agents.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onSelectAgent(a.id)}
                  className="flex w-full items-center justify-between rounded-xl border border-brand-border/60 px-3 py-2 text-left hover:bg-brand-bg"
                >
                  <span className="text-sm font-medium text-brand-primary">{a.name}</span>
                  <span className="text-xs text-brand-muted">{a.currentTask.slice(0, 48)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="order-2 lg:order-3">
          <HQPulsePanel
            activity={activity}
            onSelectActivity={onSelectActivity}
            onApproveActivity={onApproveActivity}
            onRejectActivity={onRejectActivity}
          />
        </div>
      </div>
    </div>
  );
}
