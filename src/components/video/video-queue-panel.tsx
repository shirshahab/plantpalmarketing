"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clapperboard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  cleanupBadVideoQueueItemsAction,
  generateVideoQueueBatchAction,
} from "@/lib/actions/video-queue-actions";
import type { VideoQueueItem } from "@/lib/pipeline/video-queue";
import { formatDate } from "@/lib/utils";

type QueueTab = "pending" | "generating" | "review" | "approved" | "scheduled";

const TABS: { id: QueueTab; label: string; statuses: string[] }[] = [
  { id: "pending", label: "Pending", statuses: ["pending"] },
  { id: "generating", label: "Generating", statuses: ["script_generated", "in_production"] },
  { id: "review", label: "Review", statuses: ["review", "pending_review"] },
  { id: "approved", label: "Approved", statuses: ["approved"] },
  { id: "scheduled", label: "Scheduled", statuses: ["scheduled"] },
];

export function VideoQueuePanel({
  items,
  showCleanup = false,
}: {
  items: VideoQueueItem[];
  showCleanup?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<QueueTab>("pending");
  const [message, setMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const statuses = TABS.find((t) => t.id === tab)?.statuses ?? ["pending"];
    return items.filter((i) => statuses.includes(i.status));
  }, [items, tab]);

  function handleGenerate(count: number) {
    setMessage(null);
    startTransition(async () => {
      const result = await generateVideoQueueBatchAction(count);
      setMessage(result.ok ? (result.message ?? "Done") : result.error ?? "Failed");
      router.refresh();
    });
  }

  function handleCleanup() {
    setMessage(null);
    startTransition(async () => {
      const result = await cleanupBadVideoQueueItemsAction();
      setMessage(result.ok ? (result.message ?? "Cleaned") : result.error ?? "Failed");
      router.refresh();
    });
  }

  return (
    <div className="mb-6 rounded-2xl border border-brand-border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-heading font-semibold text-brand-primary">Video generation queue</h3>
          <p className="mt-0.5 text-xs text-brand-muted">
            Video concepts from approved Bloom ideas. Intelligence → Bloom → here.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {showCleanup && (
            <Button size="sm" variant="secondary" disabled={pending} onClick={handleCleanup}>
              Clean Bad Queue Items
            </Button>
          )}
          <Button disabled={pending} onClick={() => handleGenerate(10)}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clapperboard className="h-4 w-4" />}
            Generate 10 Videos
          </Button>
        </div>
      </div>

      {message && (
        <p className="mt-3 text-sm text-brand-primary">{message}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2 border-b border-brand-border pb-3">
        {TABS.map((t) => {
          const count = items.filter((i) => t.statuses.includes(i.status)).length;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                tab === t.id ? "bg-brand-primary text-white" : "text-brand-muted hover:bg-brand-bg"
              }`}
            >
              {t.label} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-4 text-sm text-brand-muted">
          {tab === "pending"
            ? "No approved video concepts yet. Send ideas from Bloom, SEO, Trends, or Reddit Opportunities."
            : `No items in ${tab}.`}
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {filtered.slice(0, 15).map((item) => (
            <Link
              key={item.id}
              href={`/video/item/${item.id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-border/60 px-3 py-2 transition hover:border-brand-accent hover:shadow-sm"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-brand-primary">{item.title}</p>
                <p className="truncate text-xs text-brand-muted">{item.hook}</p>
                <p className="mt-0.5 text-[10px] font-medium text-brand-sage">Source: {item.sourceLabel}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="muted">{item.platform}</Badge>
                <Badge variant="info">{item.status}</Badge>
                <span className="text-[10px] text-brand-muted">{formatDate(item.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
