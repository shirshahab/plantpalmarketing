"use client";

import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { SageContentReview } from "@/lib/types";

export function ApprovalRecommendations({ reviews }: { reviews: SageContentReview[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-brand-muted">No approval recommendations yet. Run Sage review on Bloom output.</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="py-5">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-heading font-semibold text-brand-primary">
                  Score {review.aggregateScore} — {review.piece?.platform} {review.piece?.format}
                </p>
                <p className="mt-1 text-sm italic text-brand-primary">&ldquo;{review.piece?.hook}&rdquo;</p>
                <div className="mt-3 space-y-2 text-sm text-brand-muted">
                  <p><strong className="text-brand-primary">Better hook:</strong> {review.hookSuggestion}</p>
                  <p><strong className="text-brand-primary">Better CTA:</strong> {review.ctaSuggestion}</p>
                  <p><strong className="text-brand-primary">Storytelling:</strong> {review.storytellingSuggestion}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
