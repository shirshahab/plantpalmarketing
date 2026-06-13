"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, GripHorizontal, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { PlantyAvatar } from "@/components/planty/planty-avatar";
import type { InternetPulseDashboard } from "@/lib/intelligence/intelligence-engine";

const SCORE_COLORS: Record<string, string> = {
  Low: "bg-slate-100 text-slate-700",
  Medium: "bg-sky-100 text-sky-800",
  High: "bg-amber-100 text-amber-900",
  "Very High": "bg-emerald-100 text-emerald-900",
};

const EXPANDED_KEY = "plantpal-pulse-expanded";
const SIZE_KEY = "plantpal-pulse-width";

function alertCount(dashboard: InternetPulseDashboard): number {
  const { pulse, agentCounts } = dashboard;
  const agentTotal = agentCounts.reduce((s, a) => s + a.count, 0);
  return (
    pulse.newDiscussions +
    pulse.contentOpportunities +
    pulse.seoOpportunities +
    pulse.competitorMentions +
    agentTotal
  );
}

/** Floating badge + collapsible drawer. Village map stays fully interactive underneath. */
export function HQInternetPulse({ dashboard }: { dashboard: InternetPulseDashboard | null }) {
  const [expanded, setExpanded] = useState(false);
  const [width, setWidth] = useState(320);
  const [dragY, setDragY] = useState(0);
  const dragging = useRef(false);
  const startY = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(EXPANDED_KEY);
      if (stored === "true") setExpanded(true);
      const w = localStorage.getItem(SIZE_KEY);
      if (w) setWidth(Math.min(420, Math.max(260, Number(w))));
    } catch {
      /* ignore */
    }
  }, []);

  const setExpandedPersist = useCallback((value: boolean) => {
    setExpanded(value);
    try {
      localStorage.setItem(EXPANDED_KEY, String(value));
    } catch {
      /* ignore */
    }
  }, []);

  const collapse = useCallback(() => {
    setExpandedPersist(false);
    setDragY(0);
  }, [setExpandedPersist]);

  const onTouchStart = (e: React.TouchEvent) => {
    dragging.current = true;
    startY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current || !expanded) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) setDragY(delta);
  };

  const onTouchEnd = () => {
    dragging.current = false;
    if (dragY > 60) collapse();
    setDragY(0);
  };

  const onResizeEnd = () => {
    if (panelRef.current) {
      const w = panelRef.current.offsetWidth;
      setWidth(w);
      try {
        localStorage.setItem(SIZE_KEY, String(w));
      } catch {
        /* ignore */
      }
    }
  };

  if (!dashboard?.hasRealData) {
    return (
      <div className="pointer-events-auto fixed bottom-4 right-4 z-40 max-w-[calc(100vw-2rem)]">
        <Link
          href="/admin/f5bot-test"
          className="flex items-center gap-2 rounded-full border border-dashed border-[#74c365]/50 bg-[#f0fdf4]/95 px-3 py-2 text-xs shadow-md backdrop-blur-sm"
        >
          <PlantyAvatar size="sm" className="!h-8 !w-8 shrink-0" />
          <span className="font-medium text-[#2d6a4f]">Internet Pulse · Connect F5Bot</span>
        </Link>
      </div>
    );
  }

  const { pulse, score, agentCounts, lastRunAt } = dashboard;
  const totalAlerts = alertCount(dashboard);
  const updatedLabel = pulse.lastUpdatedAt
    ? formatDistanceToNow(new Date(pulse.lastUpdatedAt), { addSuffix: true })
    : lastRunAt
      ? formatDistanceToNow(new Date(lastRunAt), { addSuffix: true })
      : "just now";

  if (!expanded) {
    return (
      <div className="pointer-events-auto fixed bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={() => setExpandedPersist(true)}
          className="flex items-center gap-2 rounded-full border border-[#74c365]/50 bg-[#f0fdf4]/95 px-3 py-2 shadow-lg backdrop-blur-md transition hover:scale-[1.02] hover:shadow-xl"
          aria-expanded={false}
        >
          <span className="text-base" aria-hidden>
            🔥
          </span>
          <span className="text-xs font-bold text-[#2d6a4f]">Internet Pulse</span>
          <span className="rounded-full bg-brand-primary px-2 py-0.5 text-[10px] font-bold text-white tabular-nums">
            {totalAlerts}
          </span>
          <span className={`hidden rounded-full px-1.5 py-0.5 text-[9px] font-bold sm:inline ${SCORE_COLORS[score] ?? SCORE_COLORS.Low}`}>
            {score}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-brand-muted" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-40 max-w-[calc(100vw-1rem)]"
      style={dragY ? { transform: `translateY(${dragY}px)` } : undefined}
    >
      <div
        ref={panelRef}
        className="pointer-events-auto overflow-hidden rounded-2xl border border-[#74c365]/40 bg-[#f0fdf4]/98 shadow-2xl backdrop-blur-md resize-x"
        style={{ width: `${width}px`, minWidth: 260, maxWidth: "min(420px, calc(100vw - 1rem))", maxHeight: "min(70vh, 480px)" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseUp={onResizeEnd}
      >
        <div className="flex cursor-grab items-center justify-between gap-2 border-b border-[#74c365]/20 bg-white/50 px-3 py-2 active:cursor-grabbing">
          <div className="flex items-center gap-1.5">
            <GripHorizontal className="h-4 w-4 text-brand-muted" aria-hidden />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">Drag to move</span>
          </div>
          <button
            type="button"
            onClick={collapse}
            className="rounded-lg p-1 text-brand-muted hover:bg-white/80"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-start justify-between gap-2 p-3">
          <Link href="/intelligence" className="flex min-w-0 flex-1 items-center gap-2">
            <PlantyAvatar size="sm" className="shrink-0 !h-10 !w-10" />
            <div className="min-w-0">
              <p className="font-heading text-sm font-bold text-[#2d6a4f]">🔥 Internet Pulse</p>
              <p className="text-[10px] text-brand-muted">{totalAlerts} alerts · {updatedLabel}</p>
            </div>
          </Link>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${SCORE_COLORS[score] ?? SCORE_COLORS.Low}`}>
            {score}
          </span>
        </div>

        <Link href="/intelligence" className="block px-3 pb-3">
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            <PulseStat label="Discussions" value={pulse.newDiscussions} />
            <PulseStat label="Content" value={pulse.contentOpportunities} />
            <PulseStat label="SEO" value={pulse.seoOpportunities} />
            <PulseStat label="Competitors" value={pulse.competitorMentions} />
            <PulseStat label="Creators" value={pulse.creatorOpportunities} />
          </div>

          {pulse.trendingTopics.length > 0 && (
            <div className="mt-2">
              <p className="text-[9px] font-semibold uppercase text-brand-muted">Trending</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {pulse.trendingTopics.slice(0, 3).map((topic) => (
                  <span key={topic} className="rounded bg-white/80 px-1.5 py-0.5 text-[9px] font-medium text-brand-primary">
                    {topic.slice(0, 36)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {agentCounts.some((a) => a.count > 0) && (
            <div className="mt-2 border-t border-[#74c365]/20 pt-2">
              {agentCounts
                .filter((a) => a.count > 0)
                .slice(0, 4)
                .map((a) => (
                  <p key={a.agent} className="text-[9px] text-brand-primary">
                    <span className="font-semibold capitalize">{a.label}</span>: {a.count}
                  </p>
                ))}
            </div>
          )}
        </Link>

        <button
          type="button"
          onClick={collapse}
          className="w-full border-t border-[#74c365]/20 py-2 text-[10px] font-medium text-brand-muted hover:bg-white/40"
        >
          Minimize
        </button>
      </div>
    </div>
  );
}

function PulseStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white/70 px-2 py-1 text-center">
      <p className="text-base font-bold tabular-nums text-[#2d6a4f]">{value}</p>
      <p className="text-[8px] font-medium text-brand-muted">{label}</p>
    </div>
  );
}
