"use client";

import { MessageCircleHeart } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { EchoReport } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function DailyVoCReport({ report }: { report: EchoReport | null }) {
  if (!report) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-brand-muted">
          No daily report yet. Run VoC scan.
        </CardContent>
      </Card>
    );
  }

  const s = report.sections;

  return (
    <Card className="border-rose-200/60 bg-gradient-to-br from-rose-50/80 to-white">
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-700 text-white">
          <MessageCircleHeart className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-heading text-lg font-semibold text-brand-primary">Daily Voice of Customer</h2>
          <p className="text-xs text-brand-muted">{formatDate(report.runDate)}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-brand-primary">{report.executiveSummary}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { label: "Top Complaints", items: s.topComplaints },
            { label: "Top Feature Requests", items: s.topFeatureRequests },
            { label: "Top Positive Feedback", items: s.topPositiveFeedback },
            { label: "Urgent Issues", items: s.urgentIssues },
          ].map(({ label, items }) => (
            <div key={label} className="rounded-xl border border-rose-100 bg-white/80 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-sage">{label}</p>
              <ul className="mt-2 space-y-1">
                {(items ?? []).map((item, i) => (
                  <li key={i} className="text-sm text-brand-muted">• {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {s.recommendedActions && s.recommendedActions.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase text-brand-sage">Recommended Actions</p>
            <ul className="mt-2 space-y-1">
              {s.recommendedActions.map((a, i) => (
                <li key={i} className="text-sm font-medium text-rose-900">→ {a}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
