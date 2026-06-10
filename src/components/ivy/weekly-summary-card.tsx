"use client";

import { CalendarRange } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { IvyBrief } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function WeeklySummaryCard({ brief }: { brief: IvyBrief | null }) {
  if (!brief) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-brand-muted">
          Weekly brief generates on Mondays or after 7 days without one.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary text-white">
            <CalendarRange className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-semibold text-brand-primary">Weekly Brief</h2>
            <p className="text-xs text-brand-muted">Week of {formatDate(brief.runDate)}</p>
          </div>
        </div>
        <Badge variant="muted">Weekly</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-brand-primary">{brief.executiveSummary}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-brand-border bg-brand-bg/50 p-3">
            <p className="text-[10px] font-semibold uppercase text-brand-sage">Strategic Opportunities</p>
            <ul className="mt-2 space-y-1">
              {brief.sections.topOpportunities.map((o, i) => (
                <li key={i} className="text-sm text-brand-muted">• {o}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-brand-border bg-brand-bg/50 p-3">
            <p className="text-[10px] font-semibold uppercase text-brand-sage">Weekly Actions</p>
            <ul className="mt-2 space-y-1">
              {brief.sections.recommendedActions.map((a, i) => (
                <li key={i} className="text-sm text-brand-primary">→ {a}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
