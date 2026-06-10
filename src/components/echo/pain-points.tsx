"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { EchoFeedback } from "@/lib/types";

const SENTIMENT_STYLES: Record<string, string> = {
  positive: "border-emerald-200 bg-emerald-50/30",
  neutral: "border-brand-border bg-white",
  negative: "border-amber-200 bg-amber-50/30",
  urgent: "border-rose-200 bg-rose-50/50",
};

const SOURCE_LABELS: Record<string, string> = {
  support_ticket: "Support",
  app_review: "App Review",
  email: "Email",
  reddit: "Reddit",
  survey: "Survey",
  tiktok_comment: "TikTok",
  youtube_comment: "YouTube",
  instagram_comment: "Instagram",
  facebook_groups: "Facebook",
  community_comment: "Community",
  feature_request: "Feature Request",
};

export function PainPoints({ feedback }: { feedback: EchoFeedback[] }) {
  const painPoints = feedback.filter(
    (f) => f.sentiment === "negative" || f.sentiment === "urgent" || f.feedbackType === "complaint" || f.feedbackType === "confusion"
  );

  if (painPoints.length === 0) {
    return <p className="text-sm text-brand-muted">No pain points in latest scan.</p>;
  }

  return (
    <div className="space-y-3">
      {painPoints.map((f) => (
        <Card key={f.id} className={SENTIMENT_STYLES[f.sentiment] ?? ""}>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={f.sentiment === "urgent" ? "danger" : "warning"}>{f.sentiment}</Badge>
              <Badge variant="muted">{SOURCE_LABELS[f.source] ?? f.source}</Badge>
              <Badge variant="info">{f.category.replace(/_/g, " ")}</Badge>
            </div>
            <p className="mt-2 text-sm text-brand-primary">{f.content}</p>
            <p className="mt-1 text-xs text-brand-muted">— {f.author}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
