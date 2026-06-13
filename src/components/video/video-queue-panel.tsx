"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clapperboard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateVideoQueueBatchAction } from "@/lib/actions/video-queue-actions";
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

export function VideoQueuePanel({ items }: { items: VideoQueueItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<QueueTab>("pending");

  const filtered = useMemo(() => {
    const statuses = TABS.find((t) => t.id === tab)?.statuses ?? ["pending"];
    return items.filter((i) => statuses.includes(i.status));
  }, [items, tab]);

  function handleGenerate(count: number) {
    startTransition(async () => {
      await generateVideoQueueBatchAction(count);
      router.refresh();
    });
  }

  return (
    <div className="mb-6 rounded-2xl border border-brand-border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-heading font-semibold text-brand-primary">Video generation queue</h3>
          <p className="mt-0.5 text-xs text-brand-muted">
            Sources: approved ideas, Bloom, SEO, trends, Reddit, competitor alerts. Minimum 20 pending maintained.
          </p>
        </div>
        <Button disabled={pending} onClick={() => handleGenerate(10)}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clapperboard className="h-4 w-4" />}
          Generate 10 Videos
        </Button>
      </div>

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
        <p className="mt-4 text-sm text-brand-muted">No items in {tab}. Click Generate 10 Videos to refill.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {filtered.slice(0, 15).map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-border/60 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-brand-primary">{item.title}</p>
                <p className="truncate text-xs text-brand-muted">{item.hook}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="muted">{item.platform}</Badge>
                <Badge variant="info">{item.status}</Badge>
                <span className="text-[10px] text-brand-muted">{formatDate(item.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
