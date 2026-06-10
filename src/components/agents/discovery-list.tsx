import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { DiscoveryItemRecord } from "@/lib/types";

const typeLabels: Record<DiscoveryItemRecord["itemType"], string> = {
  trending_topic: "Trending",
  question: "Question",
  content_opportunity: "Opportunity",
};

const typeVariants: Record<DiscoveryItemRecord["itemType"], "success" | "warning" | "muted"> = {
  trending_topic: "success",
  question: "warning",
  content_opportunity: "muted",
};

export function DiscoveryList({ items }: { items: DiscoveryItemRecord[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-brand-muted">
        No discovery items yet. Run the daily pipeline to populate today&apos;s brief.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <Card key={item.id} className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={typeVariants[item.itemType]}>{typeLabels[item.itemType]}</Badge>
            <Badge variant="muted">{item.source}</Badge>
            <span className="ml-auto text-xs font-medium text-brand-primary">
              Relevance {item.relevanceScore}
            </span>
          </div>
          <h3 className="mt-2 font-heading text-sm font-semibold text-brand-primary">{item.title}</h3>
          <p className="mt-1 text-sm text-brand-muted">{item.description}</p>
        </Card>
      ))}
    </div>
  );
}
