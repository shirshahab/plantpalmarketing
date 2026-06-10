import type { ActivityItem, AgentId, HQAgent } from "@/lib/hq/types";
import type { AgentSlug, AgentTask, CollaborationPriority } from "@/lib/types";
import { hqIdToSlug, slugToHqId } from "@/lib/agents/agent-slugs";
import type { ChoreographyStep } from "@/lib/hq/hq-movement-choreography";
import {
  AGENT_WORLD_POSITIONS,
  GARDEN_ZONES,
  type GardenZoneId,
  type WorldPoint,
} from "@/lib/hq/hq-world-layout";

export type ChoreographyTriggerType = "collab_message" | "activity" | "agent_event" | "task" | "demo";

export interface WorkflowChoreography {
  step: ChoreographyStep;
  sourceAgentId: AgentId;
  targetAgentId: AgentId;
  sourceZoneId: GardenZoneId;
  targetZoneId: GardenZoneId;
  workflowName: string;
  pathLabel: string;
  feedLabel: string;
  triggerType: ChoreographyTriggerType;
  triggerId: string;
}

export interface ActiveWorkflowVisual {
  sourceAgentId: AgentId;
  targetAgentId: AgentId;
  sourceZoneId: GardenZoneId;
  targetZoneId: GardenZoneId;
  pathLabel: string;
  from: WorldPoint;
  to: WorldPoint;
}

type RouteDef = {
  walker: AgentId;
  target: AgentId;
  workflowName: string;
  pathLabel: string;
  feedLabel: string;
  state?: ChoreographyStep["state"];
};

function zoneForAgent(agentId: AgentId): GardenZoneId {
  return AGENT_WORLD_POSITIONS[agentId]?.zone ?? "executive_garden";
}

function buildWorkflow(def: RouteDef, triggerType: ChoreographyTriggerType, triggerId: string, labelOverride?: string): WorkflowChoreography {
  const from = AGENT_WORLD_POSITIONS[def.walker]?.home;
  const to = AGENT_WORLD_POSITIONS[def.target]?.home;
  if (!from || !to) {
    throw new Error(`Invalid route ${def.walker} → ${def.target}`);
  }
  const feedLabel = labelOverride ?? def.feedLabel;
  return {
    step: {
      agentId: def.walker,
      from,
      to,
      durationMs: 3800,
      state: def.state ?? "handoff",
      label: feedLabel,
      pauseMs: 2000,
    },
    sourceAgentId: def.walker,
    targetAgentId: def.target,
    sourceZoneId: zoneForAgent(def.walker),
    targetZoneId: zoneForAgent(def.target),
    workflowName: def.workflowName,
    pathLabel: def.pathLabel,
    feedLabel,
    triggerType,
    triggerId,
  };
}

