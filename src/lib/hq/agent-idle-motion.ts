import type { AgentId } from "@/lib/hq/types";
import type { AgentMotion, IdleVariant } from "@/lib/hq/hq-movement-choreography";
import { AGENT_WORLD_POSITIONS, type WorldPoint } from "@/lib/hq/hq-world-layout";

const IDLE_VARIANTS: IdleVariant[] = ["desk", "glance", "micro_loop", "bounce", "water", "read"];

const AGENT_IDLE_BIAS: Partial<Record<AgentId, IdleVariant[]>> = {
  creator: ["glance", "micro_loop", "bounce"],
  community: ["read", "desk", "glance"],
  content: ["desk", "bounce", "water"],
  creative_director: ["read", "desk", "glance"],
  publishing: ["desk", "micro_loop", "bounce"],
  partnerships: ["read", "desk", "glance"],
  competitor: ["glance", "read", "desk"],
  growth: ["read", "desk", "micro_loop"],
  acquisition: ["glance", "micro_loop", "desk"],
  customer_voice: ["read", "glance", "desk"],
  approval: ["desk", "read", "glance"],
  chief_of_staff: ["read", "desk", "glance"],
};

function pickIdleVariant(agentId: AgentId): IdleVariant {
  const bias = AGENT_IDLE_BIAS[agentId] ?? IDLE_VARIANTS;
  return bias[Math.floor(Math.random() * bias.length)] ?? "desk";
}

function microLoopOffset(home: WorldPoint, agentId: AgentId, t: number): WorldPoint {
  const seed = agentId.charCodeAt(0) + agentId.length;
  const angle = t * 0.8 + seed;
  return {
    x: home.x + Math.cos(angle) * 1.2,
    y: home.y + Math.sin(angle) * 0.8,
  };
}

export function applyIdleTick(
  motions: Record<AgentId, AgentMotion>,
  activeWalkerId: AgentId | null,
  tick: number
): Record<AgentId, AgentMotion> {
  const next = { ...motions };

  for (const [id, config] of Object.entries(AGENT_WORLD_POSITIONS)) {
    const agentId = id as AgentId;
    const motion = next[agentId];
    if (!motion || agentId === activeWalkerId) continue;
    if (motion.state === "walking" || motion.state === "handoff") continue;

    const home = config.home;
    const variant = motion.idleVariant ?? pickIdleVariant(agentId);

    if (variant === "micro_loop") {
      next[agentId] = {
        ...motion,
        state: "idle",
        idleVariant: variant,
        position: microLoopOffset(home, agentId, tick),
        facing: tick % 2 === 0 ? "right" : "left",
      };
    } else {
      next[agentId] = {
        ...motion,
        state: variant === "desk" || variant === "read" ? "working" : "idle",
        idleVariant: variant,
        position: { ...home },
        facing: motion.facing,
      };
    }
  }

  return next;
}

export function resetAgentToStation(motions: Record<AgentId, AgentMotion>, agentId: AgentId): Record<AgentId, AgentMotion> {
  const home = AGENT_WORLD_POSITIONS[agentId]?.home;
  if (!home) return motions;
  return {
    ...motions,
    [agentId]: {
      ...motions[agentId],
      position: { ...home },
      state: "working",
      idleVariant: "desk",
      actionLabel: undefined,
    },
  };
}
