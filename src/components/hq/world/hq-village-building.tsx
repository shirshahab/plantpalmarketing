"use client";

import { motion } from "framer-motion";
import { HQBuildingArt } from "@/components/hq/world/hq-building-art";
import type { VillageBuilding } from "@/lib/hq/hq-village-layout";
import { cn } from "@/lib/utils";

export function HQVillageBuilding({
  building,
  selected,
  pendingCount = 0,
  onClick,
}: {
  building: VillageBuilding;
  selected?: boolean;
  pendingCount?: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      className="absolute z-[5] flex -translate-x-1/2 flex-col items-center focus:outline-none"
      style={{ left: building.position.x, top: building.position.y }}
      onClick={onClick}
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className={cn(
          "relative rounded-2xl bg-white/40 p-1 backdrop-blur-[1px] transition-shadow",
          selected && "ring-2 ring-brand-accent shadow-lg"
        )}
      >
        {pendingCount > 0 && (
          <span className="absolute -right-1 -top-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-accent px-1 text-[10px] font-bold text-white">
            {pendingCount}
          </span>
        )}
        <HQBuildingArt style={building.art} accent={building.accent} />
      </div>
      <p className="mt-1 max-w-[100px] text-center text-[10px] font-bold leading-tight text-brand-primary drop-shadow-sm">
        {building.name}
      </p>
      {building.agentName && (
        <p className="text-[9px] font-medium text-brand-muted">{building.agentName}</p>
      )}
    </motion.button>
  );
}
