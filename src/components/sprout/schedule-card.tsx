"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { SproutScheduledPost } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const statusVariant: Record<string, "warning" | "info" | "success" | "muted" | "default"> = {
  waiting: "warning",
  scheduling: "info",
  ready: "success",
  published: "muted",
};

const statusLabel: Record<string, string> = {
  waiting: "Waiting",
  scheduling: "Scheduling",
  ready: "Ready",
  published: "Published",
};

export function ScheduleCard({
  post,
  actions,
  compact,
}: {
  post: SproutScheduledPost;
  actions?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">{post.platform}</Badge>
              <Badge variant={statusVariant[post.status]}>{statusLabel[post.status]}</Badge>
              {post.scheduleApproved && <Badge variant="success">Schedule approved</Badge>}
              {post.scheduledAt && (
                <span className="text-xs text-brand-muted">{formatDate(post.scheduledAt)}</span>
              )}
            </div>
            <h4 className="mt-3 font-heading font-semibold text-brand-primary">{post.title}</h4>
            <p className="mt-2 text-sm font-medium italic text-brand-primary">&ldquo;{post.hook}&rdquo;</p>
            {!compact && (
              <>
                <p className="mt-2 text-sm text-brand-muted">{post.caption}</p>
                <p className="mt-2 text-sm text-brand-primary">{post.cta}</p>
              </>
            )}
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-brand-muted">
              <span>Best time: {post.recommendedTimeLabel}</span>
              <span>Score {post.bestTimeScore}</span>
            </div>
            {post.notes && (
              <p className="mt-2 rounded-lg bg-brand-bg px-3 py-2 text-xs text-brand-muted">{post.notes}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 flex-col gap-2">{actions}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
