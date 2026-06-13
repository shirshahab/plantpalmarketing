"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { VideoQueueItem } from "@/lib/pipeline/video-queue";
import { formatDate } from "@/lib/utils";

export function VideoQueueItemActions({ item }: { item: VideoQueueItem }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function rejectItem() {
    startTransition(async () => {
      await fetch(`/api/video/item/${item.id}/reject`, { method: "POST" });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/calendar">
        <Button size="sm" variant="secondary">Send to Calendar</Button>
      </Link>
      <Button size="sm" variant="ghost" disabled={pending} onClick={rejectItem}>
        Reject
      </Button>
    </div>
  );
}

export function VideoQueueItemDetail({ item }: { item: VideoQueueItem }) {
  const scenes = [
    { label: "Hook", description: item.hook },
    { label: "Concept", description: item.concept },
    { label: "CTA", description: "Download PlantPal — scan your plant and get care tips instantly." },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Badge variant="info">{item.sourceLabel}</Badge>
        <Badge variant="muted">{item.platform}</Badge>
        <Badge variant="success">{item.status}</Badge>
        {item.metadata.plant_relevance_score != null && (
          <Badge variant="info">Relevance {item.metadata.plant_relevance_score}/100</Badge>
        )}
      </div>

      <div>
        <h2 className="font-heading text-2xl font-semibold text-brand-primary">{item.title}</h2>
        <p className="mt-2 rounded-xl bg-brand-accent/10 px-4 py-3 text-sm font-medium text-brand-primary">
          Hook: {item.hook}
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-brand-primary">Concept</h3>
        <p className="mt-1 text-sm text-brand-muted">{item.concept}</p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-brand-primary">Scenes</h3>
        <div className="mt-2 space-y-2">
          {scenes.map((s) => (
            <div key={s.label} className="rounded-xl border border-brand-border p-3">
              <p className="text-xs font-semibold text-brand-primary">{s.label}</p>
              <p className="mt-1 text-sm text-brand-muted">{s.description}</p>
            </div>
          ))}
        </div>
      </div>

      {item.metadata.original_title && item.metadata.original_title !== item.title && (
        <div className="rounded-xl border border-brand-border bg-brand-bg p-4">
          <h3 className="text-xs font-semibold uppercase text-brand-muted">Original source</h3>
          <p className="mt-1 text-sm text-brand-muted">{item.metadata.original_title}</p>
          {item.metadata.original_url && (
            <a
              href={item.metadata.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-brand-accent underline"
            >
              Open original
            </a>
          )}
        </div>
      )}

      <div className="text-xs text-brand-muted">
        Created {formatDate(item.createdAt)} · Priority {item.priority}
      </div>

      <VideoQueueItemActions item={item} />
    </div>
  );
}