const ACTIVITY_ROUTE_DEFS: Partial<Record<ActivityItem["type"], RouteDef>> = {
  scout_found_creator: {
    walker: "creator",
    target: "partnerships",
    workflowName: "scout_to_oak",
    pathLabel: "Creator lead routed",
    feedLabel: "Scout routed a creator lead to Oak",
  },
  creator_lead: {
    walker: "creator",
    target: "partnerships",
    workflowName: "scout_to_oak",
    pathLabel: "Creator lead routed",
    feedLabel: "Scout handed a creator lead to Oak",
  },
  community_opportunity: {
    walker: "community",
    target: "content",
    workflowName: "roots_to_bloom",
    pathLabel: "Community insight shared",
    feedLabel: "Roots handed a plant question to Bloom",
  },
  roots_found_discussion: {
    walker: "community",
    target: "content",
    workflowName: "roots_to_bloom",
    pathLabel: "Discussion routed to content",
    feedLabel: "Roots shared a community thread with Bloom",
  },
  bloom_content_draft: {
    walker: "content",
    target: "creative_director",
    workflowName: "bloom_to_sage",
    pathLabel: "Draft sent for review",
    feedLabel: "Bloom sent a draft to Sage for review",
  },
  bloom_batch: {
    walker: "content",
    target: "creative_director",
    workflowName: "bloom_to_sage",
    pathLabel: "Batch sent for review",
    feedLabel: "Bloom delivered content batch to Sage",
  },
  content_draft: {
    walker: "content",
    target: "creative_director",
    workflowName: "bloom_to_sage",
    pathLabel: "Draft sent for review",
    feedLabel: "Bloom created content for Sage",
  },
  sage_approval: {
    walker: "creative_director",
    target: "approval",
    workflowName: "sage_to_gate",
    pathLabel: "Review passed to Gate",
    feedLabel: "Sage approved content for Gate",
  },
  sage_review_batch: {
    walker: "creative_director",
    target: "approval",
    workflowName: "sage_to_gate",
    pathLabel: "Review batch approved",
    feedLabel: "Sage sent approved pieces to Gate",
  },
  approval_needed: {
    walker: "approval",
    target: "publishing",
    workflowName: "gate_to_sprout",
    pathLabel: "Approved for scheduling",
    feedLabel: "Gate approved a post for Sprout",
  },
  sprout_ready: {
    walker: "publishing",
    target: "approval",
    workflowName: "sprout_to_gate",
    pathLabel: "Post queued at Gate",
    feedLabel: "Sprout queued posts at Launch Gate",
    state: "walking",
  },
  sprout_scheduled: {
    walker: "publishing",
    target: "approval",
    workflowName: "sprout_to_gate",
    pathLabel: "Schedule confirmed",
    feedLabel: "Sprout confirmed scheduling at Launch Gate",
    state: "walking",
  },
  competitor_alert: {
    walker: "competitor",
    target: "growth",
    workflowName: "sentinel_to_atlas",
    pathLabel: "Competitive intel routed",
    feedLabel: "Sentinel alerted Atlas to a competitor signal",
  },
  competitor_feature: {
    walker: "competitor",
    target: "growth",
    workflowName: "sentinel_to_atlas",
    pathLabel: "Feature alert routed",
    feedLabel: "Sentinel sent competitor feature intel to Atlas",
  },
  competitor_viral: {
    walker: "competitor",
    target: "growth",
    workflowName: "sentinel_to_atlas",
    pathLabel: "Viral signal routed",
    feedLabel: "Sentinel flagged viral competitor activity for Atlas",
  },
  echo_feature_request: {
    walker: "customer_voice",
    target: "growth",
    workflowName: "echo_to_atlas",
    pathLabel: "User insight routed",
    feedLabel: "Echo shared user insight with Atlas",
  },
  echo_sentiment: {
    walker: "customer_voice",
    target: "growth",
    workflowName: "echo_to_atlas",
    pathLabel: "Sentiment routed",
    feedLabel: "Echo handed sentiment data to Atlas",
  },
  echo_voc_report: {
    walker: "customer_voice",
    target: "growth",
    workflowName: "echo_to_atlas",
    pathLabel: "VoC report routed",
    feedLabel: "Echo delivered a voice-of-customer report to Atlas",
  },
  echo_churn: {
    walker: "customer_voice",
    target: "growth",
    workflowName: "echo_to_atlas",
    pathLabel: "Churn risk routed",
    feedLabel: "Echo flagged churn risk for Atlas",
  },
  atlas_recommendation: {
    walker: "growth",
    target: "chief_of_staff",
    workflowName: "atlas_to_ivy",
    pathLabel: "Growth brief routed",
    feedLabel: "Atlas sent a growth recommendation to Ivy",
  },
  atlas_growth_brief: {
    walker: "growth",
    target: "chief_of_staff",
    workflowName: "atlas_to_ivy",
    pathLabel: "Growth brief routed",
    feedLabel: "Atlas shared the growth brief with Ivy",
  },
  ivy_daily_report: {
    walker: "chief_of_staff",
    target: "chief_of_staff",
    workflowName: "ivy_executive_brief",
    pathLabel: "Executive brief ready",
    feedLabel: "Ivy published the daily executive report",
    state: "working",
  },
  oak_partnership: {
    walker: "partnerships",
    target: "approval",
    workflowName: "oak_to_gate",
    pathLabel: "Partnership routed",
    feedLabel: "Oak routed a partnership to Gate",
  },
  oak_outreach: {
    walker: "partnerships",
    target: "creator",
    workflowName: "oak_to_scout",
    pathLabel: "Outreach sync",
    feedLabel: "Oak synced outreach with Scout",
    state: "walking",
  },
  collab_task: {
    walker: "approval",
    target: "publishing",
    workflowName: "gate_to_sprout",
    pathLabel: "Task handoff",
    feedLabel: "Gate handed an approved task to Sprout",
  },
  collab_message: {
    walker: "chief_of_staff",
    target: "content",
    workflowName: "collab_handoff",
    pathLabel: "Team handoff",
    feedLabel: "Cross-team collaboration handoff",
    state: "walking",
  },
  reply_awaiting_approval: {
    walker: "community",
    target: "approval",
    workflowName: "roots_to_gate",
    pathLabel: "Reply needs approval",
    feedLabel: "Roots sent a reply draft to Gate for approval",
  },
};

