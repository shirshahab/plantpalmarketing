import { Badge } from "@/components/ui/badge";
import type { CompetitorScoreboardEntry, ReviewTrend } from "@/lib/types";

const trendStyles: Record<ReviewTrend, { label: string; variant: "success" | "warning" | "danger" | "muted" }> = {
  improving: { label: "Improving", variant: "success" },
  stable: { label: "Stable", variant: "muted" },
  declining: { label: "Declining", variant: "warning" },
  negative_spike: { label: "Negative spike", variant: "danger" },
};

function ThreatBar({ value }: { value: number }) {
  const color = value >= 75 ? "bg-red-500" : value >= 50 ? "bg-amber-500" : "bg-brand-sage";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-brand-border">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-semibold">{value}</span>
    </div>
  );
}

export function CompetitorScoreboard({ entries }: { entries: CompetitorScoreboardEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-brand-muted">Scoreboard empty — run migration 008.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-brand-border bg-white shadow-sm">
      <table className="w-full min-w-[1100px] text-left text-sm">
        <thead>
          <tr className="border-b border-brand-border bg-slate-50/80">
            <th className="px-4 py-3 font-semibold text-brand-primary">Competitor</th>
            <th className="px-4 py-3 font-semibold text-brand-primary">Est. Growth</th>
            <th className="px-4 py-3 font-semibold text-brand-primary">App Rank</th>
            <th className="px-4 py-3 font-semibold text-brand-primary">New Features</th>
            <th className="px-4 py-3 font-semibold text-brand-primary">Social Eng.</th>
            <th className="px-4 py-3 font-semibold text-brand-primary">Review Trend</th>
            <th className="px-4 py-3 font-semibold text-brand-primary">Recent Campaigns</th>
            <th className="px-4 py-3 font-semibold text-brand-primary">Threat</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const trend = trendStyles[entry.reviewTrend];
            return (
              <tr key={entry.id} className="border-b border-brand-border last:border-0 hover:bg-brand-bg/30">
                <td className="px-4 py-4">
                  <p className="font-heading font-semibold text-brand-primary">{entry.name}</p>
                  <p className="text-xs text-brand-muted">{entry.appStoreCategory}</p>
                </td>
                <td className="px-4 py-4">
                  <span className="font-bold text-brand-accent">{entry.estimatedGrowth}%</span>
                </td>
                <td className="px-4 py-4">{entry.appStoreRank ? `#${entry.appStoreRank}` : "—"}</td>
                <td className="px-4 py-4">{entry.newFeaturesCount}</td>
                <td className="px-4 py-4">{entry.socialEngagementScore}</td>
                <td className="px-4 py-4">
                  <Badge variant={trend.variant}>{trend.label}</Badge>
                  <span className="ml-1 text-xs text-brand-muted">★{entry.reviewScore}</span>
                </td>
                <td className="px-4 py-4">
                  <ul className="space-y-0.5 text-xs text-brand-muted">
                    {entry.recentCampaigns.slice(0, 2).map((c) => (
                      <li key={c}>• {c}</li>
                    ))}
                  </ul>
                </td>
                <td className="px-4 py-4">
                  <ThreatBar value={entry.threatLevel} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
