"use client";

import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EchoChurnRisk } from "@/lib/types";

const REASON_LABELS: Record<string, string> = {
  confusion: "Confusion",
  missing_features: "Missing Features",
  pricing: "Pricing",
  bugs: "Bugs",
  poor_experience: "Poor Experience",
  other: "Other",
};

export function ChurnRisks({ risks }: { risks: EchoChurnRisk[] }) {
  if (risks.length === 0) {
    return <p className="text-sm text-brand-muted">No active churn risks.</p>;
  }

  return (
    <div className="space-y-3">
      {risks.map((r) => (
        <div
          key={r.id}
          className={`rounded-xl border p-4 ${
            r.severity === "high" ? "border-rose-200 bg-rose-50/50" : "border-amber-200 bg-amber-50/50"
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${r.severity === "high" ? "text-rose-600" : "text-amber-600"}`} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-brand-primary">{r.title}</p>
                <Badge variant={r.severity === "high" ? "danger" : "warning"}>{r.severity}</Badge>
                <Badge variant="muted">{REASON_LABELS[r.churnReason] ?? r.churnReason}</Badge>
              </div>
              <p className="mt-1 text-sm text-brand-muted">{r.description}</p>
              <p className="mt-1 text-xs text-brand-sage">~{r.affectedUsersEstimate} users at risk</p>
              <p className="mt-2 rounded-lg border border-brand-border/50 bg-white/80 px-3 py-2 text-sm text-brand-primary">
                <span className="font-medium">Action: </span>{r.suggestedAction}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
