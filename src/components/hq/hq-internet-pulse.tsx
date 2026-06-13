"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { InternetPulseDashboard } from "@/lib/intelligence/intelligence-engine";

const SCORE_COLORS: Record<string, string> = {
  Low: "bg-slate-100 text-slate-700",
  Medium: "bg-sky-100 text-sky-800",
  High: "bg-amber-100 text-amber-900",
  "Very High": "bg-emerald-100 text-emerald-900",
};

export function HQInternetPulse({ dashboard }: { dashboard: InternetPulseDashboard | null }) {
  if (!dashboard?.hasRealData) {
    return (
      <Link
        href="/admin/f5bot-test"
        className="mb-3 block rounded-2xl border border-dashed border-[#74c365]/50 bg-[#f0fdf4]/80 px-4 py-3 text-sm text-brand-primary hover:bg-[#dcfce7]"
      >
        🌱 <strong>Internet Pulse</strong> — ingest F5Bot alerts to see live plant-owner conversations
      </Link>
    );
  }

  const { pulse, score, agentCounts, lastRunAt } = dashboard;
  const updatedLabel = pulse.lastUpdatedAt
    ? formatDistanceToNow(new Date(pulse.lastUpdatedAt), { addSuffix: true })
    : lastRunAt
      ? formatDistanceToNow(new Date(lastRunAt), { addSuffix: true })
      : "just now";

  return (
    <Link
      href="/intelligence"
      className="mb-3 block rounded-2xl border border-[#74c365]/40 bg-gradient-to-br from-[#f0fdf4] to-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-heading text-sm font-bold text-[#2d6a4f]">🌱 Internet Pulse</p>
          <p className="text-[10px] text-brand-muted">Live from F5Bot · tap to explore</p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${SCORE_COLORS[score] ?? SCORE_COLORS.Low}`}>
          HQ Score: {score}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
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
