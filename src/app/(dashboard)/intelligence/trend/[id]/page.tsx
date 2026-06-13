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

      <div className="space-y-3">
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
