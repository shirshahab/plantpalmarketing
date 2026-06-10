"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, Eye, Loader2, Megaphone, Play, Radar,
  Star, TrendingUp, Users, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { CompetitorScoreboard } from "@/components/competitors/competitor-scoreboard";
import { DailyBriefCard } from "@/components/competitors/daily-brief-card";
import { acknowledgeIntelAlert, dismissIntelAlert, runSentinelScan } from "@/lib/actions/sentinel-agent";
import type { CompetitorDailyBrief, CompetitorIntelAlert, CompetitorScoreboardEntry } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const alertIcons: Record<string, typeof Zap> = {
  new_feature: Zap,
  app_store_ranking: TrendingUp,
  viral_post: Megaphone,
  new_ad: Megaphone,
  negative_reviews: Star,
  partnership_discovered: Users,
  social_growth: TrendingUp,
  review_trend: Star,
};

const alertLabels: Record<string, string> = {
  new_feature: "New Feature",
  app_store_ranking: "App Store Ranking",
  viral_post: "Viral Content",
  new_ad: "Ad Campaign",
  negative_reviews: "Negative Reviews",
  partnership_discovered: "Partnership",
  social_growth: "Social Growth",
  review_trend: "Review Trend",
};

export function SentinelPanel({
  scoreboard,
  alerts,
  dailyBrief,
  stats,
}: {
  scoreboard: CompetitorScoreboardEntry[];
  alerts: CompetitorIntelAlert[];
  dailyBrief: CompetitorDailyBrief | null;
  stats: { alertsToday: number; activeAlerts: number; competitorsTracked: number; highSeverityAlerts: number };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleRun() {
    startTransition(async () => {
      const res = await runSentinelScan();
      if (res.ok) {
        setMessage(`Scanned ${res.competitorsScanned} competitors — ${res.alertsGenerated} alerts, brief published.`);
        router.refresh();
      } else {
        setMessage(res.error);
      }
    });
  }

  function handleAcknowledge(id: string) {
    startTransition(async () => {
      await acknowledgeIntelAlert(id);
      router.refresh();
    });
  }

  function handleDismiss(id: string) {
    startTransition(async () => {
      await dismissIntelAlert(id);
      router.refresh();
    });
  }

  const activeAlerts = alerts.filter((a) => a.status === "active");

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-slate-300/50 bg-gradient-to-br from-slate-100 to-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-700 text-white">
              <Radar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-brand-primary">Sentinel — Competitor Intelligence</h2>
              <p className="text-sm text-brand-muted">Premium market analyst · 8 competitors tracked continuously</p>
            </div>
          </div>
          <Button disabled={pending} onClick={handleRun}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run Sentinel Scan
          </Button>
        </div>
        {message && <p className="mt-3 text-sm text-brand-primary">{message}</p>}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Competitors Tracked" value={stats.competitorsTracked} icon={Eye} />
        <StatCard label="Active Alerts" value={stats.activeAlerts} icon={AlertTriangle} />
        <StatCard label="Alerts Today" value={stats.alertsToday} icon={Radar} />
        <StatCard label="High Severity" value={stats.highSeverityAlerts} icon={Zap} />
      </div>

      <div className="mb-8">
        <DailyBriefCard brief={dailyBrief} />
      </div>

      <h3 className="mb-3 font-heading text-base font-semibold text-brand-primary">Competitor Scoreboard</h3>
      <CompetitorScoreboard entries={scoreboard} />

      <h3 className="mb-3 mt-8 font-heading text-base font-semibold text-brand-primary">Intelligence Alerts</h3>
      <div className="space-y-4">
        {activeAlerts.length === 0 ? (
          <p className="text-sm text-brand-muted">No active alerts.</p>
        ) : (
          activeAlerts.map((alert) => {
            const Icon = alertIcons[alert.alertType] ?? AlertTriangle;
            return (
              <Card key={alert.id}>
                <CardContent className="py-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      alert.severity === "high" ? "bg-red-50 text-red-600" : alert.severity === "medium" ? "bg-amber-50 text-amber-600" : "bg-brand-bg text-brand-muted"
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-heading font-semibold text-brand-primary">{alert.competitor}</span>
                        <Badge variant="info">{alertLabels[alert.alertType] ?? alert.alertType}</Badge>
                        <Badge variant={alert.severity === "high" ? "danger" : alert.severity === "medium" ? "warning" : "muted"}>{alert.severity}</Badge>
                        <span className="text-xs text-brand-muted">{formatDate(alert.createdAt)} · {alert.source}</span>
                      </div>
                      <h4 className="mt-2 font-medium">{alert.title}</h4>
                      <p className="mt-1 text-sm text-brand-muted">{alert.description}</p>
                      <p className="mt-3 rounded-lg bg-brand-bg px-3 py-2 text-xs text-brand-primary">
                        <strong>Action:</strong> {alert.recommendedAction}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="secondary" disabled={pending} onClick={() => handleAcknowledge(alert.id)}>Acknowledge</Button>
                        <Button size="sm" variant="ghost" disabled={pending} onClick={() => handleDismiss(alert.id)}>Dismiss</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