export function activityToWorkflow(item: ActivityItem): WorkflowChoreography | null {
  if (item.id.startsWith("weather-signal-")) {
    try {
      if (item.agentId === "community") {
        return buildWorkflow(
          {
            walker: "chief_of_staff",
            target: "community",
            workflowName: "openweather_to_roots",
            pathLabel: "Rain signal → Roots",
            feedLabel: item.title,
          },
          "activity",
          item.id,
          item.title
        );
      }
      if (item.agentId === "content") {
        return buildWorkflow(
          {
            walker: "chief_of_staff",
            target: "content",
            workflowName: "openweather_to_bloom",
            pathLabel: "Dry heat signal → Bloom",
            feedLabel: item.title,
          },
          "activity",
          item.id,
          item.title
        );
      }
    } catch {
      return null;
    }
  }

  const def = ACTIVITY_ROUTE_DEFS[item.type];
  if (!def) return null;
  try {
    const label = item.title.length <= 72 ? item.title : def.feedLabel;
    return buildWorkflow(def, "activity", item.id, label);
  } catch {
    return null;
  }
}

export function messageToWorkflow(
  from: AgentSlug,
  to: AgentSlug,
  messageId: string
): WorkflowChoreography | null {
  const walker = slugToHqId(from);
  const target = slugToHqId(to);
  const fromPos = AGENT_WORLD_POSITIONS[walker]?.home;
  const toPos = AGENT_WORLD_POSITIONS[target]?.home;
  if (!fromPos || !toPos) return null;

  return {
    step: {
      agentId: walker,
      from: fromPos,
      to: toPos,
      durationMs: 3600,
      state: "handoff",
      label: `${hqIdToSlug(walker)} → ${hqIdToSlug(target)} collaboration handoff`,
      pauseMs: 2200,
    },
    sourceAgentId: walker,
    targetAgentId: target,
    sourceZoneId: zoneForAgent(walker),
    targetZoneId: zoneForAgent(target),
    workflowName: `collab_${from}_to_${to}`,
    pathLabel: "Live collaboration handoff",
    feedLabel: `${hqIdToSlug(walker)} handed work to ${hqIdToSlug(target)}`,
    triggerType: "collab_message",
    triggerId: messageId,
  };
}

export function taskToWorkflow(task: AgentTask): WorkflowChoreography | null {
  if (task.status === "completed" || task.status === "cancelled") return null;
  const walker = slugToHqId(task.createdBy);
  const target = slugToHqId(task.assignedAgent);
  if (walker === target) return null;
  const fromPos = AGENT_WORLD_POSITIONS[walker]?.home;
  const toPos = AGENT_WORLD_POSITIONS[target]?.home;
  if (!fromPos || !toPos) return null;

  return {
    step: {
      agentId: walker,
      from: fromPos,
      to: toPos,
      durationMs: 3400,
      state: "handoff",
      label: task.description.slice(0, 80),
      pauseMs: 1800,
    },
    sourceAgentId: walker,
    targetAgentId: target,
    sourceZoneId: zoneForAgent(walker),
    targetZoneId: zoneForAgent(target),
    workflowName: `task_${task.taskType}`,
    pathLabel: "Active task routed",
    feedLabel: `${task.createdBy} assigned a task to ${task.assignedAgent}`,
    triggerType: "task",
    triggerId: task.id,
  };
}

