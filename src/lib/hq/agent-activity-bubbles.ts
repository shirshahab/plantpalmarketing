import type { ActivityItem, AgentId, HQAgent } from "@/lib/hq/types";

export interface AgentActivityBubble {
  text: string;
  priority: "low" | "medium" | "high";
  activityId: string;
}

const HIGH_PRIORITY_TYPES = new Set([
  "reply_awaiting_approval",
  "approval_needed",
  "competitor_alert",
  "ivy_alert",
  "echo_churn",
  "sage_rejection",
]);

export function buildAgentActivityBubbles(
  agents: HQAgent[],
  activity: ActivityItem[]
): Partial<Record<AgentId, AgentActivityBubble>> {
  const bubbles: Partial<Record<AgentId, AgentActivityBubble>> = {};

  for (const item of activity) {
    if (!item.agentId || bubbles[item.agentId]) continue;
    const short =
      item.summary.length > 72 ? `${item.summary.slice(0, 69)}…` : item.summary || item.title;
    bubbles[item.agentId] = {
      text: short,
      priority: item.priority ?? (HIGH_PRIORITY_TYPES.has(item.type) ? "high" : "medium"),
      activityId: item.id,
    };
  }

  for (const agent of agents) {
    if (bubbles[agent.id]) continue;
    if (agent.itemsNeedingReview > 0) {
      bubbles[agent.id] = {
        text: `${agent.itemsNeedingReview} need review`,
        priority: "high",
        activityId: `review-${agent.id}`,
      };
      continue;
    }
    if (agent.currentTask) {
      const text =
        agent.currentTask.length > 72 ? `${agent.currentTask.slice(0, 69)}…` : agent.currentTask;
      bubbles[agent.id] = {
        text,
        priority: agent.status === "needs_attention" ? "high" : "low",
        activityId: `task-${agent.id}`,
      };
    }
  }

  return bubbles;
}
