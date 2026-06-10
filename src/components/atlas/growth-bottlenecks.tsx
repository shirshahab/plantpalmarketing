"use client";

import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AtlasBottleneck } from "@/lib/types";

export function GrowthBottlenecks({ bottlenecks }: { bottlenecks: AtlasBottleneck[] }) {
  if (bottlenecks.length === 0) {
    return <p className="text-sm text-brand-muted">No active bottlenecks detected.</p>;
  }

  return (
    <div className="space-y-3">
      {bottlenecks.map((b) => (
        <div
          key={b.id}
          className={`rounded-xl border p-4 ${
            b.severity === "high"
              ? "border-rose-200 bg-rose-50/50"
              : b.severity === "medium"
                ? "border-amber-200 bg-amber-50/50"
                : "border-brand-border bg-white"
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${b.severity === "high" ? "text-rose-600" : "text-amber-600"}`} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-brand-primary">{b.title}</p>
                <Badge variant={b.severity === "high" ? "danger" : b.severity === "medium" ? "warning" : "muted"}>
                  {b.severity}
                </Badge>
                <span className="text-[10px] text-brand-sage">{b.bottleneckType.replace(/_/g, " ")}</span>
              </div>
              <p className="mt-1 text-sm text-brand-muted">{b.description}</p>
              <p className="mt-2 rounded-lg border border-brand-border/50 bg-white/80 px-3 py-2 text-sm text-brand-primary">
                <span className="font-medium">Fix: </span>{b.suggestedFix}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
