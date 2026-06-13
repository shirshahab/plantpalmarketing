"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { WorkflowStageBadge } from "@/components/workflow/workflow-stage-badge";
import { formatDate } from "@/lib/utils";
import {
  archiveIntelligenceAlertAction,
  sendIntelligenceAlertToContentAction,
} from "@/lib/actions/intelligence-alerts";
import type { SavedIntelligenceAlert } from "@/lib/intelligence/saved-alerts-queries";

const CLASS_LABELS: Record<string, string> = {
  community_opportunity: "Community",
  content_idea: "Content",
  competitor_alert: "Competitor",
  creator_opportunity: "Creator",
  product_feedback: "Feedback",
  seo_topic: "SEO",
};

export function LiveIntelligenceSection({ alerts }: { alerts: SavedIntelligenceAlert[] }) {
  if (alerts.length === 0) {
    return <p className="text-sm text-brand-muted">No high-priority intelligence alerts right now.</p>;
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <LiveIntelligenceCard key={alert.id} alert={alert} />
      ))}
    </div>
  );
}

function LiveIntelligenceCard({ alert }: { alert: SavedIntelligenceAlert }) {
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      await action();
    });
  }

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center gap-2">
          <WorkflowStageBadge stage="PENDING_FOUNDER_REPLY_APPROVAL" />
          <Badge variant="warning">{alert.priority}</Badge>
          {alert.classification && (
            <Badge variant="info">{CLASS_LABELS[alert.classification] ?? alert.classification}</Badge>
          )}
          {alert.assignedAgent && (
            <Badge variant="success" className="capitalize">
              → {alert.assignedAgent}
            </Badge>
          )}
          <span className="text-xs text-brand-muted">{formatDate(alert.createdAt)}</span>
        </div>
        <p className="mt-2 font-medium text-brand-primary">{alert.title}</p>
        <p className="text-xs text-brand-muted">
          {alert.source}
          {alert.subreddit ? ` · r/${alert.subreddit}` : ""}
        </p>
        {alert.classificationReason && (
          <p className="mt-1 text-xs text-brand-muted">{alert.classificationReason}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/intelligence?alert=${alert.id}`}
            className="rounded-lg border border-brand-border px-2 py-1 text-[11px] font-medium text-brand-primary hover:bg-brand-bg"
          >
            View
          </Link>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => archiveIntelligenceAlertAction(alert.id))}
            className="rounded-lg border border-brand-border px-2 py-1 text-[11px] text-brand-muted hover:bg-brand-bg disabled:opacity-50"
          >
            Archive
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => sendIntelligenceAlertToContentAction(alert.id))}
            className="rounded-lg border border-brand-border bg-white px-2 py-1 text-[11px] font-medium text-brand-primary hover:bg-brand-bg disabled:opacity-50"
          >
            Send to Content
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
