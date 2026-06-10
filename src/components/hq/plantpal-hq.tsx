"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HQLivingWorld } from "@/components/hq/living/hq-living-world";
import { HQLivingAgentDrawer } from "@/components/hq/living/hq-living-agent-drawer";
import { ActivityDetailDrawer } from "@/components/hq/agent-detail-drawer";
import { approveCommunityReply, rejectCommunityReply } from "@/lib/actions/roots-agent";
import { recordHQWorkflowEvent } from "@/lib/actions/hq-workflow";
import {
  activityToWorkflow,
  buildFeedConfirmationItem,
  getLiveActionLabel,
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
  const [workflowLabel, setWorkflowLabel] = useState<string | null>(null);

  const selectedAgent = useMemo(
    () => agents.find((a) => a.id === selectedAgentId) ?? null,
    [agents, selectedAgentId]
  );

  const selectedActivity = useMemo(
    () => activity.find((a) => a.id === selectedActivityId) ?? null,
    [activity, selectedActivityId]
  );

  const liveActionLabel = useMemo(
    () => getLiveActionLabel(activity, workflowLabel ?? weather.gardening_tip),
    [activity, workflowLabel, weather.gardening_tip]
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

      setWorkflowLabel(workflow.feedLabel);

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

  function handleDailyReportGenerated() {
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
    const wf = activityToWorkflow(item);
    if (wf) setWorkflowLabel(wf.feedLabel);
  }

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
    <div className="relative h-[calc(100dvh-7.5rem)] min-h-[480px] w-full lg:h-[calc(100vh-6.5rem)] lg:min-h-[600px]">
      <HQLivingWorld
        agents={agents}
        activity={activity}
        selectedId={selectedAgentId}
        onSelectAgent={openAgentDrawer}
        onSelectActivity={openActivityDrawer}
        onApproveActivity={handleApprove}
        onRejectActivity={handleReject}
        messageLines={messageLines}
        collaborationTasks={collaborationTasks}
        collaborationStats={collaborationStats}
        weather={weather}
        liveDataAvailable={liveDataAvailable}
        liveActionLabel={liveActionLabel}
        onWorkflowStarted={handleWorkflowStarted}
        onDailyReportGenerated={handleDailyReportGenerated}
        agentScheduleHealth={agentScheduleHealth}
      />

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
