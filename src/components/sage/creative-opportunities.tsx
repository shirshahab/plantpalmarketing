"use client";

import { Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { SageContentReview } from "@/lib/types";

export function CreativeOpportunities({ reviews }: { reviews: SageContentReview[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-brand-muted">Creative opportunities appear after Sage reviews Bloom content.</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="py-5">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-heading font-semibold text-brand-primary">
                  {review.piece?.platform} — {review.piece?.format} · Score {review.aggregateScore}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-brand-primary">{review.creativeOpportunity}</p>
                {review.piece && (
                  <p className="mt-2 text-xs text-brand-muted">From: {review.piece.hook.slice(0, 80)}…</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
