"use client";

import { motion } from "framer-motion";
import type { GardenZone } from "@/lib/hq/hq-world-layout";

export function HQGardenZone({ zone, agentCount }: { zone: GardenZone; agentCount: number }) {
  return (
    <motion.div
      className="pointer-events-none absolute z-[2]"
      style={{
        left: `${zone.center.x - zone.width / 2}%`,
        top: `${zone.center.y - zone.height / 2}%`,
        width: `${zone.width}%`,
        height: `${zone.height}%`,
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.1 }}
    >
      <div
        className="flex h-full flex-col items-center justify-center rounded-3xl border-2 border-dashed px-2 py-1 text-center backdrop-blur-[1px]"
        style={{ borderColor: `${zone.accent}44`, backgroundColor: `${zone.color}88` }}
      >
        <p className="font-heading text-[10px] font-bold leading-tight sm:text-xs" style={{ color: zone.accent }}>
          {zone.name}
        </p>
        <p className="text-[8px] text-brand-muted sm:text-[10px]">{zone.subtitle}</p>
        {agentCount > 0 && (
          <span
            className="mt-1 rounded-full px-1.5 py-0.5 text-[8px] font-medium text-white"
            style={{ backgroundColor: zone.accent }}
          >
            {agentCount} active
          </span>
        )}
      </div>
    </motion.div>
  );
}
