"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  ExternalLink,
  FileText,
  ImageIcon,
  Lightbulb,
  MessageSquare,
  Radar,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { WorkflowStageBadge } from "@/components/workflow/workflow-stage-badge";
import { DraftReplyModal, type DraftReplyTarget } from "@/components/inbox/draft-reply-modal";
import { formatDate } from "@/lib/utils";
import { suggestPlantPalReply } from "@/lib/inbox/suggest-reply";
import {
  archiveIntelligenceAlertAction,
  rejectIntelligenceAlertAction,
  sendIntelligenceAlertToBloomAction,
} from "@/lib/actions/intelligence-alerts";
import { filterInboxByTab, type FounderInbox } from "@/lib/workflow/inbox-queries";
import type { InboxItem, InboxTab } from "@/lib/workflow/types";
import type { LucideIcon } from "lucide-react";

const TABS: { id: InboxTab; label: string; icon: LucideIcon }[] = [
  { id: "all", label: "All", icon: Radar },
  { id: "replies", label: "Replies", icon: MessageSquare },
  { id: "ideas", label: "Ideas", icon: Lightbulb },
  { id: "videos", label: "Videos", icon: Video },
  { id: "images", label: "Images", icon: ImageIcon },
  { id: "seo", label: "SEO", icon: FileText },
  { id: "creators", label: "Creators", icon: Users },
  { id: "intelligence", label: "Intelligence", icon: Radar },
];

