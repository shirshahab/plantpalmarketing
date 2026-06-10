"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { EchoSentimentRecord } from "@/lib/types";

const TREND_LABELS: Record<string, string> = {
  improving: "Improving",
  stable: "Stable",
  declining: "Declining",
};

export function SentimentDashboard({ sentiment }: { sentiment: EchoSentimentRecord | null }) {
  if (!sentiment) {
    return <p className="text-sm text-brand-muted">No sentiment data. Run VoC scan.</p>;
  }

  const total = sentiment.positiveCount + sentiment.neutralCount + sentiment.negativeCount + sentiment.urgentCount;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <h3 className="text-sm font-semibold text-emerald-700">Positive</h3>
        </CardHeader>
        <CardContent>
          <p className="font-heading text-2xl font-bold text-brand-primary">{sentiment.positiveCount}</p>
          <p className="text-xs text-brand-muted">{sentiment.positivePct}% of feedback</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <h3 className="text-sm font-semibold text-brand-muted">Neutral</h3>
        </CardHeader>
        <CardContent>
          <p className="font-heading text-2xl font-bold text-brand-primary">{sentiment.neutralCount}</p>
          <p className="text-xs text-brand-muted">{total > 0 ? Math.round((sentiment.neutralCount / total) * 100) : 0}%</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <h3 className="text-sm font-semibold text-rose-700">Negative</h3>
        </CardHeader>
        <CardContent>
          <p className="font-heading text-2xl font-bold text-brand-primary">{sentiment.negativeCount}</p>
          <p className="text-xs text-brand-muted">{sentiment.negativePct}% of feedback</p>
        </CardContent>
      </Card>
      <Card className="border-rose-200 bg-rose-50/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-rose-800">Urgent</h3>
            <Badge variant={sentiment.trendDirection === "improving" ? "success" : sentiment.trendDirection === "declining" ? "danger" : "muted"}>
              {TREND_LABELS[sentiment.trendDirection]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="font-heading text-2xl font-bold text-rose-800">{sentiment.urgentCount}</p>
          <p className="text-xs text-brand-muted">Top category: {sentiment.topCategory.replace(/_/g, " ")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
