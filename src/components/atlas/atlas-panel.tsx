"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, BarChart3, FlaskConical, Lightbulb, Loader2, Play,
  Target, TrendingUp, Telescope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DailyGrowthBrief } from "@/components/atlas/daily-growth-brief";
import { GrowthForecast } from "@/components/atlas/growth-forecast";
import { GrowthExperiments } from "@/components/atlas/growth-experiments";
import { GrowthBottlenecks } from "@/components/atlas/growth-bottlenecks";
import { runAtlasGrowthBrief } from "@/lib/actions/atlas-agent";
import type {
  AtlasBottleneck, AtlasExperiment, AtlasForecast, AtlasGrowthMetrics,
  AtlasGrowthReport, AtlasRecommendation,
} from "@/lib/types";

type Tab = "overview" | "forecast" | "opportunities" | "experiments" | "bottlenecks";

const TABS: { id: Tab; label: string; icon: typeof BarChart3 }[] = [
  { id: "overview", label: "Growth Dashboard", icon: BarChart3 },
  { id: "forecast", label: "Forecast", icon: TrendingUp },
  { id: "opportunities", label: "Opportunities", icon: Lightbulb },
  { id: "experiments", label: "Experiments", icon: FlaskConical },
  { id: "bottlenecks", label: "Bottlenecks", icon: AlertTriangle },
];

const STAGE_LABELS: Record<string, string> = {
  "0_to_1k": "0 → 1K",
  "1k_to_10k": "1K → 10K",
  "10k_to_100k": "10K → 100K",
  "100k_to_1m": "100K → 1M",
};

export function AtlasPanel({
  metrics,
  dailyReport,
  weeklyReport,
  recommendations,
  experiments,
  forecasts,
  bottlenecks,
  stats,
}: {
  metrics: AtlasGrowthMetrics | null;
  dailyReport: AtlasGrowthReport | null;
  weeklyReport: AtlasGrowthReport | null;
  recommendations: AtlasRecommendation[];
  experiments: AtlasExperiment[];
  forecasts: AtlasForecast[];
  bottlenecks: AtlasBottleneck[];
  stats: {
    totalUsers: number;
    growthStage: string;
    totalRecommendations: number;
    activeExperiments: number;
    activeBottlenecks: number;
    topPriorityScore: number;
    forecast30d: number;
  };
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleBrief() {
    setMessage(null);
    startTransition(async () => {
      const res = await runAtlasGrowthBrief();
      if (res.ok) {
        setMessage(
          `Growth brief generated — ${res.recommendationsCount} recommendations, ${res.experimentsCount} experiments, ${res.bottlenecksCount} bottlenecks. Atlas recommends only — you decide.`
        );
        router.refresh();
      } else {
        setMessage(res.error);
      }
    });
  }

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-sky-300/30 bg-gradient-to-br from-sky-50 to-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-800 text-white">
              <Telescope className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-brand-primary">Atlas — Head of Growth</h2>
              <p className="text-sm text-brand-muted">
                What is the fastest path to growth? Stage: {STAGE_LABELS[stats.growthStage] ?? stats.growthStage}
              </p>
            </div>
          </div>
          <Button disabled={pending} onClick={handleBrief}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Generate Growth Brief
          </Button>
        </div>
        {message && <p className="mt-3 text-sm text-sky-900">{message}</p>}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Users" value={stats.totalUsers.toLocaleString()} icon={Target} />
        <StatCard label="30d Forecast" value={stats.forecast30d.toLocaleString()} icon={TrendingUp} />
        <StatCard label="Recommendations" value={stats.totalRecommendations} icon={Lightbulb} />
        <StatCard label="Experiments" value={stats.activeExperiments} icon={FlaskConical} />
        <StatCard label="Bottlenecks" value={stats.activeBottlenecks} icon={AlertTriangle} />
      </div>

      {metrics && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Waitlist" value={metrics.waitlistCount} icon={Target} />
          <StatCard label="Conversion" value={`${metrics.conversionRate}%`} icon={BarChart3} />
          <StatCard label="D7 Retention" value={`${metrics.retentionD7}%`} icon={TrendingUp} />
          <StatCard label="Engagement" value={`${metrics.engagementRate}%`} icon={Target} />
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
              tab === id
                ? "border-sky-600 bg-sky-600 text-white"
                : "border-brand-border bg-white text-brand-muted hover:border-sky-300"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <DailyGrowthBrief report={dailyReport} />
          {weeklyReport && (
            <Card>
              <CardHeader>
                <h2 className="font-heading text-lg font-semibold text-brand-primary">Weekly Growth Strategy Memo</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-brand-primary">{weeklyReport.executiveSummary}</p>
                <div className="grid gap-4 md:grid-cols-2">
                  {weeklyReport.sections.whatWorked && (
                    <div>
                      <p className="text-xs font-semibold uppercase text-brand-sage">What worked</p>
                      <ul className="mt-2 space-y-1">{weeklyReport.sections.whatWorked.map((w, i) => <li key={i} className="text-sm text-brand-muted">• {w}</li>)}</ul>
                    </div>
                  )}
                  {weeklyReport.sections.whatFailed && (
                    <div>
                      <p className="text-xs font-semibold uppercase text-brand-sage">What failed</p>
                      <ul className="mt-2 space-y-1">{weeklyReport.sections.whatFailed.map((w, i) => <li key={i} className="text-sm text-brand-muted">• {w}</li>)}</ul>
                    </div>
                  )}
                  {weeklyReport.sections.doubleDown && (
                    <div>
                      <p className="text-xs font-semibold uppercase text-brand-sage">Double down on</p>
                      <ul className="mt-2 space-y-1">{weeklyReport.sections.doubleDown.map((w, i) => <li key={i} className="text-sm text-brand-primary">→ {w}</li>)}</ul>
                    </div>
                  )}
                  {weeklyReport.sections.stopDoing && (
                    <div>
                      <p className="text-xs font-semibold uppercase text-brand-sage">Stop doing</p>
                      <ul className="mt-2 space-y-1">{weeklyReport.sections.stopDoing.map((w, i) => <li key={i} className="text-sm text-rose-800">✕ {w}</li>)}</ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {tab === "forecast" && <GrowthForecast forecasts={forecasts} />}
      {tab === "opportunities" && (
        <div className="space-y-3">
          {recommendations.length === 0 ? (
            <p className="text-sm text-brand-muted">No recommendations yet.</p>
          ) : (
            recommendations.map((rec) => (
              <Card key={rec.id}>
                <CardContent className="py-4">
                  <p className="font-medium text-brand-primary">Atlas recommends: {rec.title}</p>
                  <p className="mt-1 text-sm text-brand-muted">{rec.description}</p>
                  <p className="mt-2 text-[10px] text-brand-sage">
                    Score {rec.priorityScore} · R{rec.reach} C{rec.cost} D{rec.difficulty} V{rec.virality} · via {rec.sourceAgent}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
      {tab === "experiments" && <GrowthExperiments experiments={experiments} />}
      {tab === "bottlenecks" && <GrowthBottlenecks bottlenecks={bottlenecks} />}
    </div>
  );
}
