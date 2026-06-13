"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import {
  generateImageAssetsBatchAction,
  generateImageFromBloomAction,
  generateImageFromSeoAction,
  generateImageFromTrendsAction,
} from "@/lib/actions/image-batch-actions";

export function ImageStudioBatchPanel({
  counters,
}: {
  counters: {
    pendingReview: number;
    approvedToday: number;
    rejectedToday: number;
    scheduled: number;
    published: number;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  return (
    <div className="mb-8 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Pending Review" value={counters.pendingReview} icon={ImageIcon} />
        <StatCard label="Approved Today" value={counters.approvedToday} icon={ImageIcon} />
        <StatCard label="Rejected Today" value={counters.rejectedToday} icon={ImageIcon} />
        <StatCard label="Scheduled" value={counters.scheduled} icon={ImageIcon} />
        <StatCard label="Published" value={counters.published} icon={ImageIcon} />
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-brand-border bg-white p-4">
        <Button size="sm" disabled={pending} onClick={() => run(() => generateImageAssetsBatchAction(10))}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Generate 10 Assets
        </Button>
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => generateImageAssetsBatchAction(25))}>
          Generate 25 Assets
        </Button>
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => generateImageFromTrendsAction())}>
          Generate From Trends
        </Button>
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => generateImageFromSeoAction())}>
          Generate From SEO
        </Button>
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => generateImageFromBloomAction())}>
          Generate From Bloom
        </Button>
      </div>
    </div>
  );
}
