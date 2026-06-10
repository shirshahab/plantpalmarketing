"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3, CheckCircle2, Lightbulb, Loader2, Play, Sparkles, Star, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { SageScoreCard } from "@/components/sage/score-card";
import { ApprovalRecommendations } from "@/components/sage/approval-recommendations";
import { RejectionReasons } from "@/components/sage/rejection-reasons";
import { CreativeOpportunities } from "@/components/sage/creative-opportunities";
import { runSageReview } from "@/lib/actions/sage-agent";
import { SAGE_PASS_THRESHOLD } from "@/lib/agents/sage/mock-scorer";
import type { SageContentReview, SageReviewBatch } from "@/lib/types";

type Tab = "scores" | "approvals" | "rejections" | "opportunities";

const TABS: { id: Tab; label: string; icon: typeof Star }[] = [
  { id: "scores", label: "Score Dashboard", icon: BarChart3 },
  { id: "approvals", label: "Approval Recommendations", icon: CheckCircle2 },
  { id: "rejections", label: "Rejection Reasons", icon: XCircle },
  { id: "opportunities", label: "Creative Opportunities", icon: Lightbulb },
];

export function SagePanel({
  reviews,
  approvals,
  rejections,
  opportunities,
  latestBatch,
  stats,
}: {
  reviews: SageContentReview[];
  approvals: SageContentReview[];
  rejections: SageContentReview[];
  opportunities: SageContentReview[];
  latestBatch: SageReviewBatch | null;
  stats: {
    reviewedToday: number;
    approvedCount: number;
    rejectedCount: number;
    awaitingReview: number;
    avgAggregateScore: number;
    totalReviews: number;
  };
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("scores");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleRun() {
    setMessage(null);
    startTransition(async () => {
      const res = await runSageReview();
      if (res.ok) {
        setMessage(
          `Reviewed ${res.piecesReviewed} pieces — ${res.approvedCount} approved (≥${res.passThreshold}), ${res.rejectedCount} rejected. ${res.approvalQueueCount} sent to approval queue.`
        );
        router.refresh();
      } else {
        setMessage(res.error);
      }
    });
  }

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-teal-200/60 bg-gradient-to-br from-teal-50 to-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-brand-primary">Sage — Creative Director</h2>
              <p className="text-sm text-brand-muted">
                Reviews every Bloom piece before approval · Pass threshold {SAGE_PASS_THRESHOLD}/100
              </p>
            </div>
          </div>
          <Button disabled={pending || stats.awaitingReview === 0} onClick={handleRun}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Review Bloom Queue ({stats.awaitingReview})
          </Button>
        </div>
        {message && <p className="mt-3 text-sm text-brand-primary">{message}</p>}
        {latestBatch && (
          <p className="mt-2 text-xs text-brand-muted">
            Last batch: {latestBatch.piecesReviewed} reviewed · {latestBatch.approvedCount} approved · avg {latestBatch.avgAggregateScore}
          </p>
        )}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Awaiting Review" value={stats.awaitingReview} icon={Sparkles} />
        <StatCard label="Approved" value={stats.approvedCount} icon={CheckCircle2} />
        <StatCard label="Rejected" value={stats.rejectedCount} icon={XCircle} />
        <StatCard label="Avg Score" value={stats.avgAggregateScore} icon={BarChart3} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2 border-b border-brand-border pb-3">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === id ? "bg-teal-700 text-white" : "text-brand-muted hover:bg-brand-bg"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "scores" && (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-sm text-brand-muted">No scored content yet.</p>
          ) : (
            reviews.map((r) => <SageScoreCard key={r.id} review={r} />)
          )}
        </div>
      )}
      {tab === "approvals" && <ApprovalRecommendations reviews={approvals} />}
      {tab === "rejections" && <RejectionReasons reviews={rejections} />}
      {tab === "opportunities" && <CreativeOpportunities reviews={opportunities} />}
    </div>
  );
}
