import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { SavedIntelligenceAlert } from "@/lib/intelligence/saved-alerts-queries";

const CLASSIFICATION_LABELS: Record<string, string> = {
  community_opportunity: "Community",
  content_idea: "Content idea",
  seo_topic: "SEO topic",
  competitor_alert: "Competitor",
  creator_opportunity: "Creator",
  product_feedback: "Product feedback",
  ignore: "Ignore",
};

const PRIORITY_VARIANT: Record<string, "success" | "warning" | "danger" | "info" | "muted"> = {
  high: "warning",
  medium: "info",
  low: "muted",
};

export function IntelligenceAlertsList({
  alerts,
  total,
}: {
  alerts: SavedIntelligenceAlert[];
  total: number;
}) {
  if (alerts.length === 0) {
    return (
      <p className="text-sm text-brand-muted">
        No saved alerts yet. Run ingest from{" "}
        <Link href="/admin/f5bot-test" className="font-medium text-brand-primary underline">
          F5Bot Test
        </Link>
        .
      </p>
    );
  }

  return (
    <div>
      <p className="mb-3 text-sm text-brand-muted">
        Showing {alerts.length} of {total} saved alert{total === 1 ? "" : "s"}
      </p>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <Card key={alert.id}>
            <CardContent className="py-4">
              <p className="text-sm font-medium text-brand-primary">{alert.title || "Untitled"}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="info">{alert.source}</Badge>
                {alert.subreddit && <Badge variant="muted">r/{alert.subreddit}</Badge>}
                <Badge variant={alert.status === "new" ? "warning" : "success"}>{alert.status}</Badge>
                {alert.classification && (
                  <Badge variant="muted">
                    {CLASSIFICATION_LABELS[alert.classification] ?? alert.classification}
                  </Badge>
                )}
                {alert.priority && (
                  <Badge variant={PRIORITY_VARIANT[alert.priority] ?? "muted"}>{alert.priority}</Badge>
                )}
                {alert.assignedAgent && (
                  <Badge variant="success" className="capitalize">
                    → {alert.assignedAgent}
                  </Badge>
                )}
                <span className="text-xs text-brand-muted">{formatDate(alert.createdAt)}</span>
              </div>
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
