"use client";

import { motion } from "framer-motion";
import type { VillagePoint } from "@/lib/hq/hq-village-layout";

export function HQWorkEnvelope({
  from,
  to,
  id,
}: {
  from: VillagePoint;
  to: VillagePoint;
  id: string;
}) {
  const midX = (from.x + to.x) / 2;
  const midY = Math.min(from.y, to.y) - 60;

  return (
    <motion.div
      key={id}
      className="pointer-events-none absolute z-[15] text-lg"
      initial={{ left: from.x, top: from.y, opacity: 0, scale: 0.5 }}
      animate={{
        left: [from.x, midX, to.x],
        top: [from.y, midY, to.y],
        opacity: [0, 1, 1, 0],
        scale: [0.5, 1, 1, 0.6],
        rotate: [0, -8, 8, 0],
      }}
      transition={{ duration: 2.8, ease: "easeInOut" }}
      aria-hidden
    >
      ✉️
    </motion.div>
  );
}
