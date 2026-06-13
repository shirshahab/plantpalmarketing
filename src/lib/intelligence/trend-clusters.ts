import type { SavedIntelligenceAlert } from "@/lib/intelligence/saved-alerts-queries";

export interface TrendCluster {
  id: string;
  label: string;
  totalMentions: number;
  growthPercent: number;
  latestMentions: SavedIntelligenceAlert[];
}

import { CLUSTER_DEFS } from "@/lib/intelligence/trend-cluster-defs";

function matchesCluster(alert: SavedIntelligenceAlert, patterns: string[]): boolean {
  const blob = `${alert.title} ${alert.subreddit}`.toLowerCase();
  return patterns.some((p) => blob.includes(p));
}

function isWithinDays(iso: string, days: number): boolean {
  const t = new Date(iso).getTime();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return t >= cutoff;
}

/** Group similar alerts into trend clusters with growth velocity. */
export function computeTrendClusters(alerts: SavedIntelligenceAlert[]): TrendCluster[] {
  const clusters: TrendCluster[] = [];

  for (const def of CLUSTER_DEFS) {
    const matched = alerts.filter((a) => matchesCluster(a, def.patterns));
    if (matched.length === 0) continue;

    const recent = matched.filter((a) => isWithinDays(a.createdAt, 7));
    const prior = matched.filter(
      (a) => isWithinDays(a.createdAt, 14) && !isWithinDays(a.createdAt, 7)
    );

    let growthPercent = 0;
    if (prior.length === 0 && recent.length > 0) growthPercent = 100;
    else if (prior.length > 0) {
      growthPercent = Math.round(((recent.length - prior.length) / prior.length) * 100);
    }

    clusters.push({
      id: def.id,
      label: def.label,
      totalMentions: matched.length,
      growthPercent,
      latestMentions: matched.slice(0, 3),
    });
  }

  return clusters.sort((a, b) => b.totalMentions - a.totalMentions);
}