export function agentEventToWorkflow(agent: HQAgent): WorkflowChoreography | null {
  if (agent.status !== "needs_attention" && (agent.itemsNeedingReview ?? 0) === 0) return null;

  const attentionRoutes: Partial<Record<AgentId, RouteDef>> = {
    creator: ACTIVITY_ROUTE_DEFS.creator_lead!,
    community: ACTIVITY_ROUTE_DEFS.community_opportunity!,
    content: ACTIVITY_ROUTE_DEFS.bloom_content_draft!,
    creative_director: ACTIVITY_ROUTE_DEFS.sage_approval!,
    approval: ACTIVITY_ROUTE_DEFS.approval_needed!,
    publishing: ACTIVITY_ROUTE_DEFS.sprout_ready!,
    competitor: ACTIVITY_ROUTE_DEFS.competitor_alert!,
    customer_voice: ACTIVITY_ROUTE_DEFS.echo_feature_request!,
    growth: ACTIVITY_ROUTE_DEFS.atlas_recommendation!,
    partnerships: ACTIVITY_ROUTE_DEFS.oak_partnership!,
    chief_of_staff: ACTIVITY_ROUTE_DEFS.ivy_daily_report!,
  };

  const def = attentionRoutes[agent.id];
  if (!def) return null;

  try {
    return buildWorkflow(
      def,
      "agent_event",
      `agent:${agent.id}:${agent.lastUpdate}`,
      `${agent.name} needs attention — ${agent.currentTask.slice(0, 60)}`
    );
  } catch {
    return null;
  }
}

export function workflowToVisual(workflow: WorkflowChoreography): ActiveWorkflowVisual {
  return {
    sourceAgentId: workflow.sourceAgentId,
    targetAgentId: workflow.targetAgentId,
    sourceZoneId: workflow.sourceZoneId,
    targetZoneId: workflow.targetZoneId,
    pathLabel: workflow.pathLabel,
    from: workflow.step.from,
    to: workflow.step.to,
  };
}

export function getLiveActionLabel(
  activity: ActivityItem[],
  currentLabel?: string | null,
  workflow?: WorkflowChoreography | null
): string | null {
  if (currentLabel) return currentLabel;
  if (workflow?.feedLabel) return workflow.feedLabel;
  const head = activity[0];
  if (!head) return null;
  const mapped = activityToWorkflow(head);
  return mapped?.feedLabel ?? head.title;
}

export function choreographyFeedDedupKey(workflow: WorkflowChoreography): string {
  return `hq-workflow-${workflow.workflowName}-${workflow.triggerId}`;
}

export function shouldConfirmFeedItem(
  activity: ActivityItem[],
  workflow: WorkflowChoreography
): boolean {
  const key = choreographyFeedDedupKey(workflow);
  return !activity.some((a) => a.id === key || a.title === workflow.feedLabel);
}

export function buildFeedConfirmationItem(workflow: WorkflowChoreography): ActivityItem {
  return {
    id: choreographyFeedDedupKey(workflow),
    type: "collab_event",
    title: workflow.feedLabel,
    summary: workflow.pathLabel,
    timestamp: new Date().toISOString(),
    agentId: workflow.sourceAgentId,
    status: "approved",
  };
}

/** Pick the next real event using priority: collab → activity head → agent → task */
export function pickNextWorkflowEvent(input: {
  messageLines: { from: AgentSlug; to: AgentSlug; priority: CollaborationPriority; id: string }[];
  activity: ActivityItem[];
  agents: HQAgent[];
  tasks: AgentTask[];
  processed: Set<string>;
  activityHeadId: string | null;
}): WorkflowChoreography | null {
  const { messageLines, activity, agents, tasks, processed, activityHeadId } = input;

  for (const line of messageLines) {
    const key = `msg:${line.id}`;
    if (processed.has(key)) continue;
    const wf = messageToWorkflow(line.from, line.to, line.id);
    if (wf) return wf;
  }

  const head = activityHeadId ? activity.find((a) => a.id === activityHeadId) : activity[0];
  if (head) {
    const key = `activity:${head.id}`;
    if (!processed.has(key)) {
      const wf = activityToWorkflow(head);
      if (wf) return wf;
    }
  }

  const attentionAgent = agents.find((agent) => {
    const key = `agent:${agent.id}:${agent.lastUpdate}`;
    return !processed.has(key) && agentEventToWorkflow(agent) !== null;
  });
  if (attentionAgent) {
    const wf = agentEventToWorkflow(attentionAgent);
    if (wf) return wf;
  }

  for (const task of tasks) {
    const key = `task:${task.id}`;
    if (processed.has(key)) continue;
    const wf = taskToWorkflow(task);
    if (wf) return wf;
  }

  return null;
}

export function getZoneHighlightIds(visual: ActiveWorkflowVisual | null): {
  source: GardenZoneId | null;
  target: GardenZoneId | null;
} {
  if (!visual) return { source: null, target: null };
  return { source: visual.sourceZoneId, target: visual.targetZoneId };
}

export function findZoneById(id: GardenZoneId) {
  return GARDEN_ZONES.find((z) => z.id === id);
}
