"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HQVillageWorld } from "@/components/hq/world/hq-village-world";
import { HQActivityList } from "@/components/hq/world/hq-activity-list";
import { HQInternetPulse } from "@/components/hq/hq-internet-pulse";
import type { InternetPulseDashboard } from "@/lib/intelligence/intelligence-engine";
import { PanelErrorBoundary } from "@/components/shared/error-boundary";
import { HQLivingAgentDrawer } from "@/components/hq/living/hq-living-agent-drawer";
import { ActivityDetailDrawer } from "@/components/hq/agent-detail-drawer";
import { approveCommunityReply, rejectCommunityReply } from "@/lib/actions/roots-agent";
import { recordHQWorkflowEvent } from "@/lib/actions/hq-workflow";
import {
  buildFeedConfirmationItem,
  shouldConfirmFeedItem,
  type WorkflowChoreography,
} from "@/lib/hq/activity-to-choreography";
import type { ActivityItem, AgentId, HQAgent } from "@/lib/hq/types";
import type { HQWeatherState } from "@/lib/hq/hq-weather";
import { buildWeatherWorkflows, mergeWeatherActivity } from "@/lib/hq/weather-activity";
import type { HQAgentScheduleHealth } from "@/lib/agent-worker/types";
import type {
  AgentDecision,
  AgentMemory,
  AgentMessage,
  AgentSlug,
  AgentTask,
  CollaborationPriority,
} from "@/lib/types";

type DrawerMode = "agent" | "activity" | null;
type HQViewMode = "world" | "list";

const VIEW_MODE_KEY = "plantpal-hq-view-mode";

