import { CLUSTER_DEFS } from "@/lib/intelligence/trend-cluster-defs";
import { computeTrendClusters } from "@/lib/intelligence/trend-clusters";
import { getSavedIntelligenceAlerts } from "@/lib/intelligence/saved-alerts-queries";
import { createPlantAngleFromTrend } from "@/lib/content/trendPlantAngle";

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

  const sourceBreakdown: Record<string, number> = {};
  const competitorAlerts = matched.filter((a) =>
    a.classification === "competitor_mention" || a.title.toLowerCase().includes("competitor")
  );
  for (const alert of matched) {
    const src = alert.source || "unknown";
    sourceBreakdown[src] = (sourceBreakdown[src] ?? 0) + 1;
  }

  const plantAngle = createPlantAngleFromTrend({
    title: summary.label,
    source: "intelligence",
    summary: matched.map((a) => a.title).slice(0, 5).join(". "),
    category: def.id,
  });

  return {
    ...summary,
    alerts: matched,
    patterns: def.patterns,
    sourceBreakdown,
    competitorAlerts,
    plantAngle,
  };
}
