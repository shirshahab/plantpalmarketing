"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { SageContentReview } from "@/lib/types";
import { SAGE_PASS_THRESHOLD } from "@/lib/agents/sage/mock-scorer";

const DIMENSIONS: { key: keyof SageContentReview; label: string }[] = [
  { key: "originalityScore", label: "Originality" },
  { key: "humorScore", label: "Humor" },
  { key: "emotionalImpactScore", label: "Emotion" },
  { key: "shareabilityScore", label: "Shareability" },
  { key: "storytellingScore", label: "Storytelling" },
  { key: "educationalScore", label: "Education" },
];

function scoreColor(n: number): string {
  if (n >= 80) return "bg-emerald-500";
  if (n >= 70) return "bg-amber-400";
  return "bg-rose-400";
}

export function SageScoreCard({ review }: { review: SageContentReview }) {
  const passed = review.aggregateScore >= SAGE_PASS_THRESHOLD;

  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={passed ? "success" : "danger"}>
                {review.aggregateScore}/100
              </Badge>
              <Badge variant={review.recommendation === "approve" ? "success" : "danger"}>
                {review.recommendation === "approve" ? "Approve" : "Reject"}
              </Badge>
              {review.piece && (
                <>
                  <Badge variant="info">{review.piece.platform}</Badge>
                  <Badge variant="muted">{review.piece.format}</Badge>
                </>
              )}
            </div>
            <p className="mt-3 font-heading font-semibold text-brand-primary">
              {review.piece?.hook ?? "Content piece"}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {DIMENSIONS.map(({ key, label }) => {
            const value = review[key] as number;
            return (
              <div key={key} className="rounded-lg bg-brand-bg/60 px-3 py-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-brand-muted">{label}</span>
                  <span className="font-semibold text-brand-primary">{value}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white">
                  <div className={`h-full rounded-full ${scoreColor(value)}`} style={{ width: `${value}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