export function PlantPalHQ({
  initialAgents,
  initialActivity,
  messageLines = [],
  collaborationStats,
  collaborationMessages = [],
  collaborationTasks = [],
  agentMemories = [],
  agentDecisions = [],
  weather,
  liveDataAvailable = true,
  agentScheduleHealth = [],
  internetPulse = null,
}: {
  initialAgents: HQAgent[];
  initialActivity: ActivityItem[];
  messageLines?: { from: AgentSlug; to: AgentSlug; priority: CollaborationPriority; id: string }[];
  collaborationStats?: { unreadMessages: number; activeTasks: number };
  collaborationMessages?: AgentMessage[];
  collaborationTasks?: AgentTask[];
  agentMemories?: AgentMemory[];
  agentDecisions?: AgentDecision[];
  weather: HQWeatherState;
  liveDataAvailable?: boolean;
  agentScheduleHealth?: HQAgentScheduleHealth[];
  internetPulse?: InternetPulseDashboard | null;
}) {
  const router = useRouter();
  const [agents] = useState<HQAgent[]>(initialAgents);
  const [activity, setActivity] = useState<ActivityItem[]>(() =>
    mergeWeatherActivity(initialActivity, weather)
  );
  const weatherWorkflowsLogged = useRef(false);
  const [selectedAgentId, setSelectedAgentId] = useState<AgentId | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);

  // Phase 42 — Village is the default HQ. Activity list is the compact fallback.
  const [viewMode, setViewMode] = useState<HQViewMode>("world");
  const [viewReady, setViewReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(VIEW_MODE_KEY);
      if (stored === "list") {
        setViewMode("list");
      }
    } catch {
      // ignore storage failures (private mode)
    }
    setViewReady(true);
  }, []);

  const switchViewMode = useCallback((mode: HQViewMode) => {
    setViewMode(mode);
    try {
      window.localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch {
      // ignore
    }
  }, []);

  const selectedAgent = useMemo(
    () => agents.find((a) => a.id === selectedAgentId) ?? null,
    [agents, selectedAgentId]
  );

  const selectedActivity = useMemo(
    () => activity.find((a) => a.id === selectedActivityId) ?? null,
    [activity, selectedActivityId]
  );

  useEffect(() => {
    if (weatherWorkflowsLogged.current || !weather.live) return;
    weatherWorkflowsLogged.current = true;
    for (const wf of buildWeatherWorkflows(weather)) {
      void recordHQWorkflowEvent(wf);
    }
  }, [weather]);

  const handleWorkflowStarted = useCallback(
    (workflow: WorkflowChoreography) => {
      if (workflow.triggerType === "demo") return;

      if (shouldConfirmFeedItem(activity, workflow)) {
        const item = buildFeedConfirmationItem(workflow);
        setActivity((prev) => {
          if (prev.some((p) => p.id === item.id)) return prev;
          return [item, ...prev];
        });
      }

      void recordHQWorkflowEvent(workflow);
    },
    [activity]
  );

  function openAgentDrawer(id: AgentId) {
    setSelectedAgentId(id);
    setSelectedActivityId(null);
    setDrawerMode("agent");
  }

  function openActivityDrawer(id: string) {
    setSelectedActivityId(id);
    setSelectedAgentId(null);
    setDrawerMode("activity");
  }

  function closeDrawer() {
    setDrawerMode(null);
  }

  function updateActivityStatus(id: string, status: ActivityItem["status"]) {
    setActivity((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  }

  async function handleApprove(id: string) {
    const item = activity.find((a) => a.id === id);
    if (item?.type === "reply_awaiting_approval" && item.entityId) {
      await approveCommunityReply(item.entityId);
      router.refresh();
    }
    updateActivityStatus(id, "approved");
    if (drawerMode === "activity" && selectedActivityId === id) {
      setTimeout(closeDrawer, 600);
    }
  }

  async function handleReject(id: string) {
    const item = activity.find((a) => a.id === id);
    if (item?.type === "reply_awaiting_approval" && item.entityId) {
      await rejectCommunityReply(item.entityId);
      router.refresh();
    }
    updateActivityStatus(id, "rejected");
    if (drawerMode === "activity" && selectedActivityId === id) {
      setTimeout(closeDrawer, 600);
    }
  }

  const handleDailyReportGenerated = useCallback(() => {
    const item: ActivityItem = {
      id: `ivy-daily-report-${Date.now()}`,
      type: "ivy_daily_report",
      title: "Ivy generated the daily report.",
      summary: "24h executive summary saved — view at /daily-report. All actions require human approval.",
      timestamp: new Date().toISOString(),
      agentId: "chief_of_staff",
      status: "approved",
    };
    setActivity((prev) => [item, ...prev]);
  }, []);

  function handleEdit(id: string) {
    const item = activity.find((a) => a.id === id);
    if (item?.agentId === "creator") { window.location.href = "/creators"; return; }
    if (item?.agentId === "community") { window.location.href = "/community"; return; }
    if (item?.agentId === "competitor") { window.location.href = "/competitors"; return; }
    if (item?.agentId === "content") { window.location.href = "/bloom"; return; }
    if (item?.agentId === "creative_director") { window.location.href = "/sage"; return; }
    if (item?.agentId === "publishing") { window.location.href = "/sprout"; return; }
    if (item?.agentId === "partnerships") { window.location.href = "/oak"; return; }
    if (item?.agentId === "chief_of_staff") { window.location.href = "/ivy"; return; }
    if (item?.agentId === "growth") { window.location.href = "/atlas"; return; }
    if (item?.agentId === "acquisition") { window.location.href = "/fern"; return; }
    if (item?.agentId === "customer_voice") { window.location.href = "/echo"; return; }
    if (item?.type.startsWith("collab_")) { window.location.href = "/collaboration"; return; }
    openActivityDrawer(id);
  }

  return (
    <div
      className={
        viewMode === "world"
          ? "relative h-[calc(100dvh-7.5rem)] min-h-[480px] w-full lg:h-[calc(100vh-6.5rem)] lg:min-h-[600px]"
          : "relative w-full"
      }
    >
      {/* Compact / Living World toggle */}
      <div
        className={
          viewMode === "world"
            ? "absolute left-2 top-2 z-40 sm:left-4 sm:top-3"
            : "mb-3 flex justify-end"
        }
      >
        <div className="inline-flex rounded-full border border-brand-border/60 bg-white/90 p-0.5 shadow-sm backdrop-blur">
          <button
            type="button"
            onClick={() => switchViewMode("world")}
            className={
              viewMode === "world"
                ? "rounded-full bg-brand-primary px-3 py-1.5 text-[11px] font-semibold text-white"
                : "rounded-full px-3 py-1.5 text-[11px] font-medium text-brand-muted"
            }
          >
            Village
          </button>
          <button
            type="button"
            onClick={() => switchViewMode("list")}
            className={
              viewMode === "list"
                ? "rounded-full bg-brand-primary px-3 py-1.5 text-[11px] font-semibold text-white"
                : "rounded-full px-3 py-1.5 text-[11px] font-medium text-brand-muted"
            }
          >
            Activity List
          </button>
        </div>
      </div>

      {viewMode === "world" ? (
        <div className={viewReady ? "h-full" : "h-full opacity-0"}>
          <div className="pointer-events-none absolute left-2 right-2 top-12 z-40 sm:left-4 sm:right-auto sm:top-14 sm:max-w-md">
            <HQInternetPulse dashboard={internetPulse ?? null} />
          </div>
          <HQVillageWorld
            agents={agents}
            activity={activity}
            selectedId={selectedAgentId}
            onSelectAgent={openAgentDrawer}
            messageLines={messageLines}
            collaborationTasks={collaborationTasks}
            weather={weather}
            liveDataAvailable={liveDataAvailable}
            onWorkflowStarted={handleWorkflowStarted}
            onOpenActivityList={() => switchViewMode("list")}
            onDailyReportGenerated={handleDailyReportGenerated}
            collaborationStats={collaborationStats}
            agentScheduleHealth={agentScheduleHealth}
          />
        </div>
      ) : (
        <PanelErrorBoundary>
          <div className="px-4 pt-4">
            <HQInternetPulse dashboard={internetPulse ?? null} />
          </div>
          <HQActivityList
            agents={agents}
            activity={activity}
            onSelectAgent={openAgentDrawer}
            onSelectActivity={openActivityDrawer}
          />
        </PanelErrorBoundary>
      )}

      {drawerMode === "agent" && (
        <HQLivingAgentDrawer
          agent={selectedAgent}
          tasks={collaborationTasks}
          messages={collaborationMessages}
          memories={agentMemories}
          decisions={agentDecisions}
          feedItems={activity}
          onClose={closeDrawer}
        />
      )}

      {drawerMode === "activity" && (
        <ActivityDetailDrawer
          activity={selectedActivity}
          onClose={closeDrawer}
          onApprove={() => selectedActivity && handleApprove(selectedActivity.id)}
          onEdit={() => selectedActivity && handleEdit(selectedActivity.id)}
          onReject={() => selectedActivity && handleReject(selectedActivity.id)}
        />
      )}
    </div>
  );
}
