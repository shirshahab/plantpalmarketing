import { PageHeader } from "@/components/ui/page-header";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Card, CardContent } from "@/components/ui/card";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import { getAnalyticsDashboard, type MetricCard } from "@/lib/db/analytics-queries";

export const dynamic = "force-dynamic";

function MetricGrid({ title, cards }: { title: string; cards: MetricCard[] }) {
  return (
    <Card>
      <CardContent className="py-5">
        <h3 className="font-heading font-semibold text-brand-primary">{title}</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {cards.map((c) => (
            <div key={c.label} className="rounded-xl border border-brand-border p-3">
              <p className={`text-xl font-semibold ${c.notConnected ? "text-brand-muted" : "text-brand-primary"}`}>
                {c.value}
              </p>
              <p className="text-xs text-brand-muted">{c.label}</p>
              {c.hint && <p className="text-[10px] text-brand-muted/70">{c.hint}</p>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function AnalyticsPage() {
  const { data, error, configured } = await fetchPageData(getAnalyticsDashboard);

  if (!configured) {
    return (
      <div>
        <PageHeader title="Analytics" />
        <ConfigBanner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="The real numbers. External sources show Not Connected Yet until wired up. No fake metrics, no crashes."
      />
      {error && <ErrorBanner message={error} />}
      {data && (
        <div className="space-y-6">
          <MetricGrid title="Traffic" cards={data.traffic} />
          <MetricGrid title="Growth" cards={data.growth} />
          <MetricGrid title="Content" cards={data.content} />
          <MetricGrid title="SEO" cards={data.seo} />
          <MetricGrid title="Approvals" cards={data.approvals} />
          <MetricGrid title="Agents" cards={data.agents} />
          <MetricGrid title="Workflows" cards={data.workflows} />

          <Card>
            <CardContent className="py-5">
              <h3 className="font-heading font-semibold text-brand-primary">Agent leaderboard</h3>
              <p className="mt-1 text-xs text-brand-muted">Ranked by weekly output. Ivy is scored on company health.</p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-brand-border text-xs uppercase tracking-wide text-brand-muted">
                      <th className="py-2 pr-4">#</th>
                      <th className="py-2 pr-4">Agent</th>
                      <th className="py-2 pr-4">Metric</th>
                      <th className="py-2 pr-4">Daily</th>
                      <th className="py-2 pr-4">Weekly</th>
                      <th className="py-2 pr-4">Monthly</th>
                      <th className="py-2">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.leaderboard.map((entry, i) => (
                      <tr key={entry.agentId} className="border-b border-brand-border/50 last:border-0">
                        <td className="py-2.5 pr-4 text-brand-muted">{i + 1}</td>
                        <td className="py-2.5 pr-4 font-medium capitalize text-brand-primary">{entry.agentId}</td>
                        <td className="py-2.5 pr-4 text-brand-muted">{entry.metricLabel}</td>
                        <td className="py-2.5 pr-4 text-brand-muted">{entry.daily}</td>
                        <td className="py-2.5 pr-4 text-brand-muted">{entry.weekly}</td>
                        <td className="py-2.5 pr-4 text-brand-muted">{entry.monthly}</td>
                        <td className="py-2.5">
                          <span className="rounded-full bg-brand-accent/15 px-2 py-0.5 text-xs font-medium text-brand-primary">
                            {entry.score}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
