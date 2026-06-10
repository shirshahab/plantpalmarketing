"use client";

import { BarChart3, MousePointer, Share2, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import type { BloomContentPerformance } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function PerformanceTracker({ records }: { records: BloomContentPerformance[] }) {
  const totals = records.reduce(
    (acc, r) => ({
      impressions: acc.impressions + r.impressions,
      engagements: acc.engagements + r.engagements,
      clicks: acc.clicks + r.clicks,
      shares: acc.shares + r.shares,
    }),
    { impressions: 0, engagements: 0, clicks: 0, shares: 0 }
  );

  const engagementRate =
    totals.impressions > 0 ? ((totals.engagements / totals.impressions) * 100).toFixed(1) : "0";

  if (records.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-brand-border bg-white/60 px-6 py-12 text-center">
        <BarChart3 className="mx-auto h-8 w-8 text-brand-muted" />
        <p className="mt-3 text-sm text-brand-muted">No performance data yet. Publish content to start tracking.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Impressions" value={totals.impressions.toLocaleString()} icon={Eye} />
        <StatCard label="Engagements" value={totals.engagements.toLocaleString()} icon={BarChart3} />
        <StatCard label="Clicks" value={totals.clicks.toLocaleString()} icon={MousePointer} />
        <StatCard label="Eng. Rate" value={`${engagementRate}%`} icon={Share2} />
      </div>

      <div className="space-y-4">
        {records.map((record) => (
          <Card key={record.id}>
            <CardContent className="py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-heading font-semibold text-brand-primary">
                    {record.piece?.hook ?? "Content piece"}
                  </p>
                  <p className="mt-1 text-xs text-brand-muted">
                    {record.platform} · Tracked {formatDate(record.trackedAt)}
                  </p>
                  {record.notes && <p className="mt-2 text-sm text-brand-muted">{record.notes}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-5">
                  {[
                    { label: "Views", value: record.impressions },
                    { label: "Engage", value: record.engagements },
                    { label: "Clicks", value: record.clicks },
                    { label: "Shares", value: record.shares },
                    { label: "Saves", value: record.saves },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg bg-brand-bg px-2 py-2">
                      <p className="text-[10px] text-brand-muted">{label}</p>
                      <p className="font-heading text-sm font-bold text-brand-primary">{value.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
