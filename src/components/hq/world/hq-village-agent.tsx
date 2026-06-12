"use client";

import { motion } from "framer-motion";
import { AgentCharacter } from "@/components/hq/agent-character";
import { HQStatusPill, agentStatusToVillage } from "@/components/hq/world/hq-status-pill";
import type { HQAgent } from "@/lib/hq/types";
import type { VillagePoint } from "@/lib/hq/hq-village-layout";
import { cn } from "@/lib/utils";

export function HQVillageAgent({
  agent,
  position,
  selected,
  onSelect,
}: {
  agent: HQAgent;
  position: VillagePoint;
  selected?: boolean;
  onSelect: () => void;
}) {
  const status = agentStatusToVillage(agent.status);
  const working = !["idle", "finished"].includes(status);

  return (
    <motion.button
      type="button"
      className="absolute z-[12] -translate-x-1/2 -translate-y-full focus:outline-none"
      style={{ left: position.x, top: position.y }}
      onClick={onSelect}
      animate={{ left: position.x, top: position.y }}
      transition={{ type: "spring", stiffness: 60, damping: 18 }}
    >
      <div className="mb-1 flex justify-center">
        <HQStatusPill status={status} pulse={working && status === "blocked"} />
      </div>
      <motion.div
        animate={working ? { y: [0, -3, 0] } : { y: [0, -1, 0] }}
        transition={{ duration: working ? 1.2 : 2.4, repeat: Infinity, ease: "easeInOut" }}
        className={cn(selected && "drop-shadow-[0_0_8px_rgba(116,195,101,0.8)]")}
      >
        <div className="scale-[0.72] origin-bottom">
          <AgentCharacter agent={agent} floatDelay="" isActive={selected || working} />
        </div>
      </motion.div>
    </motion.button>
  );
}

/** Moss — static mascot agent at Brand Hut */
export function HQVillageMoss({
  position,
  selected,
  onSelect,
}: {
  position: VillagePoint;
  selected?: boolean;
  onSelect: () => void;
}) {
  const mossAgent: HQAgent = {
    id: "creative_director",
    name: "Moss",
    role: "Brand Guardian",
    station: "Brand Hut",
    status: "reviewing",
    currentTask: "Voice check queue",
    progress: 70,
    lastUpdate: new Date().toISOString(),
    itemsCreated: 0,
    itemsNeedingReview: 0,
    accent: "#0d9488",
    character: "sage",
  };

  return (
    <HQVillageAgent agent={mossAgent} position={position} selected={selected} onSelect={onSelect} />
  );
}
