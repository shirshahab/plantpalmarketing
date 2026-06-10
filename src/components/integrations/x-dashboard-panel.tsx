"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  CheckSquare, Heart, Loader2, MessageSquare, RefreshCw, Send, Twitter, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import {
  gateApproveXPost,
  publishXPost,
  rejectXPost,
  syncXIntegration,
} from "@/lib/actions/integrations";
import type { XAccountSnapshot, XPost, XPostQueueItem } from "@/lib/types";

function QueueSection({
  title,
  items,
  actions,
}: {
  title: string;
  items: XPostQueueItem[];
  actions?: (item: XPostQueueItem) => React.ReactNode;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-brand-border p-4 text-sm text-brand-muted">
        No items in {title.toLowerCase()}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-xl border border-brand-border bg-brand-bg/40 p-4">
          <p className="text-sm text-brand-primary">{item.text}</p>
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

export function XDashboardPanel({
  snapshot,
  recentPosts,
  topPosts,
  drafts,
  gateQueue,
  publishQueue,
  stats,
}: {
  snapshot: XAccountSnapshot | null;
  recentPosts: XPost[];
  topPosts: XPost[];
  drafts: XPostQueueItem[];
  gateQueue: XPostQueueItem[];
  publishQueue: XPostQueueItem[];
  stats: {
    followerCount: number;
    engagement: number;
    draftCount: number;
    approvalCount: number;
    queuedCount: number;
    publishedCount: number;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function runAction(fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) {
    setMessage(null);
    startTransition(async () => {
      const res = await fn();
      setMessage(res.ok ? res.message ?? "Done" : res.error ?? "Failed");
      router.refresh();
    });
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
                Bloom → Sage → Gate → Sprout → X. Human approval required. No auto-publish.
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

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Followers" value={stats.followerCount} icon={Users} />
        <StatCard label="Recent Engagement" value={stats.engagement} icon={Heart} />
        <StatCard label="Draft Queue" value={stats.draftCount} icon={MessageSquare} />
        <StatCard label="Gate Approval" value={stats.approvalCount} icon={CheckSquare} />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-brand-border bg-white p-5">
          <h3 className="font-heading font-semibold text-brand-primary">Recent Posts</h3>
          <div className="mt-4 space-y-3">
            {recentPosts.length === 0 ? (
              <p className="text-sm text-brand-muted">No posts cached. Sync from X or run migration 030.</p>
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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-brand-border bg-white p-5">
          <h3 className="mb-4 font-heading font-semibold text-brand-primary">Draft Queue</h3>
          <QueueSection title="Drafts" items={drafts} />
        </div>

        <div className="rounded-2xl border border-brand-border bg-white p-5">
          <h3 className="mb-4 font-heading font-semibold text-brand-primary">Approval Queue (Gate)</h3>
          <QueueSection
            title="Gate"
            items={gateQueue}
            actions={(item) => (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={pending}
                  onClick={() => runAction(() => gateApproveXPost(item.id))}
                >
                  Approve
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

        <div className="rounded-2xl border border-brand-border bg-white p-5">
          <h3 className="mb-4 font-heading font-semibold text-brand-primary">Publishing Queue (Sprout)</h3>
          <QueueSection
            title="Publish"
            items={publishQueue}
            actions={(item) => (
              <Button
                size="sm"
                disabled={pending || !item.gateApproved}
                onClick={() => runAction(() => publishXPost(item.id))}
              >
                <Send className="h-3.5 w-3.5" />
                Publish (manual)
              </Button>
            )}
          />
          <p className="mt-3 text-xs text-brand-muted">
            {stats.publishedCount} published via queue. Sprout never auto-publishes.
          </p>
        </div>
      </div>
    </div>
  );
}
