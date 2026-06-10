"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, Heart, Lightbulb, Loader2, MessageCircleHeart, Play, ThumbsDown, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DailyVoCReport } from "@/components/echo/daily-voc-report";
import { SentimentDashboard } from "@/components/echo/sentiment-dashboard";
import { FeatureRequestBoard } from "@/components/echo/feature-request-board";
import { LoveSignals } from "@/components/echo/love-signals";
import { ChurnRisks } from "@/components/echo/churn-risks";
import { PainPoints } from "@/components/echo/pain-points";
import { runEchoVoCScan } from "@/lib/actions/echo-agent";
import type {
  EchoChurnRisk, EchoFeatureRequest, EchoFeedback, EchoLoveSignal,
  EchoReport, EchoSentimentRecord,
} from "@/lib/types";

type Tab = "overview" | "features" | "sentiment" | "love" | "churn" | "pain";

const TABS: { id: Tab; label: string; icon: typeof Lightbulb }[] = [
  { id: "overview", label: "VoC Dashboard", icon: MessageCircleHeart },
  { id: "features", label: "Feature Requests", icon: Lightbulb },
  { id: "sentiment", label: "Sentiment", icon: TrendingUp },
  { id: "love", label: "Love Signals", icon: Heart },
  { id: "churn", label: "Churn Risks", icon: AlertTriangle },
  { id: "pain", label: "Pain Points", icon: ThumbsDown },
];

export function EchoPanel({
  feedback,
  featureRequests,
  sentiment,
  loveSignals,
  churnRisks,
  dailyReport,
  weeklyReport,
  stats,
}: {
  feedback: EchoFeedback[];
  featureRequests: EchoFeatureRequest[];
  sentiment: EchoSentimentRecord | null;
  loveSignals: EchoLoveSignal[];
  churnRisks: EchoChurnRisk[];
  dailyReport: EchoReport | null;
  weeklyReport: EchoReport | null;
  stats: {
    totalFeedback: number;
    urgentCount: number;
    positivePct: number;
    topFeatureRequest: string | null;
    topFeatureFrequency: number;
    activeChurnRisks: number;
    loveSignals: number;
    trendDirection: string;
  };
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleScan() {
    setMessage(null);
    startTransition(async () => {
      const res = await runEchoVoCScan();
      if (res.ok) {
        setMessage(
          `VoC scan complete — ${res.feedbackCount} feedback items, ${res.featureRequestCount} feature requests, ${res.churnRiskCount} churn risks. Echo never responds to users — insights only.`
        );
        router.refresh();
      } else {
        setMessage(res.error);
      }
    });
  }

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-rose-300/30 bg-gradient-to-br from-rose-50 to-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-800 text-white">
              <MessageCircleHeart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-brand-primary">Echo — Voice of Customer</h2>
              <p className="text-sm text-brand-muted">What are our users trying to tell us?</p>
            </div>
          </div>
          <Button disabled={pending} onClick={handleScan}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run VoC Scan
          </Button>
        </div>
        {message && <p className="mt-3 text-sm text-rose-900">{message}</p>}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Feedback Items" value={stats.totalFeedback} icon={MessageCircleHeart} />
        <StatCard label="Positive Sentiment" value={`${stats.positivePct}%`} icon={Heart} />
        <StatCard label="Urgent Issues" value={stats.urgentCount} icon={AlertTriangle} />
        <StatCard label="Top Request" value={stats.topFeatureFrequency} icon={Lightbulb} />
        <StatCard label="Churn Risks" value={stats.activeChurnRisks} icon={ThumbsDown} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
              tab === id
                ? "border-rose-600 bg-rose-600 text-white"
                : "border-brand-border bg-white text-brand-muted hover:border-rose-300"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <DailyVoCReport report={dailyReport} />
          <SentimentDashboard sentiment={sentiment} />
          {weeklyReport && (
            <Card>
              <CardHeader>
                <h2 className="font-heading text-lg font-semibold text-brand-primary">Weekly VoC Summary</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-brand-primary">{weeklyReport.executiveSummary}</p>
                <div className="grid gap-4 md:grid-cols-2">
                  {weeklyReport.sections.whatUsersLove && (
                    <div>
                      <p className="text-xs font-semibold uppercase text-brand-sage">What users love</p>
                      <ul className="mt-2 space-y-1">{weeklyReport.sections.whatUsersLove.map((w, i) => <li key={i} className="text-sm text-brand-muted">• {w}</li>)}</ul>
                    </div>
                  )}
                  {weeklyReport.sections.whatUsersHate && (
                    <div>
                      <p className="text-xs font-semibold uppercase text-brand-sage">What users hate</p>
                      <ul className="mt-2 space-y-1">{weeklyReport.sections.whatUsersHate.map((w, i) => <li key={i} className="text-sm text-brand-muted">• {w}</li>)}</ul>
                    </div>
                  )}
                  {weeklyReport.sections.productRecommendations && (
                    <div className="md:col-span-2">
                      <p className="text-xs font-semibold uppercase text-brand-sage">Product recommendations</p>
                      <ul className="mt-2 space-y-1">{weeklyReport.sections.productRecommendations.map((w, i) => <li key={i} className="text-sm text-brand-primary">→ {w}</li>)}</ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      {tab === "features" && <FeatureRequestBoard requests={featureRequests} />}
      {tab === "sentiment" && <SentimentDashboard sentiment={sentiment} />}
      {tab === "love" && <LoveSignals signals={loveSignals} />}
      {tab === "churn" && <ChurnRisks risks={churnRisks} />}
      {tab === "pain" && <PainPoints feedback={feedback} />}
    </div>
  );
}
