"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { BloomContentPiece } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const formatLabels: Record<string, string> = {
  x_post: "X Post",
  threads_post: "Threads",
  tiktok_concept: "TikTok",
  reels_concept: "Reels",
  shorts_concept: "Shorts",
  carousel: "Carousel",
  blog_idea: "Blog",
  email_idea: "Email",
};

const sourceLabels: Record<string, string> = {
  scout_discovery: "Scout",
  roots_conversation: "Roots",
  sentinel_alert: "Sentinel",
  seasonal_event: "Seasonal",
};

export function ContentPieceCard({
  piece,
  actions,
  compact,
}: {
  piece: BloomContentPiece;
  actions?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">{piece.platform}</Badge>
              <Badge variant="muted">{formatLabels[piece.format] ?? piece.format}</Badge>
              <Badge variant="default">{sourceLabels[piece.sourceType] ?? piece.sourceType}</Badge>
              <StatusBadge
                status={
                  piece.status === "published" || piece.status === "approved"
                    ? "approved"
                    : piece.status === "awaiting_review"
                      ? "draft"
                      : piece.status === "pending"
                        ? "pending"
                        : piece.status
                }
              />
              {piece.status === "awaiting_review" && (
                <Badge variant="warning">Awaiting Sage</Badge>
              )}
              {piece.scheduledDate && (
                <span className="text-xs text-brand-muted">Scheduled {formatDate(piece.scheduledDate)}</span>
              )}
            </div>
            <h4 className="mt-3 font-heading font-semibold text-brand-primary">{piece.title}</h4>
            <p className="mt-2 text-sm font-medium text-brand-primary">&ldquo;{piece.hook}&rdquo;</p>
            {!compact && (
              <>
                <p className="mt-2 text-sm leading-relaxed text-brand-muted">{piece.caption}</p>
                <p className="mt-2 text-sm text-brand-primary">{piece.cta}</p>
              </>
            )}
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-brand-muted">
              <span>Viral {piece.viralScore}</span>
              <span>Difficulty {piece.difficultyScore}</span>
              <span>Trigger: {piece.emotionalTrigger}</span>
            </div>
            {!compact && piece.sourceDetail && (
              <p className="mt-2 rounded-lg bg-brand-bg px-3 py-2 text-xs text-brand-muted">
                Source: {piece.sourceDetail}
              </p>
            )}
          </div>
          {actions && <div className="flex shrink-0 flex-col gap-2">{actions}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
