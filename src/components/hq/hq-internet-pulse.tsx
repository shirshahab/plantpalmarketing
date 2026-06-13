"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Minimize2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { PlantyAvatar } from "@/components/planty/planty-avatar";
import type { InternetPulseDashboard } from "@/lib/intelligence/intelligence-engine";

const SCORE_COLORS: Record<string, string> = {
  Low: "bg-slate-100 text-slate-700",
  Medium: "bg-sky-100 text-sky-800",
  High: "bg-amber-100 text-amber-900",
  "Very High": "bg-emerald-100 text-emerald-900",
};

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

/** Collapsible on mobile so the village map stays visible and clickable. */
export function HQInternetPulse({ dashboard }: { dashboard: InternetPulseDashboard | null }) {
  const [expanded, setExpanded] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startY = useRef(0);
  const dragging = useRef(false);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 640) setExpanded(true);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const collapse = useCallback(() => {
    setExpanded(false);
    setDragY(0);
  }, []);

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
    if (dragY > 80) collapse();
    setDragY(0);
  };

  if (!dashboard?.hasRealData) {
    return (
      <Link
        href="/admin/f5bot-test"
        className="pointer-events-auto rounded-2xl border border-dashed border-[#74c365]/50 bg-[#f0fdf4]/90 px-3 py-2 text-xs text-brand-primary backdrop-blur-sm sm:px-4 sm:py-3 sm:text-sm"
      >
        <span className="flex items-center gap-2">
          <PlantyAvatar size="sm" className="!h-10 !w-10 shrink-0" />
          <span>
            <strong>Internet Pulse</strong>. Ingest F5Bot alerts to see live conversations.
          </span>
        </span>
      </Link>
    );
  }

  const { pulse, score, agentCounts, lastRunAt } = dashboard;
  const totalAlerts = alertCount(dashboard);
  const updatedLabel = pulse.lastUpdatedAt
    ? formatDistanceToNow(new Date(pulse.lastUpdatedAt), { addSuffix: true })
    : lastRunAt
      ? formatDistanceToNow(new Date(lastRunAt), { addSuffix: true })
      : "just now";

  const showFull = expanded || !isMobile;

  return (
    <div
      className="pointer-events-auto max-w-full sm:max-w-none"
      style={dragY ? { transform: `translateY(${dragY}px)` } : undefined}
    >
      {/* Collapsed bar (mobile default) */}
      {!showFull && (
        <div className="flex items-center gap-2 rounded-2xl border border-[#74c365]/40 bg-[#f0fdf4]/95 px-3 py-2 shadow-sm backdrop-blur-sm">
          <PlantyAvatar size="sm" className="!h-9 !w-9 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-[#2d6a4f]">Internet Pulse</p>
            <p className="text-[10px] text-brand-muted">{totalAlerts} alerts · updated {updatedLabel}</p>
          </div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${SCORE_COLORS[score] ?? SCORE_COLORS.Low}`}>
            {score}
          </span>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex shrink-0 items-center gap-0.5 rounded-lg bg-brand-primary px-2 py-1 text-[10px] font-semibold text-white"
            aria-expanded={false}
          >
            Expand
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Expanded drawer */}
      {showFull && (
        <div
          className="rounded-2xl border border-[#74c365]/40 bg-[#f0fdf4]/95 shadow-lg backdrop-blur-sm sm:bg-gradient-to-br sm:from-[#f0fdf4] sm:to-white"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="flex items-center justify-center pt-2 sm:hidden">
            <div className="h-1 w-10 rounded-full bg-[#74c365]/40" aria-hidden />
          </div>

          <div className="flex items-start justify-between gap-2 p-3 sm:p-4">
            <Link href="/intelligence" className="flex min-w-0 flex-1 items-center gap-2">
              <PlantyAvatar size="sm" className="shrink-0" />
              <div className="min-w-0">
                <p className="font-heading text-sm font-bold text-[#2d6a4f]">Internet Pulse</p>
                <p className="text-[10px] text-brand-muted">Live from F5Bot</p>
              </div>
            </Link>
            <div className="flex shrink-0 items-center gap-1">
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${SCORE_COLORS[score] ?? SCORE_COLORS.Low}`}>
                HQ Score: {score}
              </span>
              {isMobile && (
                <button
                  type="button"
                  onClick={collapse}
                  className="rounded-lg p-1 text-brand-muted hover:bg-white/60"
                  aria-label="Minimize"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <Link href="/intelligence" className="block px-3 pb-3 sm:px-4 sm:pb-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <PulseStat label="New Discussions" value={pulse.newDiscussions} />
              <PulseStat label="Content" value={pulse.contentOpportunities} />
              <PulseStat label="SEO" value={pulse.seoOpportunities} />
              <PulseStat label="Competitors" value={pulse.competitorMentions} />
              <PulseStat label="Creators" value={pulse.creatorOpportunities} />
            </div>

            {pulse.trendingTopics.length > 0 && (
              <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">Trending topics</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {pulse.trendingTopics.slice(0, 4).map((topic) => (
                    <span
                      key={topic}
                      className="rounded-md bg-white/80 px-2 py-0.5 text-[10px] font-medium text-brand-primary shadow-sm"
                    >
                      {topic.slice(0, 48)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-[#74c365]/20 pt-2">
              {agentCounts
                .filter((a) => a.count > 0)
                .map((a) => (
                  <span key={a.agent} className="text-[10px] text-brand-primary">
                    <span className="font-semibold capitalize">{a.label}</span>: {a.count} waiting
                  </span>
                ))}
            </div>

            <p className="mt-2 text-[10px] text-brand-muted">Last updated {updatedLabel}</p>
          </Link>

          {isMobile && (
            <button
              type="button"
              onClick={collapse}
              className="flex w-full items-center justify-center gap-1 border-t border-[#74c365]/20 py-2 text-[11px] font-medium text-brand-muted"
            >
              <ChevronUp className="h-3.5 w-3.5" /> Swipe down or tap to collapse
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PulseStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white/70 px-2 py-1.5 text-center shadow-sm">
      <p className="text-lg font-bold tabular-nums text-[#2d6a4f]">{value}</p>
      <p className="text-[9px] font-medium text-brand-muted">{label}</p>
    </div>
  );
}
