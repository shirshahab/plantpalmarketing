"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { EchoFeatureRequest } from "@/lib/types";

const TREND_STYLES: Record<string, string> = {
  rising: "text-emerald-700 bg-emerald-50",
  emerging: "text-sky-700 bg-sky-50",
  stable: "text-brand-muted bg-brand-bg",
  declining: "text-rose-700 bg-rose-50",
};

export function FeatureRequestBoard({ requests }: { requests: EchoFeatureRequest[] }) {
  if (requests.length === 0) {
    return <p className="text-sm text-brand-muted">No feature requests tracked.</p>;
  }

  return (
    <div className="space-y-3">
      {requests.map((req, i) => (
        <Card key={req.id}>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-brand-sage">#{i + 1}</span>
              <Badge variant={req.priority >= 85 ? "danger" : req.priority >= 70 ? "warning" : "muted"}>
                Priority {req.priority}
              </Badge>
              <Badge variant="info">{req.frequency} requests</Badge>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TREND_STYLES[req.trend] ?? ""}`}>
                {req.trend}
              </span>
            </div>
            <p className="mt-2 font-medium text-brand-primary">{req.featureName}</p>
            <p className="mt-1 text-sm text-brand-muted">{req.description}</p>
            <p className="mt-2 text-[10px] text-brand-sage">
              Impact {req.impact} · Est. demand {req.estimatedDemand} users · {req.category.replace(/_/g, " ")}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
