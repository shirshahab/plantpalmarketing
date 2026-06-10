import type { CreatorLead } from "@/lib/types";

const dimensions: { key: keyof CreatorLead; label: string }[] = [
  { key: "audienceFit", label: "Audience Fit" },
  { key: "engagementScore", label: "Engagement" },
  { key: "postingFrequency", label: "Posting Frequency" },
  { key: "contentQuality", label: "Content Quality" },
  { key: "growthTrend", label: "Growth Trend" },
];

export function ScoreBreakdown({ lead }: { lead: CreatorLead }) {
  return (
    <div className="mt-3 space-y-2">
      {dimensions.map(({ key, label }) => {
        const value = lead[key] as number;
        return (
          <div key={key}>
            <div className="flex justify-between text-xs">
              <span className="text-brand-muted">{label}</span>
              <span className="font-semibold text-brand-primary">{value}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-brand-primary/10">
              <div className="h-full rounded-full bg-brand-accent" style={{ width: `${value}%` }} />
            </div>
          </div>
        );
      })}
      <p className="mt-2 text-xs text-brand-muted">
        Aggregate partnership score: <strong className="text-brand-primary">{lead.partnershipScore}</strong> / 100
      </p>
    </div>
  );
}
