"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PLANTY_VOICE_EXAMPLES } from "@/lib/planty/planty-content";
import { PLANTY_WAYPOINTS, type VillagePoint } from "@/lib/hq/hq-village-layout";
import { PlantyAvatar } from "@/components/planty/planty-avatar";
import type { ActivityItem } from "@/lib/hq/types";

function pickLine(activity: ActivityItem[], pendingCount: number, unreadMessages: number): string {
  if (pendingCount > 0) {
    return `${pendingCount} approval${pendingCount === 1 ? "" : "s"} waiting. Planty is concerned.`;
  }
  if (unreadMessages > 0) {
    return `${unreadMessages} agent message${unreadMessages === 1 ? "" : "s"} need a look.`;
  }
  const scout = activity.find((a) => a.title.toLowerCase().includes("scout") || a.title.toLowerCase().includes("creator"));
  if (scout) return "Scout found another plant weirdo on TikTok.";
  const basil = PLANTY_VOICE_EXAMPLES[Math.floor(Math.random() * PLANTY_VOICE_EXAMPLES.length)];
  return basil ?? "Your basil has concerns.";
}

export function HQPlantyWanderer({
  activity,
  pendingApprovals,
  unreadMessages = 0,
}: {
  activity: ActivityItem[];
  pendingApprovals: number;
  unreadMessages?: number;
}) {
  const [position, setPosition] = useState<VillagePoint>(PLANTY_WAYPOINTS[0]);
  const [dialogue, setDialogue] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPosition((prev) => {
        const currentIdx = PLANTY_WAYPOINTS.findIndex((p) => p.x === prev.x && p.y === prev.y);
        const next = (currentIdx + 1) % PLANTY_WAYPOINTS.length;
        return PLANTY_WAYPOINTS[next];
      });
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = useCallback(() => {
    setDialogue(pickLine(activity, pendingApprovals, unreadMessages));
    setTimeout(() => setDialogue(null), 4000);
  }, [activity, pendingApprovals, unreadMessages]);

  return (
    <motion.button
      type="button"
      className="absolute z-[14] -translate-x-1/2 -translate-y-1/2 focus:outline-none"
      animate={{ left: position.x, top: position.y }}
      transition={{ type: "spring", stiffness: 40, damping: 20, duration: 2 }}
      onClick={handleClick}
      whileHover={{ scale: 1.08 }}
      aria-label="Planty mascot"
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="flex flex-col items-center"
      >
        <PlantyAvatar size="sm" showLabel />
        <AnimatePresence>
          {dialogue && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute -top-16 left-1/2 z-20 w-44 max-w-[70vw] -translate-x-1/2 rounded-xl border border-[#74c365]/40 bg-white px-2.5 py-1.5 text-center text-[10px] font-medium text-brand-primary shadow-lg"
            >
              {dialogue}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.button>
  );
}
