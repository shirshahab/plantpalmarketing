"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { AgentActivityBubble } from "@/lib/hq/agent-activity-bubbles";

export function HQActivityBubble({
  bubble,
  visible,
}: {
  bubble: AgentActivityBubble | null | undefined;
  visible: boolean;
}) {
  if (!bubble) return null;

  const priorityStyles = {
    high: "border-rose-200 bg-rose-50 text-rose-900 ring-rose-100",
    medium: "border-amber-200 bg-amber-50 text-amber-900 ring-amber-100",
    low: "border-white/80 bg-white/95 text-brand-primary ring-brand-border/40",
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={bubble.activityId}
          initial={{ opacity: 0, y: 6, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className={cn(
            "pointer-events-none absolute -top-2 left-1/2 z-30 max-w-[10rem] -translate-x-1/2 -translate-y-full rounded-2xl border px-2.5 py-1.5 text-center text-[8px] font-medium leading-snug shadow-md ring-1 sm:max-w-[12rem] sm:text-[9px]",
            priorityStyles[bubble.priority]
          )}
        >
          <span className="line-clamp-2">{bubble.text}</span>
          <span
            className="absolute -bottom-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r bg-inherit"
            style={{ borderColor: "inherit" }}
            aria-hidden
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
