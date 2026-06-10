"use client";

import { Badge } from "@/components/ui/badge";
import type { FernOpportunity } from "@/lib/types";

const SOURCE_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  pinterest: "Pinterest",
  reddit: "Reddit",
  facebook_groups: "Facebook Groups",
  google_search: "Google Search",
  influencers: "Influencers",
  partnerships: "Partnerships",
  referral: "Referral",
  other: "Other",
};

export function AcquisitionChannels({ opportunities }: { opportunities: FernOpportunity[] }) {
  const bySource = new Map<string, { installs: number; count: number; topScore: number }>();

  for (const opp of opportunities) {
    const existing = bySource.get(opp.trafficSource) ?? { installs: 0, count: 0, topScore: 0 };
    bySource.set(opp.trafficSource, {
      installs: existing.installs + opp.estimatedInstalls,
      count: existing.count + 1,
      topScore: Math.max(existing.topScore, opp.priorityScore),
    });
  }

  const channels = [...bySource.entries()].sort((a, b) => b[1].installs - a[1].installs);

  if (channels.length === 0) {
    return <p className="text-sm text-brand-muted">No channel data. Run acquisition scan.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {channels.map(([source, data]) => (
        <div key={source} className="rounded-xl border border-brand-border bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="font-medium text-brand-primary">{SOURCE_LABELS[source] ?? source}</p>
            <Badge variant={data.topScore >= 85 ? "success" : "muted"}>{data.topScore}</Badge>
          </div>
          <p className="mt-2 font-heading text-xl font-bold text-emerald-700">
            ~{data.installs.toLocaleString()} installs
          </p>
          <p className="text-xs text-brand-muted">{data.count} opportunities tracked</p>
        </div>
      ))}
    </div>
  );
}
