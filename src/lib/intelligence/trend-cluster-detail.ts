import { CLUSTER_DEFS } from "@/lib/intelligence/trend-cluster-defs";
import { computeTrendClusters } from "@/lib/intelligence/trend-clusters";
import { getSavedIntelligenceAlerts } from "@/lib/intelligence/saved-alerts-queries";

export async function getTrendClusterById(id: string) {
  const def = CLUSTER_DEFS.find((c) => c.id === id);
  if (!def) return null;

  const { alerts } = await getSavedIntelligenceAlerts({}, 500);
  const clusters = computeTrendClusters(alerts);
  const summary = clusters.find((c) => c.id === id);
  if (!summary) return null;

  const matched = alerts.filter((a) => {
    const blob = `${a.title} ${a.subreddit}`.toLowerCase();
    return def.patterns.some((p) => blob.includes(p));
  });

  return {
    ...summary,
    alerts: matched,
    patterns: def.patterns,
  };
}
