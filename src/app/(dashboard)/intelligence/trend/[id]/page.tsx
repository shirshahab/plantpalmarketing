import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { TrendClusterDetailActions } from "@/components/intelligence/trend-cluster-detail-actions";
import { getTrendClusterById } from "@/lib/intelligence/trend-cluster-detail";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TrendDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cluster = await getTrendClusterById(id);
  if (!cluster) notFound();

  return (
    <div>
      <PageHeader
        title={cluster.label}
        description={`Trend cluster · ${cluster.totalMentions} mentions · ${cluster.growthPercent >= 0 ? "+" : ""}${cluster.growthPercent}% growth`}
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge variant="info">{cluster.totalMentions} mentions</Badge>
        <Badge variant={cluster.growthPercent >= 0 ? "success" : "warning"}>
          {cluster.growthPercent >= 0 ? "+" : ""}
          {cluster.growthPercent}% growth
        </Badge>
        <Link href="/intelligence" className="text-sm text-brand-accent underline">
          Back to Intelligence
        </Link>
      </div>

      <TrendClusterDetailActions clusterId={cluster.id} alertIds={cluster.alerts.map((a) => a.id)} />

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-brand-border bg-white p-4">
          <h3 className="text-sm font-semibold text-brand-primary">Source breakdown</h3>
          <ul className="mt-2 space-y-1 text-sm text-brand-muted">
            {Object.entries(cluster.sourceBreakdown).map(([src, count]) => (
              <li key={src} className="flex justify-between">
                <span className="capitalize">{src}</span>
                <span className="font-semibold tabular-nums">{count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <h3 className="text-sm font-semibold text-brand-primary">Suggested PlantPal angle</h3>
          {cluster.plantAngle.shouldUse ? (
            <div className="mt-2 space-y-2 text-sm text-brand-muted">
              <p>{cluster.plantAngle.plantAngle}</p>
              {cluster.plantAngle.suggestedVideoHook && (
                <p className="text-xs">
                  <span className="font-semibold text-brand-primary">Video hook:</span> {cluster.plantAngle.suggestedVideoHook}
                </p>
              )}
              {cluster.plantAngle.suggestedBlogIdea && (
                <p className="text-xs">
                  <span className="font-semibold text-brand-primary">Blog idea:</span> {cluster.plantAngle.suggestedBlogIdea}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-brand-muted">{cluster.plantAngle.skipReason ?? "No safe plant angle for this trend."}</p>
          )}
        </div>
      </div>

      {cluster.competitorAlerts.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <h3 className="text-sm font-semibold text-brand-primary">Competitor mentions ({cluster.competitorAlerts.length})</h3>
          <ul className="mt-2 space-y-1 text-sm text-brand-muted">
            {cluster.competitorAlerts.slice(0, 5).map((a) => (
              <li key={a.id}>{a.title}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-brand-primary">Related alerts</h3>
        {cluster.alerts.map((alert) => (
          <div key={alert.id} className="rounded-xl border border-brand-border bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              {alert.classification && <Badge variant="info">{alert.classification}</Badge>}
              {alert.priority && <Badge variant="warning">{alert.priority}</Badge>}
              {alert.assignedAgent && (
                <Badge variant="success" className="capitalize">
                  {alert.assignedAgent}
                </Badge>
              )}
              {alert.subreddit && <Badge variant="muted">r/{alert.subreddit}</Badge>}
              <span className="text-xs text-brand-muted">{formatDate(alert.createdAt)}</span>
            </div>
            <p className="mt-2 font-medium text-brand-primary">{alert.title}</p>
            {alert.body && <p className="mt-1 text-sm text-brand-muted">{alert.body.slice(0, 300)}</p>}
            {alert.url && (
              <a
                href={alert.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block break-all text-xs text-brand-accent underline"
              >
                {alert.url}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
