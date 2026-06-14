"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ExternalLink, MessageSquare, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { WorkflowStageBadge } from "@/components/workflow/workflow-stage-badge";
import { SourceLinks } from "@/components/shared/source-links";
import { DraftReplyModal, type DraftReplyTarget } from "@/components/inbox/draft-reply-modal";
import { formatDate } from "@/lib/utils";
import { suggestPlantPalReply } from "@/lib/inbox/suggest-reply";
import {
  archiveIntelligenceAlertAction,
  rejectIntelligenceAlertAction,
  sendIntelligenceAlertToBloomAction,
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
    return (
      <p className="text-sm text-brand-muted">
        No high-priority intelligence alerts right now. Run F5Bot ingest or Daily Engine.
      </p>
    );
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
  const [toast, setToast] = useState<{ message: string; destination?: string } | null>(null);
  const [draftTarget, setDraftTarget] = useState<DraftReplyTarget | null>(null);

  function run(action: () => Promise<{ ok: boolean; error?: string; message?: string; destination?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        setToast({ message: result.message ?? "Done", destination: result.destination });
      } else {
        setToast({ message: result.error ?? "Action failed" });
      }
    });
  }

  const isSeo = alert.classification === "seo_topic";
  const isCommunity = alert.classification === "community_opportunity";

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center gap-2">
          <WorkflowStageBadge stage="PENDING_FOUNDER_REPLY_APPROVAL" />
          <Badge variant="warning">{alert.priority ?? "high"}</Badge>
          {alert.classification && (
            <Badge variant="info">{CLASS_LABELS[alert.classification] ?? alert.classification}</Badge>
          )}
          {alert.relevanceScore > 0 && (
            <Badge variant="muted">Score {alert.relevanceScore}</Badge>
          )}
          <span className="text-xs text-brand-muted">{formatDate(alert.createdAt)}</span>
        </div>

        <p className="mt-2 font-medium text-brand-primary">{alert.title}</p>

        <SourceLinks
          sourceUrl={alert.url || undefined}
          sourcePlatform={alert.source}
          sourceSubreddit={alert.subreddit || undefined}
          sourceTitle={alert.title}
          dataSource="f5bot"
          compact
        />

        {alert.relevanceReason && (
          <p className="mt-2 text-xs text-brand-muted">
            <span className="font-medium text-brand-primary">Why surfaced:</span> {alert.relevanceReason}
          </p>
        )}

        {alert.detectedKeywords.length > 0 && (
          <p className="mt-1 text-xs text-brand-muted">
            <span className="font-medium text-brand-primary">Matched keywords:</span>{" "}
            {alert.detectedKeywords.join(", ")}
          </p>
        )}

        <p className="mt-1 text-xs text-brand-muted">
          <span className="font-medium text-brand-primary">Recommended:</span> {alert.recommendedAction}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {alert.url ? (
            <a
              href={alert.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-brand-border px-2 py-1 text-[11px] font-medium text-brand-primary hover:bg-brand-bg"
            >
              <ExternalLink className="h-3 w-3" />
              Open Source
            </a>
          ) : (
            <span className="rounded-lg border border-dashed border-brand-border px-2 py-1 text-[11px] text-brand-muted">
              Source link unavailable
            </span>
          )}
          {isCommunity && alert.url && (
            <button
              type="button"
              onClick={() =>
                setDraftTarget({
                  sourceType: "intelligence_alerts",
                  sourceId: alert.id,
                  sourceUrl: alert.url,
                  sourceTitle: alert.title,
                  sourceBody: alert.body,
                  platform: alert.source || "reddit",
                  subreddit: alert.subreddit || undefined,
                  suggestedReply: suggestPlantPalReply({
                    title: alert.title,
                    body: alert.body,
                    subreddit: alert.subreddit,
                  }),
                })
              }
              className="inline-flex items-center gap-1 rounded-lg border border-brand-border px-2 py-1 text-[11px] font-medium text-brand-primary hover:bg-brand-bg"
            >
              <MessageSquare className="h-3 w-3" />
              Draft Reply
            </button>
          )}
          {isSeo ? (
            <Link
              href="/seo"
              className="rounded-lg border border-brand-border px-2 py-1 text-[11px] font-medium text-brand-primary hover:bg-brand-bg"
            >
              Send to SEO
            </Link>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => sendIntelligenceAlertToBloomAction(alert.id))}
              className="inline-flex items-center gap-1 rounded-lg border border-brand-primary/30 bg-brand-primary/5 px-2 py-1 text-[11px] font-medium text-brand-primary hover:bg-brand-primary/10 disabled:opacity-50"
            >
              <Sparkles className="h-3 w-3" />
              Send to Bloom
            </button>
          )}
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
            onClick={() => run(() => rejectIntelligenceAlertAction(alert.id))}
            className="rounded-lg border border-brand-border px-2 py-1 text-[11px] text-rose-700 hover:bg-rose-50 disabled:opacity-50"
          >
            Reject
          </button>
        </div>

        {toast && (
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
            {toast.message}
            {toast.destination && (
              <span className="ml-2 inline-flex gap-2">
                <Link href={toast.destination} className="font-medium underline">
                  Open Bloom
                </Link>
                <Link href="/agents/pipeline" className="font-medium underline">
                  View Workflow
                </Link>
              </span>
            )}
          </div>
        )}

        <DraftReplyModal target={draftTarget} onClose={() => setDraftTarget(null)} />
      </CardContent>
    </Card>
  );
}
