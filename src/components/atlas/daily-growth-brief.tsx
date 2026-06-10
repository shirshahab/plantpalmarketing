"use client";

import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AtlasGrowthReport } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const STAGE_LABELS: Record<string, string> = {
  "0_to_1k": "0 → 1,000",
  "1k_to_10k": "1,000 → 10,000",
  "10k_to_100k": "10,000 → 100,000",
  "100k_to_1m": "100,000 → 1,000,000",
};

export function DailyGrowthBrief({ report }: { report: AtlasGrowthReport | null }) {
  if (!report) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-brand-muted">
          No growth brief yet. Run Atlas to generate.
        </CardContent>
      </Card>
    );
  }

  const s = report.sections;

  return (
    <Card className="border-sky-200/60 bg-gradient-to-br from-sky-50/80 to-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-700 text-white">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-semibold text-brand-primary">Today&apos;s Growth Brief</h2>
            <p className="text-xs text-brand-muted">{formatDate(report.runDate)}</p>
          </div>
        </div>
        {s.growthStage && <Badge variant="info">{STAGE_LABELS[s.growthStage] ?? s.growthStage}</Badge>}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-brand-primary">{report.executiveSummary}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { label: "Biggest Opportunity", value: s.biggestOpportunity },
            { label: "Biggest Risk", value: s.biggestRisk },
            { label: "Fastest Win", value: s.fastestWin },
            { label: "Best Channel", value: s.bestPerformingChannel },
            { label: "Worst Channel", value: s.worstPerformingChannel },
            { label: "Recommended Action", value: s.recommendedAction },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-sky-100 bg-white/80 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-sage">{label}</p>
              <p className="mt-1 text-sm text-brand-primary">{value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
