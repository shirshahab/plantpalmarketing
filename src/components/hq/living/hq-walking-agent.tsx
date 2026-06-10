"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AgentCharacter } from "@/components/hq/agent-character";
import { HQRichHoverCard } from "@/components/hq/living/hq-rich-hover-card";
import { getPersonality } from "@/lib/hq/agent-personalities";
import type { HQAgent } from "@/lib/hq/types";
import type { AgentMotion } from "@/lib/hq/hq-movement-choreography";
import { cn } from "@/lib/utils";

export function HQWalkingAgent({
  agent,
  motion: agentMotion,
  isSelected,
  onSelect,
}: {
  agent: HQAgent;
  motion: AgentMotion;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const personality = getPersonality(agent.id);
  const working = agentMotion.state === "working";
  const handoff = agentMotion.state === "handoff";
  const walking = agentMotion.state === "walking";
  const bubbleLabel =
    agentMotion.actionLabel ??
    (handoff ? personality.handoffQuip : walking ? personality.walkQuip : working ? personality.workingQuip : null);

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

        {(walking || handoff) && bubbleLabel && (
          <motion.div
            className={cn(
              "absolute -top-7 left-1/2 z-20 max-w-[9rem] -translate-x-1/2 rounded-2xl px-2 py-1 text-center text-[8px] font-medium shadow-sm sm:max-w-[11rem] sm:text-[9px]",
              handoff ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200" : "bg-white/90 text-brand-primary"
            )}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {bubbleLabel}
          </motion.div>
        )}

        {(agent.unreadMessages ?? 0) > 0 && (
          <span className="absolute -right-1 -top-1 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-[8px] font-bold text-white">
            {agent.unreadMessages}
          </span>
        )}

        <motion.div
          animate={
            walking || handoff
              ? { y: [0, -3, 0], rotate: agentMotion.facing === "left" ? [0, -2, 0] : [0, 2, 0] }
              : working
                ? { y: [0, -2, 0] }
                : { y: 0 }
          }
          transition={{
            duration: walking || handoff ? 0.4 : 2,
            repeat: walking || handoff || working ? Infinity : 0,
            ease: "easeInOut",
          }}
          className={cn(
            "rounded-2xl border-2 bg-white/90 p-0.5 shadow-lg backdrop-blur-sm transition-shadow",
            isSelected && "ring-2 ring-brand-accent shadow-xl",
            walking && "border-sky-300/60",
            handoff && "border-amber-300/80 ring-2 ring-amber-200/50"
          )}
          style={{ borderColor: isSelected ? agent.accent : `${agent.accent}55` }}
        >
          <div style={{ transform: agentMotion.facing === "left" ? "scaleX(-1)" : undefined }}>
            <AgentCharacter agent={agent} floatDelay="" isActive={isSelected || walking} />
          </div>
        </motion.div>

        <p className="mt-1 text-center text-[9px] font-bold text-brand-primary drop-shadow-sm">{agent.name}</p>
      </div>
    </motion.button>
  );
}
