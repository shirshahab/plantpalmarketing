"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  generateImageAssetsBatchAction,
  generateImageFromBloomAction,
  generateImageFromSeoAction,
  generateImageFromTrendsAction,
} from "@/lib/actions/image-batch-actions";

type ImageTab = "pending" | "approved" | "rejected" | "scheduled";

const TABS: { id: ImageTab; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "scheduled", label: "Scheduled" },
];

export function ImageStudioTabs({
  counters,
  activeTab,
}: {
  counters: {
    pendingReview: number;
    approvedToday: number;
    rejectedToday: number;
    scheduled: number;
  };
  activeTab: ImageTab;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function setTab(tab: ImageTab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`/images?${params.toString()}`);
  }

  function run(fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  const tabCounts: Record<ImageTab, number> = {
    pending: counters.pendingReview,
    approved: counters.approvedToday,
    rejected: counters.rejectedToday,
    scheduled: counters.scheduled,
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="rounded-2xl border border-brand-border bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-heading font-semibold text-brand-primary">Batch generation</h3>
            <p className="mt-0.5 text-xs text-brand-muted">
              Minimum 50 pending prompts maintained. Approved/rejected hidden from default view.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={pending} onClick={() => run(() => generateImageAssetsBatchAction(10))}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
              Generate 10
            </Button>
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => generateImageAssetsBatchAction(25))}>
              Generate 25
            </Button>
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(generateImageFromTrendsAction)}>
              From Trends
            </Button>
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(generateImageFromBloomAction)}>
              From Bloom
            </Button>
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(generateImageFromSeoAction)}>
              From SEO
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-brand-border pb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              activeTab === t.id ? "bg-brand-primary text-white" : "text-brand-muted hover:bg-brand-bg"
            }`}
          >
            {t.label} ({tabCounts[t.id]})
          </button>
        ))}
      </div>
    </div>
  );
}
