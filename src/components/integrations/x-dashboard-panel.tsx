"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  Heart,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  Twitter,
  Users,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import {
  approveXForGate,
  gateApproveXPost,
  publishXPost,
  rejectXPost,
  syncXIntegration,
} from "@/lib/actions/integrations";
import type { XPublishCredentialStatus } from "@/lib/integrations/config";
import { X_TWEET_MAX_LENGTH } from "@/lib/integrations/x-publish-readiness";
import type { XAccountSnapshot, XPost, XPostQueueItem } from "@/lib/types";

function QueueSection({
  title,
  items,
  actions,
  emptyHint,
}: {
  title: string;
  items: XPostQueueItem[];
  actions?: (item: XPostQueueItem) => React.ReactNode;
  emptyHint?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-brand-border p-4 text-sm text-brand-muted">
        {emptyHint ?? `No items in ${title.toLowerCase()}`}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-xl border border-brand-border bg-brand-bg/40 p-4">
          <p className="text-sm text-brand-primary whitespace-pre-wrap">{item.text}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-brand-muted">
            <span>{item.text.length}/{X_TWEET_MAX_LENGTH} chars</span>
            {item.sageApproved && (
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-violet-800">Sage ✓</span>
            )}
            {item.gateApproved && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">Gate ✓</span>
            )}
            {item.publishedTweetId && (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-800">
                Tweet {item.publishedTweetId}
              </span>
            )}
          </div>
          {item.errorMessage && (
            <p className="mt-2 text-xs text-rose-700">{item.errorMessage}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-brand-muted">
            <span>
              {item.status} · {item.createdByAgent} ·{" "}
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </span>
            {actions?.(item)}
          </div>
        </div>
      ))}
    </div>
  );
}

function canShowPublishButton(
  item: XPostQueueItem,
  credentials: XPublishCredentialStatus
): { allowed: boolean; reason?: string } {
  if (!item.sageApproved) return { allowed: false, reason: "Needs Sage approval" };
  if (!item.gateApproved) return { allowed: false, reason: "Needs Gate approval" };
  if (!["ready_to_publish", "queued"].includes(item.status)) {
    return { allowed: false, reason: "Not Ready to Publish" };
  }
  if (item.publishedTweetId) return { allowed: false, reason: "Already published" };
  if (!item.text.trim()) return { allowed: false, reason: "Empty content" };
  if (item.text.trim().length > X_TWEET_MAX_LENGTH) {
    return { allowed: false, reason: "Over character limit" };
  }
  if (!credentials.publishConnected) {
    return {
      allowed: false,
      reason: `Missing publish credentials: ${credentials.missingPublishVars.join(", ")}`,
    };
  }
  return { allowed: true };
}

