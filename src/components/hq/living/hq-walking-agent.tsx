"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AgentCharacter } from "@/components/hq/agent-character";
import { HQRichHoverCard } from "@/components/hq/living/hq-rich-hover-card";
import { HQActivityBubble } from "@/components/hq/living/hq-activity-bubble";
import { getPersonality } from "@/lib/hq/agent-personalities";
import type { AgentActivityBubble } from "@/lib/hq/agent-activity-bubbles";
import type { HQAgent } from "@/lib/hq/types";
import type { AgentMotion } from "@/lib/hq/hq-movement-choreography";
import { cn } from "@/lib/utils";

function idleAnimation(variant: AgentMotion["idleVariant"], facing: AgentMotion["facing"]) {
  switch (variant) {
    case "bounce":
      return { y: [0, -4, 0], scale: [1, 1.04, 1] };
    case "water":
      return { y: [0, -2, 0], rotate: facing === "left" ? [-4, 4, -4] : [4, -4, 4] };
    case "glance":
      return { x: [0, facing === "left" ? -2 : 2, 0], y: [0, -1, 0] };
    case "read":
      return { y: [0, -1, 0], scale: [1, 1.02, 1] };
    case "micro_loop":
      return { y: [0, -2, 0] };
    case "desk":
    default:
      return { y: [0, -2, 0], scale: [1, 1.02, 1] };
  }
}

export function HQWalkingAgent({
  agent,
  motion: agentMotion,
  isSelected,
  onSelect,
  activityBubble,
}: {
  agent: HQAgent;
  motion: AgentMotion;
  isSelected: boolean;
  onSelect: () => void;
  activityBubble?: AgentActivityBubble | null;
}) {
  const [hovered, setHovered] = useState(false);
  const personality = getPersonality(agent.id);
  const working = agentMotion.state === "working";
  const handoff = agentMotion.state === "handoff";
  const walking = agentMotion.state === "walking";
  const idle = agentMotion.state === "idle";
  const motionBubble =
    agentMotion.actionLabel ??
    (handoff ? personality.handoffQuip : walking ? personality.walkQuip : working ? personality.workingQuip : null);
  const showMotionBubble = (walking || handoff) && motionBubble;
  const showActivityBubble = !showMotionBubble && activityBubble && !hovered;

  const bodyAnimation =
    walking || handoff
      ? { y: [0, -3, 0], rotate: agentMotion.facing === "left" ? [0, -2, 0] : [0, 2, 0] }
      : idle || working
        ? idleAnimation(agentMotion.idleVariant ?? "desk", agentMotion.facing)
        : { y: 0 };

  const bodyDuration = walking || handoff ? 0.4 : agentMotion.idleVariant === "bounce" ? 1.8 : 2.6;

  return (
    <motion.button
      type="button"
      className="absolute z-[10] -translate-x-1/2 -translate-y-1/2 focus:outline-none"
      style={{
        left: `${agentMotion.position.x}%`,
        top: `${agentMotion.position.y}%`,
      }}
      animate={{
        left: `${agentMotion.position.x}%`,
        top: `${agentMotion.position.y}%`,
      }}
      transition={{ type: "spring", stiffness: 80, damping: 20 }}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative">
        <HQRichHoverCard agent={agent} visible={hovered && !isSelected} />
        <HQActivityBubble bubble={activityBubble ?? null} visible={!!showActivityBubble} />

        {showMotionBubble && (
          <motion.div
            className={cn(
              "absolute -top-7 left-1/2 z-20 max-w-[9rem] -translate-x-1/2 rounded-2xl px-2 py-1 text-center text-[8px] font-medium shadow-sm sm:max-w-[11rem] sm:text-[9px]",
              handoff ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200" : "bg-white/90 text-brand-primary"
            )}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {motionBubble}
          </motion.div>
        )}

        {(agent.unreadMessages ?? 0) > 0 && (
          <span className="absolute -right-1 -top-1 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-[8px] font-bold text-white">
            {agent.unreadMessages}
          </span>
        )}

        <motion.div
          animate={bodyAnimation}
          transition={{
            duration: bodyDuration,
            repeat: walking || handoff || idle || working ? Infinity : 0,
            ease: "easeInOut",
          }}
          className={cn(
            "rounded-2xl border-2 bg-white/90 p-0.5 shadow-lg backdrop-blur-sm transition-shadow",
            isSelected && "ring-2 ring-brand-accent shadow-xl",
            walking && "border-sky-300/60",
            handoff && "border-amber-300/80 ring-2 ring-amber-200/50",
            idle && agentMotion.idleVariant === "water" && "border-sky-200/50"
          )}
          style={{ borderColor: isSelected ? agent.accent : `${agent.accent}55` }}
        >
          <div style={{ transform: agentMotion.facing === "left" ? "scaleX(-1)" : undefined }}>
            <AgentCharacter agent={agent} floatDelay="" isActive={isSelected || walking || handoff} />
          </div>
        </motion.div>

        <p className="mt-1 text-center text-[9px] font-bold text-brand-primary drop-shadow-sm">{agent.name}</p>
      </div>
    </motion.button>
  );
}
