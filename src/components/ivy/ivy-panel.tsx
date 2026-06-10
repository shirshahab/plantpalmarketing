"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Crown, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { DailySummaryCard } from "@/components/ivy/daily-summary-card";
import { WeeklySummaryCard } from "@/components/ivy/weekly-summary-card";
import { ActionCenter } from "@/components/ivy/action-center";
import { RecommendationFeed } from "@/components/ivy/recommendation-feed";
import { runIvyMorningBrief } from "@/lib/actions/ivy-agent";
import type { IvyAlert, IvyBrief, IvyRecommendation } from "@/lib/types";

export function IvyPanel({
  dailyBrief,
  weeklyBrief,
  recommendations,
  alerts,
  actionCenter,
  stats,
}: {
  dailyBrief: IvyBrief | null;
  weeklyBrief: IvyBrief | null;
  recommendations: IvyRecommendation[];
  alerts: IvyAlert[];
  actionCenter: {
    roiActions: IvyRecommendation[];
    threats: IvyRecommendation[];
    approvals: IvyRecommendation[];
    growthOpportunities: IvyRecommendation[];
  };
  stats: {
    totalRecommendations: number;
    pendingUrgentAlerts: number;
    activeAlerts: number;
    topPriorityScore: number;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleBrief() {
    setMessage(null);
    startTransition(async () => {
      const res = await runIvyMorningBrief();
      if (res.ok) {
        setMessage(`Brief generated — ${res.recommendationsCount} recommendations, ${res.alertsCount} alerts. Human approval still required for all actions.`);
        router.refresh();
      } else {
        setMessage(res.error);
      }
    });
  }

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-violet-300/30 bg-gradient-to-br from-violet-50 to-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-800 text-white">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-brand-primary">Ivy — Chief of Staff</h2>
              <p className="text-sm text-brand-muted">
                Analyzes Scout, Roots, Sentinel, Bloom, Sage, Sprout, Oak, and Gate — recommends priorities only
              </p>
            </div>
          </div>
          <Button disabled={pending} onClick={handleBrief}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Generate Morning Brief
          </Button>
        </div>
        {message && <p className="mt-3 text-sm text-violet-900">{message}</p>}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Recommendations Today" value={stats.totalRecommendations} icon={Crown} />
        <StatCard label="Urgent Alerts" value={stats.pendingUrgentAlerts} icon={Crown} />
        <StatCard label="Active Warnings" value={stats.activeAlerts} icon={Crown} />
        <StatCard label="Top Priority Score" value={stats.topPriorityScore} icon={Crown} />
      </div>

      <ActionCenter {...actionCenter} />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <DailySummaryCard brief={dailyBrief} />
        <WeeklySummaryCard brief={weeklyBrief} />
      </div>

      <div className="mt-6">
        <RecommendationFeed recommendations={recommendations} alerts={alerts} />
      </div>
    </div>
  );
}