export function XDashboardPanel({
  snapshot,
  recentPosts,
  topPosts,
  drafts,
  sageQueue,
  gateQueue,
  publishQueue,
  publishCredentials,
  stats,
}: {
  snapshot: XAccountSnapshot | null;
  recentPosts: XPost[];
  topPosts: XPost[];
  drafts: XPostQueueItem[];
  sageQueue: XPostQueueItem[];
  gateQueue: XPostQueueItem[];
  publishQueue: XPostQueueItem[];
  publishCredentials: XPublishCredentialStatus;
  stats: {
    followerCount: number;
    engagement: number;
    draftCount: number;
    sageCount: number;
    approvalCount: number;
    readyCount: number;
    publishedCount: number;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function runAction(fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) {
    setMessage(null);
    startTransition(async () => {
      const res = await fn();
      setMessage(res.ok ? res.message ?? "Done" : res.error ?? "Failed");
      setConfirmId(null);
      router.refresh();
    });
  }

  function handlePublishClick(item: XPostQueueItem) {
    const check = canShowPublishButton(item, publishCredentials);
    if (!check.allowed) {
      setMessage(check.reason ?? "Cannot publish");
      return;
    }
    setConfirmId(item.id);
  }

  function confirmPublish(item: XPostQueueItem) {
    const preview = item.text.trim().slice(0, 120);
    const ok = window.confirm(
      `Publish to X?\n\nThis is a one-way human action. No auto-posting.\n\n"${preview}${item.text.length > 120 ? "…" : ""}"`
    );
    if (!ok) {
      setConfirmId(null);
      return;
    }
    runAction(() => publishXPost(item.id));
  }

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-slate-200/60 bg-gradient-to-br from-slate-50 to-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Twitter className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-brand-primary">
                X Dashboard — @{snapshot?.username ?? "PlantPalApp"}
              </h2>
              <p className="text-sm text-brand-muted">
                Bloom → Sage → Gate → Sprout → Ready to Publish → human Publish to X
              </p>
            </div>
          </div>
          <Button disabled={pending} onClick={() => runAction(syncXIntegration)}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sync from X API
          </Button>
        </div>
        {message && <p className="mt-3 text-sm text-brand-primary">{message}</p>}
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-brand-border/60 bg-white p-4 text-sm">
          <p className="flex items-center gap-2 font-medium text-brand-primary">
            {publishCredentials.readConnected ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <XCircle className="h-4 w-4 text-rose-500" />
            )}
            Read access {publishCredentials.readConnected ? "connected" : "missing"}
          </p>
          {!publishCredentials.readConnected && (
            <p className="mt-1 text-xs text-brand-muted">Set X_BEARER_TOKEN in server env</p>
          )}
        </div>
        <div className="rounded-xl border border-brand-border/60 bg-white p-4 text-sm">
          <p className="flex items-center gap-2 font-medium text-brand-primary">
            {publishCredentials.publishConnected ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            )}
            Publish access {publishCredentials.publishConnected ? "connected" : "missing"}
          </p>
          {!publishCredentials.publishConnected && (
            <p className="mt-1 text-xs text-brand-muted">
              Missing: {publishCredentials.missingPublishVars.join(", ")}
            </p>
          )}
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Followers" value={stats.followerCount} icon={Users} />
        <StatCard label="Engagement" value={stats.engagement} icon={Heart} />
        <StatCard label="Drafts" value={stats.draftCount} icon={MessageSquare} />
        <StatCard label="Gate queue" value={stats.approvalCount} icon={CheckSquare} />
        <StatCard label="Ready to Publish" value={stats.readyCount} icon={Send} />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-brand-border bg-white p-5">
          <h3 className="font-heading font-semibold text-brand-primary">Recent Posts</h3>
          <div className="mt-4 space-y-3">
            {recentPosts.length === 0 ? (
              <p className="text-sm text-brand-muted">No posts cached yet. Sync from X to populate.</p>
            ) : (
              recentPosts.map((p) => (
                <div key={p.id} className="rounded-xl border border-brand-border/60 p-3">
                  <p className="text-sm">{p.text}</p>
                  <p className="mt-1 text-xs text-brand-muted">
                    ♥ {p.likeCount} · ↻ {p.retweetCount} · 💬 {p.replyCount}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-brand-border bg-white p-5">
          <h3 className="font-heading font-semibold text-brand-primary">Top Performing</h3>
          <div className="mt-4 space-y-3">
            {topPosts.map((p) => (
              <div key={p.id} className="rounded-xl border border-brand-border/60 p-3">
                <p className="text-sm">{p.text}</p>
                <p className="mt-1 text-xs font-medium text-emerald-700">♥ {p.likeCount} likes</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border-2 border-amber-200/80 bg-amber-50/50 p-5">
        <h3 className="mb-1 font-heading font-semibold text-brand-primary">Ready to Publish</h3>
        <p className="mb-4 text-xs text-brand-muted">
          Requires Sage ✓ · Gate ✓ · Sprout queued · publish credentials · human confirmation. No auto-posting.
        </p>
        <QueueSection
          title="Ready to Publish"
          items={publishQueue}
          emptyHint="No posts ready — approve through Sage and Gate first"
          actions={(item) => {
            const check = canShowPublishButton(item, publishCredentials);
            if (confirmId === item.id) {
              return (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" disabled={pending} onClick={() => confirmPublish(item)}>
                    Confirm Publish to X
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setConfirmId(null)}>
                    Cancel
                  </Button>
                </div>
              );
            }
            return (
              <Button
                size="sm"
                disabled={pending || !check.allowed}
                title={check.reason}
                onClick={() => handlePublishClick(item)}
              >
                <Send className="h-3.5 w-3.5" />
                Publish to X
              </Button>
            );
          }}
        />
        <p className="mt-3 text-xs text-brand-muted">
          {stats.publishedCount} published via queue. Sprout never auto-publishes.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-brand-border bg-white p-5">
          <h3 className="mb-4 font-heading font-semibold text-brand-primary">Draft Queue</h3>
          <QueueSection title="Drafts" items={drafts} />
        </div>

        <div className="rounded-2xl border border-brand-border bg-white p-5">
          <h3 className="mb-4 font-heading font-semibold text-brand-primary">Sage Review</h3>
          <QueueSection
            title="Sage"
            items={sageQueue}
            actions={(item) => (
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() => runAction(() => approveXForGate(item.id))}
              >
                Send to Gate
              </Button>
            )}
          />
        </div>

        <div className="rounded-2xl border border-brand-border bg-white p-5">
          <h3 className="mb-4 font-heading font-semibold text-brand-primary">Gate Approval</h3>
          <QueueSection
            title="Gate"
            items={gateQueue}
            actions={(item) => (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={pending || !item.sageApproved}
                  title={!item.sageApproved ? "Sage must approve first" : undefined}
                  onClick={() => runAction(() => gateApproveXPost(item.id))}
                >
                  Approve → Ready
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={pending}
                  onClick={() => runAction(() => rejectXPost(item.id))}
                >
                  Reject
                </Button>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
}
