import type { AgentId } from "@/lib/hq/types";
import type { AgentSlug } from "@/lib/types";
import { slugToHqId } from "@/lib/agents/agent-slugs";
import { AGENT_WORLD_POSITIONS, type WorldPoint } from "@/lib/hq/hq-world-layout";

export type AgentMotionState = "idle" | "walking" | "working" | "handoff";

export interface AgentMotion {
  agentId: AgentId;
  position: WorldPoint;
  state: AgentMotionState;
  facing: "left" | "right";
  actionLabel?: string;
}

export interface ChoreographyStep {
  agentId: AgentId;
  from: WorldPoint;
  to: WorldPoint;
  durationMs: number;
  state: AgentMotionState;
  label: string;
  pauseMs?: number;
}

/** Scripted living-company choreography */
export const DEMO_CHOREOGRAPHY: ChoreographyStep[] = [
  {
    agentId: "creator",
    from: AGENT_WORLD_POSITIONS.creator.home,
    to: AGENT_WORLD_POSITIONS.partnerships.home,
    durationMs: 4000,
    state: "walking",
    label: "Scout delivering creator lead to Oak",
    pauseMs: 2000,
  },
  {
    agentId: "partnerships",
    from: AGENT_WORLD_POSITIONS.partnerships.home,
    to: { x: 52, y: 58 },
    durationMs: 3500,
    state: "walking",
    label: "Oak walking to Launch Gate",
    pauseMs: 1500,
  },
  {
    agentId: "approval",
    from: AGENT_WORLD_POSITIONS.approval.home,
    to: AGENT_WORLD_POSITIONS.publishing.home,
    durationMs: 2000,
    state: "handoff",
    label: "Gate approved — handing to Sprout",
    pauseMs: 2500,
  },
  {
    agentId: "creator",
    from: AGENT_WORLD_POSITIONS.partnerships.home,
    to: AGENT_WORLD_POSITIONS.creator.home,
    durationMs: 3000,
    state: "walking",
    label: "Scout returning to Talent Desk",
  },
  {
    agentId: "partnerships",
    from: { x: 52, y: 58 },
    to: AGENT_WORLD_POSITIONS.partnerships.home,
    durationMs: 3000,
    state: "walking",
    label: "Oak returning to Partnership Grove",
  },
  {
    agentId: "community",
    from: AGENT_WORLD_POSITIONS.community.home,
    to: { x: 44, y: 38 },
    durationMs: 4500,
    state: "walking",
    label: "Roots bringing community insight to Bloom",
    pauseMs: 2000,
  },
  {
    agentId: "community",
    from: { x: 44, y: 38 },
    to: AGENT_WORLD_POSITIONS.community.home,
    durationMs: 4000,
    state: "walking",
    label: "Roots returning to Listening Post",
  },
  {
    agentId: "competitor",
    from: AGENT_WORLD_POSITIONS.competitor.home,
    to: { x: 78, y: 36 },
    durationMs: 4000,
    state: "walking",
    label: "Sentinel alerting Atlas",
    pauseMs: 2000,
  },
  {
    agentId: "competitor",
    from: { x: 78, y: 36 },
    to: AGENT_WORLD_POSITIONS.competitor.home,
    durationMs: 3500,
    state: "walking",
    label: "Sentinel returning to Watchtower",
  },
];

export function buildInitialMotions(): Record<AgentId, AgentMotion> {
  const motions = {} as Record<AgentId, AgentMotion>;
  for (const [id, config] of Object.entries(AGENT_WORLD_POSITIONS)) {
    motions[id as AgentId] = {
      agentId: id as AgentId,
      position: { ...config.home },
      state: "working",
      facing: "right",
    };
  }
  return motions;
}

export function motionFromMessage(
  from: AgentSlug,
  to: AgentSlug
): { walker: AgentId; destination: WorldPoint } | null {
  const walkerId = slugToHqId(from);
  const destId = slugToHqId(to);
  const dest = AGENT_WORLD_POSITIONS[destId]?.home;
  if (!dest) return null;
  return { walker: walkerId, destination: dest };
}
