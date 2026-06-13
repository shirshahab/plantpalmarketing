"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clapperboard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateVideoQueueBatchAction } from "@/lib/actions/video-queue-actions";
import type { VideoQueueItem } from "@/lib/pipeline/video-queue";
import { formatDate } from "@/lib/utils";

export function VideoQueuePanel({ items }: { items: VideoQueueItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

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
            Pulls from approved Bloom items, trends, Reddit opportunities, SEO keywords, and founder ideas.
          </p>
        </div>
        <Button disabled={pending} onClick={() => handleGenerate(10)}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clapperboard className="h-4 w-4" />}
          Generate 10 Videos
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-brand-muted">Queue empty. Click Generate 10 Videos to fill from all pipelines.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {items.slice(0, 10).map((item) => (
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
