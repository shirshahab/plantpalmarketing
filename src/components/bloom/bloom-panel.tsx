"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3, Calendar, Flower2, Library, ListOrdered, Loader2, Play, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { ContentCalendar } from "@/components/bloom/content-calendar";
import { ContentLibrary } from "@/components/bloom/content-library";
import { DraftQueue } from "@/components/bloom/draft-queue";
import { PerformanceTracker } from "@/components/bloom/performance-tracker";
import { runBloomProduction } from "@/lib/actions/bloom-agent";
import { TOTAL_DAILY_PIECES } from "@/lib/agents/bloom/run-bloom-agent";
import type {
  BloomContentPerformance,
  BloomContentPiece,
  BloomProductionRun,
} from "@/lib/types";

type Tab = "calendar" | "library" | "queue" | "performance";

const TABS: { id: Tab; label: string; icon: typeof Calendar }[] = [
  { id: "calendar", label: "Content Calendar", icon: Calendar },
  { id: "library", label: "Content Library", icon: Library },
  { id: "queue", label: "Human Draft Queue", icon: ListOrdered },
  { id: "performance", label: "Performance", icon: BarChart3 },
];

const DAILY_BREAKDOWN = [
  { label: "X posts", count: 10 },
  { label: "Threads", count: 5 },
  { label: "TikTok concepts", count: 5 },
  { label: "Reels concepts", count: 5 },
  { label: "Shorts concepts", count: 5 },
  { label: "Carousels", count: 3 },
  { label: "Blog ideas", count: 3 },
  { label: "Email ideas", count: 3 },
];

export function BloomPanel({
  pieces,
  calendarPieces,
  draftQueue,
  performance,
  latestRun,
  stats,
  founderIncoming = [],
}: {
  pieces: BloomContentPiece[];
  calendarPieces: BloomContentPiece[];
  draftQueue: BloomContentPiece[];
  performance: BloomContentPerformance[];
  latestRun: BloomProductionRun | null;
  stats: {
    generatedToday: number;
    pendingQueue: number;
    awaitingReview: number;
    publishedCount: number;
    highViralCount: number;
    totalPieces: number;
  };
  founderIncoming?: Array<{ id: string; title: string; hook: string; updatedAt: string }>;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("calendar");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleRun() {
    setMessage(null);
    startTransition(async () => {
      const res = await runBloomProduction();
      if (res.ok) {
        setMessage(
          `Generated ${res.piecesGenerated}/${res.dailyTarget} pieces — sent to Sage for review (${res.piecesAwaitingReview} awaiting). Inputs: Scout ${res.scoutInputs}, Roots ${res.rootsInputs}, Sentinel ${res.sentinelInputs}, Seasonal ${res.seasonalInputs}.`
        );
        router.refresh();
      } else {
        setMessage(res.error);
      }
    });
  }

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Flower2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-brand-primary">Bloom — Content Production</h2>
              <p className="text-sm text-brand-muted">
                Daily batch from Scout, Roots, Sentinel + seasonal calendar · {TOTAL_DAILY_PIECES} pieces/day
              </p>
            </div>
          </div>
          <Button disabled={pending} onClick={handleRun}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run Daily Production
          </Button>
        </div>
        {message && <p className="mt-3 text-sm text-brand-primary">{message}</p>}
        {latestRun && (
          <p className="mt-2 text-xs text-brand-muted">
            Last run: {latestRun.piecesGenerated} generated, {latestRun.piecesQueued} queued ·{" "}
            Scout {latestRun.scoutInputs} · Roots {latestRun.rootsInputs} · Sentinel {latestRun.sentinelInputs} · Seasonal {latestRun.seasonalInputs}
          </p>
        )}
      </div>

      {founderIncoming.length > 0 && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <h3 className="font-heading text-sm font-semibold text-brand-primary">Incoming from Founder</h3>
          <p className="mt-0.5 text-xs text-brand-muted">Ideas approved by the founder, ready for Bloom production.</p>
          <div className="mt-3 space-y-2">
            {founderIncoming.map((idea) => (
              <a
                key={idea.id}
                href={`/content?itemId=${idea.id}`}
                className="block rounded-lg border border-emerald-200/60 bg-white px-3 py-2 transition hover:shadow-sm"
              >
                <p className="text-sm font-medium text-brand-primary">{idea.title}</p>
                {idea.hook && <p className="mt-0.5 line-clamp-2 text-xs text-brand-muted">{idea.hook}</p>}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Generated Today" value={stats.generatedToday} icon={Sparkles} />
        <StatCard label="Awaiting Sage" value={stats.awaitingReview} icon={Sparkles} />
        <StatCard label="Human Queue" value={stats.pendingQueue} icon={ListOrdered} />
        <StatCard label="Published" value={stats.publishedCount} icon={Flower2} />
        <StatCard label="High Viral (75+)" value={stats.highViralCount} icon={BarChart3} />
      </div>

      <div className="mb-6 rounded-xl border border-brand-border/60 bg-white/80 p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-sage">Daily output target</h3>
        <div className="flex flex-wrap gap-2">
          {DAILY_BREAKDOWN.map((d) => (
            <span key={d.label} className="rounded-lg bg-brand-bg px-2.5 py-1 text-xs text-brand-muted">
              {d.count}× {d.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 border-b border-brand-border pb-3">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === id
                ? "bg-brand-primary text-white"
                : "text-brand-muted hover:bg-brand-bg"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {id === "queue" && stats.pendingQueue > 0 && (
              <span className="rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-amber-900">
                {stats.pendingQueue}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "calendar" && <ContentCalendar pieces={calendarPieces} />}
      {tab === "library" && <ContentLibrary pieces={pieces} />}
      {tab === "queue" && <DraftQueue pieces={draftQueue} />}
      {tab === "performance" && <PerformanceTracker records={performance} />}
    </div>
  );
}
