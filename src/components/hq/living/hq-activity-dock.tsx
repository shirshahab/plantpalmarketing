"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { ActivityItem } from "@/lib/hq/types";

/** Malformed timestamps must never crash the dock (RangeError on mobile). */
function safeTimeAgo(timestamp: unknown): string {
  if (typeof timestamp !== "string" && typeof timestamp !== "number") return "just now";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "just now";
  try {
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return "just now";
  }
}

export function HQActivityDock({
  items,
  onSelect,
  onApprove,
  onReject,
}: {
  items: ActivityItem[];
  onSelect: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const safeItems = (Array.isArray(items) ? items : []).filter(
    (i): i is ActivityItem => Boolean(i && typeof i === "object" && i.id)
  );
  const recent = safeItems.slice(0, 8);
  const urgent = safeItems.filter(
    (i) => i?.status === "pending" || i?.type === "reply_awaiting_approval"
  ).length;

  return (
    <div className="pointer-events-none absolute bottom-14 right-2 z-40 sm:bottom-16 sm:right-4">
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            "flex items-center gap-2 rounded-2xl border border-white/60 bg-white/90 px-3 py-2 text-xs font-semibold text-brand-primary shadow-lg backdrop-blur-md transition hover:bg-white",
            urgent > 0 && "ring-2 ring-amber-300/60"
          )}
        >
          <Activity className="h-4 w-4 text-brand-accent" />
          <span>HQ Pulse</span>
          {urgent > 0 && (
            <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {urgent}
            </span>
          )}
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="w-[min(92vw,20rem)] overflow-hidden rounded-2xl border border-white/50 bg-white/92 shadow-2xl backdrop-blur-xl"
            >
              <div className="border-b border-brand-border/30 px-3 py-2">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold text-brand-primary">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  Live company activity
                </p>
              </div>
              <ul className="max-h-[40dvh] overflow-y-auto p-1.5">
                {recent.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(item.id)}
                      className="w-full rounded-xl px-2.5 py-2 text-left transition hover:bg-brand-bg/80"
                    >
                      <p className="text-[11px] font-medium leading-snug text-brand-primary line-clamp-2">
                        {item.title || "Agent activity"}
                      </p>
                      <p className="mt-0.5 text-[9px] text-brand-muted">{safeTimeAgo(item.timestamp)}</p>
                      {item.status === "pending" && onApprove && onReject && (
                        <div className="mt-1.5 flex gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onApprove(item.id);
                            }}
                            className="rounded-lg bg-brand-primary px-2 py-0.5 text-[9px] font-semibold text-white"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onReject(item.id);
                            }}
                            className="rounded-lg border border-brand-border px-2 py-0.5 text-[9px] font-medium text-brand-muted"
                          >
                            Pass
                          </button>
                        </div>
                      )}
                    </button>
                  </li>
                ))}
                {recent.length === 0 && (
                  <li className="px-3 py-4 text-center text-[11px] text-brand-muted">
                    No pulse data yet. Agents will report here after their next run.
                  </li>
                )}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
