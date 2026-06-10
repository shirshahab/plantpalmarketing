"use client";

import { Sun } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { IvyBrief } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const SECTION_LABELS: { key: keyof IvyBrief["sections"]; label: string }[] = [
  { key: "highestPriorityApproval", label: "Highest Priority Approval" },
  { key: "bestCreatorFound", label: "Best Creator Found" },
  { key: "bestPartnershipOpportunity", label: "Best Partnership Opportunity" },
  { key: "biggestCompetitorThreat", label: "Biggest Competitor Threat" },
  { key: "bestContentCreated", label: "Best Content Created" },
];

export function DailySummaryCard({ brief }: { brief: IvyBrief | null }) {
  if (!brief) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-brand-muted">
          No daily brief yet. Run Ivy morning brief to generate.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-violet-200/60 bg-gradient-to-br from-violet-50/80 to-white">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-700 text-white">
            <Sun className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-semibold text-brand-primary">Morning Brief</h2>
            <p className="text-xs text-brand-muted">{formatDate(brief.runDate)}</p>
          </div>
        </div>
        <Badge variant="info">Daily</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-brand-primary">{brief.executiveSummary}</p>

        {brief.sections.topOpportunities.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-sage">Top Opportunities</h3>
            <ul className="mt-2 space-y-1">
              {brief.sections.topOpportunities.map((item, i) => (
                <li key={i} className="text-sm text-brand-muted">• {item}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {SECTION_LABELS.map(({ key, label }) => (
            <div key={key} className="rounded-xl border border-violet-100 bg-white/80 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-sage">{label}</p>
              <p className="mt-1 text-sm text-brand-primary">{brief.sections[key]}</p>
            </div>
          ))}
        </div>

        {brief.sections.communityTrends.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-sage">Community Trends</h3>
            <ul className="mt-2 space-y-1">
              {brief.sections.communityTrends.map((t, i) => (
                <li key={i} className="text-sm text-brand-muted">• {t}</li>
              ))}
            </ul>
          </div>
        )}

        {brief.sections.recommendedActions.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-sage">Recommended Actions</h3>
            <ul className="mt-2 space-y-1">
              {brief.sections.recommendedActions.map((a, i) => (
                <li key={i} className="text-sm font-medium text-violet-900">→ {a}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
