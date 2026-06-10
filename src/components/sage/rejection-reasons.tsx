"use client";

import { XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { SageContentReview } from "@/lib/types";
import { SAGE_PASS_THRESHOLD } from "@/lib/agents/sage/mock-scorer";

export function RejectionReasons({ reviews }: { reviews: SageContentReview[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-brand-muted">No rejections — all reviewed content passed the {SAGE_PASS_THRESHOLD} threshold.</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="py-5">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <XCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-heading font-semibold text-brand-primary">
                  Score {review.aggregateScore} (below {SAGE_PASS_THRESHOLD}) — {review.piece?.platform}
                </p>
                <p className="mt-1 text-sm italic text-brand-muted">&ldquo;{review.piece?.hook}&rdquo;</p>
                <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
                  <strong>Reason:</strong> {review.rejectionReason}
                </p>
                <div className="mt-3 space-y-2 text-sm text-brand-muted">
                  <p><strong className="text-brand-primary">Rewrite hook:</strong> {review.hookSuggestion}</p>
                  <p><strong className="text-brand-primary">Rewrite CTA:</strong> {review.ctaSuggestion}</p>
                  <p><strong className="text-brand-primary">Rewrite story:</strong> {review.storytellingSuggestion}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
