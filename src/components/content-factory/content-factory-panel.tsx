import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { ContentFactoryStats } from "@/lib/pipeline/content-factory-stats";

const LIGHT_STYLE = {
  green: "bg-emerald-500",
  yellow: "bg-amber-400",
  red: "bg-rose-500",
};

function TargetRow({
  label,
  target,
  today,
  week,
}: {
  label: string;
  target: number;
  today: number;
  week: number;
}) {
  const pct = Math.min(100, Math.round((today / Math.max(target, 1)) * 100));
  const onTrack = today >= target;

  return (
    <div className="rounded-xl border border-brand-border bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-brand-primary">{label}</p>
        <Badge variant={onTrack ? "success" : "warning"}>
          {today}/{target} today
        </Badge>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-bg">
        <div
          className={`h-full rounded-full transition-all ${onTrack ? "bg-emerald-500" : "bg-amber-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-brand-muted">{week} produced this week</p>
    </div>
  );
}

export function ContentFactoryPanel({ stats }: { stats: ContentFactoryStats }) {
  const rows: Array<{ key: keyof ContentFactoryStats["targets"]; label: string }> = [
    { key: "seoDrafts", label: "SEO drafts" },
    { key: "socialPosts", label: "Social posts" },
    { key: "videoConcepts", label: "Video concepts" },
    { key: "imagePrompts", label: "Image prompts" },
    { key: "redditOpportunities", label: "Reddit opportunities" },
    { key: "trendOpportunities", label: "Trend opportunities" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ key, label }) => (
          <TargetRow
            key={key}
            label={label}
            target={stats.targets[key]}
            today={stats.today[key]}
            week={stats.week[key]}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-brand-border bg-white p-5">
        <h3 className="font-heading font-semibold text-brand-primary">Pipeline health</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stats.pipelineHealth.map((p) => (
            <div key={p.id} className="flex items-start gap-2 rounded-lg border border-brand-border/60 px-3 py-2">
              <span
                className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                  p.status === "healthy" ? LIGHT_STYLE.green : p.status === "stalled" ? LIGHT_STYLE.yellow : LIGHT_STYLE.red
                }`}
              />
              <div>
                <p className="text-sm font-medium text-brand-primary">{p.label}</p>
                <p className="text-xs text-brand-muted">{p.waiting} waiting · {p.flow}</p>
              </div>
            </div>
          ))}
        </div>
        <Link href="/system-health" className="mt-4 inline-block text-sm text-brand-accent underline">
          Full system health →
        </Link>
      </div>
    </div>
  );
}
