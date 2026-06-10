import type { PipelineContent } from "@/lib/types";

const dimensions: { key: keyof PipelineContent; label: string; color: string }[] = [
  { key: "originalityScore", label: "Originality", color: "bg-brand-primary" },
  { key: "humorScore", label: "Humor", color: "bg-brand-accent" },
  { key: "emotionalImpactScore", label: "Emotion", color: "bg-rose-500" },
  { key: "shareabilityScore", label: "Shareability", color: "bg-violet-500" },
  { key: "educationalScore", label: "Educational", color: "bg-sky-500" },
];

export function ScoreBars({ item }: { item: PipelineContent }) {
  return (
    <div className="space-y-2">
      {dimensions.map(({ key, label, color }) => {
        const value = item[key] as number;
        return (
          <div key={key}>
            <div className="mb-1 flex justify-between text-xs text-brand-muted">
              <span>{label}</span>
              <span className="font-medium text-brand-primary">{value}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-brand-primary/10">
              <div
                className={`h-full rounded-full ${color}`}
                style={{ width: `${Math.min(100, value)}%` }}
              />
            </div>
          </div>
        );
      })}
      <div className="mt-3 flex items-center justify-between rounded-lg bg-brand-primary/5 px-3 py-2">
        <span className="text-xs font-medium text-brand-muted">Aggregate</span>
        <span
          className={`font-heading text-lg font-bold ${
            item.aggregateScore >= 80 ? "text-brand-primary" : "text-amber-600"
          }`}
        >
          {item.aggregateScore}
        </span>
      </div>
    </div>
  );
}
