"use client";

import { useMemo } from "react";
import { Radio } from "lucide-react";
import type { ActivityItem } from "@/lib/hq/types";

/**
 * Phase 34 — live activity ticker. One horizontal line, auto-scrolls,
 * pauses on hover. Replaces the giant speech bubbles as the place where
 * agent actions are narrated.
 */
export function HQActivityTicker({
  activity,
  onSelectActivity,
}: {
  activity: ActivityItem[];
  onSelectActivity: (id: string) => void;
}) {
  const items = useMemo(
    () =>
      (Array.isArray(activity) ? activity : [])
        .filter((a) => a && a.id && a.title)
        .slice(0, 14),
    [activity]
  );

  if (items.length === 0) {
    return (
      <div className="flex h-9 items-center gap-2 overflow-hidden rounded-full border border-brand-border/60 bg-white px-3 shadow-sm">
        <Radio className="h-3.5 w-3.5 shrink-0 text-brand-accent" />
        <p className="truncate text-[11px] text-brand-muted">
          Quiet for now — agent activity will stream here live.
        </p>
      </div>
    );
  }

  // Track is duplicated so the -50% translate loops seamlessly.
  const track = [...items, ...items];

  return (
    <div className="flex h-9 items-center overflow-hidden rounded-full border border-brand-border/60 bg-white shadow-sm">
      <span className="flex h-full shrink-0 items-center gap-1.5 rounded-l-full bg-brand-primary px-3 text-[10px] font-bold uppercase tracking-wide text-white">
        <Radio className="h-3 w-3" />
        Live
      </span>
      <div className="relative h-full flex-1 overflow-hidden">
        <div className="hq-ticker-track flex h-full w-max items-center">
          {track.map((item, i) => (
            <button
              key={`${item.id}-${i}`}
              type="button"
              onClick={() => onSelectActivity(item.id)}
              className="flex h-full shrink-0 items-center gap-2 px-4 text-[11px] font-medium text-brand-primary transition hover:text-brand-accent"
            >
              {item.status === "pending" && (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              )}
              <span className="whitespace-nowrap">{item.title}</span>
              <span className="text-brand-border">•</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
