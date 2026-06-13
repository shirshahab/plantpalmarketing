"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  archiveTrendClusterAlertsAction,
  sendTrendClusterToBloomAction,
  sendTrendClusterToImageAction,
  sendTrendClusterToSeoAction,
  sendTrendClusterToVideoAction,
} from "@/lib/actions/trend-cluster-actions";

export function TrendClusterDetailActions({
  clusterId,
  alertIds,
}: {
  clusterId: string;
  alertIds: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <Button size="sm" disabled={pending} onClick={() => run(() => sendTrendClusterToBloomAction(clusterId, alertIds))}>
        Send to Bloom
      </Button>
      <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => sendTrendClusterToVideoAction(clusterId, alertIds))}>
        Video Studio
      </Button>
      <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => sendTrendClusterToImageAction(clusterId, alertIds))}>
        Image Studio
      </Button>
      <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => sendTrendClusterToSeoAction(clusterId, alertIds))}>
        SEO Factory
      </Button>
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => archiveTrendClusterAlertsAction(alertIds))}>
        Archive
      </Button>
    </div>
  );
}