function SummaryCards({ inbox }: { inbox: FounderInbox }) {
  const cards = [
    { label: "Replies needing action", value: inbox.tabCounts.replies, icon: MessageSquare },
    { label: "Ideas waiting", value: inbox.tabCounts.ideas, icon: Lightbulb },
    {
      label: "Creative reviews",
      value: inbox.tabCounts.videos + inbox.tabCounts.images,
      icon: Video,
    },
    { label: "SEO drafts", value: inbox.tabCounts.seo, icon: FileText },
    { label: "Creator leads", value: inbox.tabCounts.creators, icon: Users },
  ];

  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="flex items-center gap-3 py-4">
            <c.icon className="h-5 w-5 text-brand-primary" />
            <div>
              <p className="text-xl font-bold tabular-nums text-brand-primary">{c.value}</p>
              <p className="text-xs text-brand-muted">{c.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function InboxCard({
  item,
  onDraftReply,
}: {
  item: InboxItem;
  onDraftReply: (target: DraftReplyTarget) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  const isIntel = item.section === "intelligence";
  const isReply =
    item.section === "replies" ||
    (isIntel && (item.classification === "community_opportunity" || item.recommendedAction?.toLowerCase().includes("reply")));
  const isSeoIntel = isIntel && item.classification === "seo_topic";

  function run(action: () => Promise<{ ok: boolean; error?: string; message?: string; destination?: string }>) {
    startTransition(async () => {
      const result = await action();
      setToast(result.ok ? (result.message ?? "Done") : (result.error ?? "Failed"));
      if (result.ok) router.refresh();
    });
  }

  function openDraftReply() {
    onDraftReply({
      sourceType: item.sourceTable,
      sourceId: item.sourceId,
      sourceUrl: item.sourceUrl ?? "",
      sourceTitle: item.title,
      sourceBody: item.sourceBody ?? item.summary,
      platform: item.sourcePlatform ?? item.channel ?? "reddit",
      subreddit: item.subreddit,
      suggestedReply: suggestPlantPalReply({
        title: item.title,
        body: item.sourceBody ?? item.summary,
        subreddit: item.subreddit,
      }),
    });
  }

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center gap-2">
          <WorkflowStageBadge stage={item.stage} />
          <Badge variant="muted">{item.section}</Badge>
          {item.priority && <Badge variant="warning">{item.priority}</Badge>}
          {item.channel && <Badge variant="info">{item.channel}</Badge>}
          <span className="text-xs text-brand-muted">{formatDate(item.createdAt)}</span>
        </div>

        <p className="mt-2 font-medium text-brand-primary">{item.title}</p>

        {item.whyAct && (
          <p className="mt-1 text-xs text-brand-muted">
            <span className="font-medium text-brand-primary">Why surfaced:</span> {item.whyAct}
          </p>
        )}
        {item.recommendedAction && (
          <p className="mt-1 text-xs text-brand-muted">
            <span className="font-medium text-brand-primary">Recommended:</span> {item.recommendedAction}
          </p>
        )}
        {item.matchedKeywords && item.matchedKeywords.length > 0 && (
          <p className="mt-1 text-xs text-brand-muted">
            <span className="font-medium text-brand-primary">Keywords:</span> {item.matchedKeywords.join(", ")}
          </p>
        )}
        <p className="mt-1 text-xs text-brand-muted">
          Owner: {item.currentOwner ?? "founder"} · Next: {item.nextAction ?? item.recommendedAction ?? "Review"}
        </p>

        {item.summary && <p className="mt-2 line-clamp-2 text-sm text-brand-muted">{item.summary}</p>}

        <div className="mt-3 flex flex-wrap gap-2">
          {item.sourceUrl ? (
            <>
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-brand-border px-2 py-1 text-[11px] font-medium text-brand-primary hover:bg-brand-bg"
              >
                <ExternalLink className="h-3 w-3" />
                Open Source
              </a>
            </>
          ) : isIntel || isReply ? (
            <span className="rounded-lg border border-dashed border-brand-border px-2 py-1 text-[11px] text-brand-muted">
              Source link unavailable
            </span>
          ) : null}

          {isReply && (
            <button
              type="button"
              disabled={pending}
              onClick={openDraftReply}
              className="inline-flex items-center gap-1 rounded-lg border border-brand-primary/30 bg-brand-primary/5 px-2 py-1 text-[11px] font-medium text-brand-primary hover:bg-brand-primary/10 disabled:opacity-50"
            >
              <MessageSquare className="h-3 w-3" />
              Draft Reply
            </button>
          )}

          {(isIntel && !isReply && !isSeoIntel) && (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => sendIntelligenceAlertToBloomAction(item.sourceId))}
              className="inline-flex items-center gap-1 rounded-lg border border-brand-primary/30 bg-brand-primary/5 px-2 py-1 text-[11px] font-medium text-brand-primary disabled:opacity-50"
            >
              <Sparkles className="h-3 w-3" />
              Send to Bloom
            </button>
          )}

          {isSeoIntel && (
            <Link href="/seo" className="rounded-lg border border-brand-border px-2 py-1 text-[11px] font-medium text-brand-primary hover:bg-brand-bg">
              Send to SEO
            </Link>
          )}

          {item.section === "videos" && (
            <Link href={item.href} className="rounded-lg border border-brand-border px-2 py-1 text-[11px] font-medium text-brand-primary hover:bg-brand-bg">
              Review Video
            </Link>
          )}

          {item.section === "images" && (
            <Link href={item.href} className="rounded-lg border border-brand-border px-2 py-1 text-[11px] font-medium text-brand-primary hover:bg-brand-bg">
              Review Image
            </Link>
          )}

          {item.section === "seo" && (
            <Link href="/blog-pipeline" className="rounded-lg border border-brand-border px-2 py-1 text-[11px] font-medium text-brand-primary hover:bg-brand-bg">
              Review Draft
            </Link>
          )}

          {item.section === "creators" && (
            <Link href="/creators" className="rounded-lg border border-brand-border px-2 py-1 text-[11px] font-medium text-brand-primary hover:bg-brand-bg">
              View Creator
            </Link>
          )}

          {item.section === "calendar" && (
            <Link href={item.href} className="inline-flex items-center gap-1 rounded-lg border border-brand-border px-2 py-1 text-[11px] font-medium text-brand-primary hover:bg-brand-bg">
              <CalendarDays className="h-3 w-3" />
              Open Calendar
            </Link>
          )}

          {item.section === "ideas" && (
            <>
              <Link href={item.href} className="rounded-lg border border-brand-border px-2 py-1 text-[11px] font-medium text-brand-primary hover:bg-brand-bg">
                Review Idea
              </Link>
              <Link href="/agents/pipeline" className="rounded-lg border border-brand-border px-2 py-1 text-[11px] font-medium text-brand-accent hover:bg-brand-bg">
                View Workflow
              </Link>
            </>
          )}

          {(isIntel && !isReply && !isSeoIntel) && (
            <>
              <button type="button" disabled={pending} onClick={() => run(() => archiveIntelligenceAlertAction(item.sourceId))} className="rounded-lg border border-brand-border px-2 py-1 text-[11px] text-brand-muted hover:bg-brand-bg disabled:opacity-50">
                Archive
              </button>
              <button type="button" disabled={pending} onClick={() => run(() => rejectIntelligenceAlertAction(item.sourceId))} className="rounded-lg border border-brand-border px-2 py-1 text-[11px] text-rose-700 hover:bg-rose-50 disabled:opacity-50">
                Reject
              </button>
            </>
          )}

          {!isIntel && item.href.startsWith("/") && (
            <Link href={item.href} className="rounded-lg border border-brand-border px-2 py-1 text-[11px] font-medium text-brand-accent hover:bg-brand-bg">
              Open →
            </Link>
          )}
        </div>

        {toast && (
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
            {toast}
            {toast.includes("Bloom") || toast.includes("Sent") ? (
              <span className="ml-2 inline-flex gap-2">
                <Link href="/bloom" className="font-medium underline">Open Bloom</Link>
                <Link href="/agents/pipeline" className="font-medium underline">View Workflow</Link>
              </span>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function FounderInboxPanel({ inbox }: { inbox: FounderInbox }) {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as InboxTab) || "all";
  const [tab, setTab] = useState<InboxTab>(TABS.some((t) => t.id === initialTab) ? initialTab : "all");
  const [draftTarget, setDraftTarget] = useState<DraftReplyTarget | null>(null);

  const items = useMemo(() => filterInboxByTab(tab, inbox), [tab, inbox]);

  return (
    <div>
      <SummaryCards inbox={inbox} />

      <div className="mb-6 -mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-max gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                tab === t.id ? "bg-brand-primary text-white" : "bg-brand-bg text-brand-muted hover:text-brand-primary"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label} ({inbox.tabCounts[t.id]})
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Radar}
          title={`No ${tab === "all" ? "" : tab} items waiting`}
          description="Nothing in this queue right now. Run F5Bot ingest or Daily Engine for new opportunities."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <InboxCard key={`${item.section}-${item.id}`} item={item} onDraftReply={setDraftTarget} />
          ))}
        </div>
      )}

      <DraftReplyModal target={draftTarget} onClose={() => setDraftTarget(null)} />
    </div>
  );
}
