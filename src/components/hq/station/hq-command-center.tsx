"use client";

import { HQStationMap } from "@/components/hq/station/hq-station-map";
import { HQActivityTicker } from "@/components/hq/station/hq-activity-ticker";
import { HQPulsePanel } from "@/components/hq/station/hq-pulse-panel";
import { HQQuickActions } from "@/components/hq/station/hq-quick-actions";
import type { ActivityItem, AgentId, HQAgent } from "@/lib/hq/types";

/**
 * Phase 34 — HQ Command Center.
 *
 * Mobile (top → bottom): ticker, agent world, HQ pulse, quick actions.
 * Desktop: quick actions left, agent world center, HQ pulse right.
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
  return (
    <div className="space-y-3 pb-20 lg:pb-4">
      <HQActivityTicker activity={activity} onSelectActivity={onSelectActivity} />

      <div className="grid gap-3 lg:grid-cols-[200px_minmax(0,1fr)_280px]">
        {/* Quick actions — left on desktop, below pulse on mobile */}
        <div className="order-3 lg:order-1">
          <HQQuickActions activity={activity} onDailyReportGenerated={onDailyReportGenerated} />
        </div>

        {/* Agent world — the star of the show */}
        <div className="order-1 lg:order-2">
          <HQStationMap
            agents={agents}
            activity={activity}
            selectedId={selectedAgentId}
            onSelectAgent={onSelectAgent}
          />
        </div>

        {/* HQ Pulse — right on desktop, collapsed by default */}
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
