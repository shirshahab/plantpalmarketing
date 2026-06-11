import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Card, CardContent } from "@/components/ui/card";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import { getFounderModeData, type FounderListItem } from "@/lib/db/founder-queries";

export const dynamic = "force-dynamic";

const HEALTH_STYLE: Record<string, string> = {
  healthy: "bg-emerald-50 text-emerald-700",
  running: "bg-blue-50 text-blue-700",
  sleeping: "bg-gray-100 text-gray-600",
  degraded: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-red-700",
};

function Section({
  title,
  items,
  emptyText,
  badge,
}: {
  title: string;
  items: FounderListItem[];
  emptyText: string;
  badge?: number;
}) {
  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold text-brand-primary">{title}</h3>
          {badge !== undefined && badge > 0 && (
            <span className="rounded-full bg-brand-accent/15 px-2 py-0.5 text-xs font-medium text-brand-primary">
              {badge}
            </span>
          )}
        </div>
        {items.length === 0 ? (
          <p className="mt-2 text-sm text-brand-muted">{emptyText}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="block rounded-xl border border-brand-border p-3 transition-colors hover:bg-brand-bg"
                >
                  <p className="text-sm font-medium text-brand-primary">{item.title}</p>
                  {item.detail && <p className="mt-0.5 text-xs text-brand-muted">{item.detail}</p>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function OsStat({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className="rounded-xl border border-brand-border p-3">
      <p className={`text-xl font-semibold ${alert ? "text-amber-600" : "text-brand-primary"}`}>{value}</p>
      <p className="text-xs text-brand-muted">{label}</p>
    </div>
  );
}

export default async function FounderPage() {
  const { data, error, configured } = await fetchPageData(getFounderModeData);

  if (!configured) {
    return (
      <div>
        <PageHeader title="Founder Mode" />
        <ConfigBanner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Founder Mode"
        description="The entire company in under 5 minutes. Decisions up top, details one click away."
      />
      {error && <ErrorBanner message={error} />}
      {data && (
        <div className="space-y-6">
          <Card>
            <CardContent className="py-5">
              <h3 className="font-heading font-semibold text-brand-primary">Executive summary</h3>
              <p className="mt-2 whitespace-pre-line text-sm text-brand-muted">{data.executiveSummary}</p>
              <Link href="/agents/daily-brief" className="mt-2 inline-block text-xs font-medium text-brand-accent hover:underline">
                Read the full Ivy brief →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-5">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-semibold text-brand-primary">Company OS</h3>
                <Link href="/company-os" className="text-xs font-medium text-brand-accent hover:underline">
                  Full operating view →
                </Link>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <OsStat label="Health score" value={data.companyOs.healthScore} />
                <OsStat label="Started today" value={data.companyOs.workflowsStartedToday} />
                <OsStat label="Completed today" value={data.companyOs.workflowsCompletedToday} />
                <OsStat label="Active workflows" value={data.companyOs.activeWorkflows} />
                <OsStat label="Blocked" value={data.companyOs.blockedWorkflows} alert={data.companyOs.blockedWorkflows > 0} />
                <OsStat label="Decisions needed" value={data.companyOs.decisionsNeeded} alert={data.companyOs.decisionsNeeded > 0} />
              </div>
              {data.companyOs.biggestBottleneck && (
                <p className="mt-3 text-xs text-amber-700">
                  Biggest bottleneck: {data.companyOs.biggestBottleneck.description}
                </p>
              )}
              {data.companyOs.highestImpactOutput && (
                <p className="mt-1 text-xs text-brand-muted">
                  Top output today: &quot;{data.companyOs.highestImpactOutput.title}&quot; by {data.companyOs.highestImpactOutput.agentId}
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section
              title="Approvals needed"
              items={data.approvalsNeeded.items}
              emptyText="Inbox zero. Nothing waiting on you."
              badge={data.approvalsNeeded.count}
            />
            <Section
              title="Ready to publish"
              items={data.readyToPublish.items}
              emptyText="Nothing staged. Approve content and Sprout preps it."
              badge={data.readyToPublish.count}
            />
            <Section title="Urgent issues" items={data.urgentIssues} emptyText="No fires. Enjoy it while it lasts." />
            <Section title="Competitor alerts" items={data.competitorAlerts} emptyText="Sentinel has nothing new on the competition." />
            <Section title="Creator opportunities" items={data.creatorOpportunities} emptyText="No high-priority creators right now. Scout is hunting." />
            <Section title="Recommended actions" items={data.recommendedActions} emptyText="Ivy has no recommendations queued." />
          </div>

          <Card>
            <CardContent className="py-5">
              <h3 className="font-heading font-semibold text-brand-primary">Content pipeline</h3>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                {data.pipeline.map((stage) => (
                  <Link key={stage.label} href="/calendar" className="rounded-xl border border-brand-border p-3 transition-colors hover:bg-brand-bg">
                    <p className="text-xl font-semibold text-brand-primary">{stage.count}</p>
                    <p className="text-xs capitalize text-brand-muted">{stage.label}</p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-5">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-semibold text-brand-primary">Agent health</h3>
                <Link href="/automation/schedules" className="text-xs font-medium text-brand-accent hover:underline">
                  Schedules →
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {data.agentHealth.length === 0 ? (
                  <p className="text-sm text-brand-muted">No health data yet. Run the agent batch once.</p>
                ) : (
                  data.agentHealth.map((agent) => (
                    <span
                      key={agent.agentId}
                      title={agent.lastError}
                      className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${HEALTH_STYLE[agent.status] ?? HEALTH_STYLE.sleeping}`}
                    >
                      {agent.agentId}: {agent.status}
                    </span>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
