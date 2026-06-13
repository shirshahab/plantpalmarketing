import type { IntelligenceMetrics, IntelligenceScoreLevel } from "@/lib/intelligence/intelligence-engine";
import type { TrendCluster } from "@/lib/intelligence/trend-clusters";

export function IntelligenceMetricsPanel({
  metrics,
  score,
  clusters,
}: {
  metrics: IntelligenceMetrics;
  score: IntelligenceScoreLevel;
  clusters: TrendCluster[];
}) {
  return (
    <div className="mb-8 space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Total alerts" value={metrics.total} />
        <MetricCard label="Today" value={metrics.today} />
        <MetricCard label="This week" value={metrics.thisWeek} />
        <MetricCard label="This month" value={metrics.thisMonth} />
        <MetricCard label="HQ Intelligence Score" value={score} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RankList title="Top subreddits" items={metrics.topSubreddits.map((s) => `${s.name} (${s.count})`)} />
        <RankList title="Top keywords" items={metrics.topKeywords.map((k) => `${k.keyword} (${k.count})`)} />
        <RankList title="Top competitors" items={metrics.topCompetitors.map((c) => `${c.name} (${c.count})`)} />
        <div className="rounded-2xl border border-brand-border bg-white p-4">
          <h3 className="text-sm font-semibold text-brand-primary">Activity</h3>
          <ul className="mt-2 space-y-1 text-sm text-brand-muted">
            <li>Most active agent: <span className="font-medium capitalize text-brand-primary">{metrics.mostActiveAgent ?? "—"}</span></li>
            <li>Most common problem: <span className="text-brand-primary">{metrics.mostCommonProblem?.slice(0, 60) ?? "—"}</span></li>
          </ul>
        </div>
      </div>

      {clusters.length > 0 && (
        <div>
          <h2 className="mb-3 font-heading text-lg font-semibold text-brand-primary">Trend clusters</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {clusters.map((cluster) => (
              <div key={cluster.id} className="rounded-xl border border-brand-border/60 bg-white px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-brand-primary">{cluster.label}</p>
                  <span className={`text-xs font-bold ${cluster.growthPercent >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {cluster.growthPercent >= 0 ? "+" : ""}
                    {cluster.growthPercent}%
                  </span>
                </div>
                <p className="mt-1 text-xs text-brand-muted">{cluster.totalMentions} mentions</p>
                {cluster.latestMentions[0] && (
                  <p className="mt-2 line-clamp-2 text-xs text-brand-muted">{cluster.latestMentions[0].title}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-brand-border/60 bg-white px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-brand-primary">{value}</p>
    </div>
  );
}

function RankList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-white p-4">
      <h3 className="text-sm font-semibold text-brand-primary">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-brand-muted">No data yet</p>
      ) : (
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-brand-muted">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
