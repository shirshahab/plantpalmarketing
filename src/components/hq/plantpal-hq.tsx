"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { HQLivingWorld } from "@/components/hq/living/hq-living-world";
import { HQLivingAgentDrawer } from "@/components/hq/living/hq-living-agent-drawer";
import { ActivityFeed } from "@/components/hq/activity-feed";
import { ActivityDetailDrawer } from "@/components/hq/agent-detail-drawer";
import { approveCommunityReply, rejectCommunityReply } from "@/lib/actions/roots-agent";
import type { ActivityItem, AgentId, HQAgent } from "@/lib/hq/types";
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
}: {
  initialAgents: HQAgent[];
  initialActivity: ActivityItem[];
  messageLines?: { from: AgentSlug; to: AgentSlug; priority: CollaborationPriority; id: string }[];
  collaborationStats?: { unreadMessages: number; activeTasks: number };
  collaborationMessages?: AgentMessage[];
  collaborationTasks?: AgentTask[];
  agentMemories?: AgentMemory[];
  agentDecisions?: AgentDecision[];
}) {
  const router = useRouter();
  const [agents] = useState<HQAgent[]>(initialAgents);
  const [activity, setActivity] = useState<ActivityItem[]>(initialActivity);
  const [selectedAgentId, setSelectedAgentId] = useState<AgentId | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [mobilePanel, setMobilePanel] = useState<"garden" | "activity">("garden");

  const selectedAgent = useMemo(
    () => agents.find((a) => a.id === selectedAgentId) ?? null,
    [agents, selectedAgentId]
  );

  const selectedActivity = useMemo(
    () => activity.find((a) => a.id === selectedActivityId) ?? null,
    [activity, selectedActivityId]
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
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col gap-3 lg:h-[calc(100vh-7rem)] lg:min-h-[680px] lg:flex-row lg:gap-4">
      <div className="flex gap-1 rounded-2xl border border-brand-border/50 bg-white/80 p-1 lg:hidden">
        <button
          type="button"
          onClick={() => setMobilePanel("garden")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition",
            mobilePanel === "garden" ? "bg-brand-primary text-white" : "text-brand-muted"
          )}
        >
          <Leaf className="h-4 w-4" />
          Garden
        </button>
        <button
          type="button"
          onClick={() => setMobilePanel("activity")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition",
            mobilePanel === "activity" ? "bg-brand-primary text-white" : "text-brand-muted"
          )}
        >
          <Activity className="h-4 w-4" />
          Activity
        </button>
      </div>

      <div
        className={cn(
          "min-h-[52dvh] flex-1 lg:min-h-0 lg:block lg:basis-[62%]",
          mobilePanel === "garden" ? "block" : "hidden"
        )}
      >
        <HQLivingWorld
          agents={agents}
          selectedId={selectedAgentId}
          onSelectAgent={openAgentDrawer}
          messageLines={messageLines}
          collaborationStats={collaborationStats}
          onDailyReportGenerated={handleDailyReportGenerated}
        />
      </div>

      <div
        className={cn(
          "min-h-[52dvh] lg:min-h-0 lg:block lg:basis-[38%]",
          mobilePanel === "activity" ? "block" : "hidden lg:block"
        )}
      >
        <ActivityFeed
          items={activity}
          selectedId={selectedActivityId}
          onSelect={openActivityDrawer}
          onApprove={handleApprove}
          onEdit={handleEdit}
          onReject={handleReject}
        />
      </div>

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
