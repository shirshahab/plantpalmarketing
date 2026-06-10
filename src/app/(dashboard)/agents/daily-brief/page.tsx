import { Bot } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { RunPipelinePanel } from "@/components/agents/run-pipeline-panel";
import { DiscoveryList } from "@/components/agents/discovery-list";
import { BriefStatusBadge } from "@/components/agents/pipeline-status-badge";
import {
  IvyExecutiveBrief,
  type BriefCompetitorAlert,
  type BriefProviderStatus,
} from "@/components/agents/ivy-executive-brief";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import { getLatestDailyBrief, getDiscoveryItemsByBrief } from "@/lib/db/agent-queries";
import { getLatestDailyReport } from "@/lib/db/daily-report-queries";
import { getCalendarHQStats, getCalendarTodayItems } from "@/lib/db/calendar-queries";
import { getCompetitorIntelAlerts } from "@/lib/db/sentinel-queries";
import { getIntegrationStatuses } from "@/lib/integrations/status-service";
import { isSupabaseConfigured } from "@/lib/supabase/config";

async function loadDailyBriefPage() {
  const [report, statuses, alerts, calendarStats, calendarToday, legacyBrief] = await Promise.all([
    getLatestDailyReport(),
    getIntegrationStatuses().catch(() => [] as Awaited<ReturnType<typeof getIntegrationStatuses>>),
    getCompetitorIntelAlerts().catch(() => []),
    getCalendarHQStats(),
    getCalendarTodayItems(8),
    getLatestDailyBrief().catch(() => null),
  ]);
  const discovery = legacyBrief ? await getDiscoveryItemsByBrief(legacyBrief.id) : [];

  const providerStatuses: BriefProviderStatus[] = statuses.map((s) => ({
    provider: s.provider,
    label: s.label,
    status: s.status,
    configured: s.configured,
    lastErrorMessage: s.lastErrorMessage,
  }));

  const competitorAlerts: BriefCompetitorAlert[] = alerts
    .filter((a) => a.status === "active")
    .slice(0, 5)
    .map((a) => ({
      id: a.id,
      competitor: a.competitor,
      title: a.title,
      severity: a.severity,
      recommendedAction: a.recommendedAction,
      createdAt: a.createdAt,
    }));

  return { report, providerStatuses, competitorAlerts, calendarStats, calendarToday, legacyBrief, discovery };
}

export default async function DailyBriefPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <PageHeader title="Ivy Executive Brief" />
        <ConfigBanner />
      </div>
    );
  }

  const { data, error } = await fetchPageData(loadDailyBriefPage);

  return (
    <div>
      <PageHeader
        title="Ivy Executive Brief"
        description="The Chief of Staff report — everything that happened across the company in the last 24 hours."
      />

      {error && <ErrorBanner message={error} />}

      <IvyExecutiveBrief
        report={data?.report ?? null}
        providerStatuses={data?.providerStatuses ?? []}
        competitorAlerts={data?.competitorAlerts ?? []}
        calendarStats={data?.calendarStats ?? null}
        calendarToday={data?.calendarToday ?? []}
      />

      {/* Legacy content pipeline — small subsection, no longer the main report */}
      <details className="mt-10 rounded-2xl border border-brand-border/40 bg-white">
        <summary className="flex cursor-pointer items-center gap-2 px-5 py-4 text-sm font-semibold text-brand-primary">
          <Bot className="h-4 w-4 text-brand-sage" />
          Content Pipeline (Discovery → Content → Creative Director)
          <span className="ml-1 font-normal text-brand-muted">— subsection</span>
        </summary>
        <div className="space-y-4 border-t border-brand-border/30 px-5 py-4">
          <RunPipelinePanel />

          {data?.legacyBrief && (
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <h3 className="font-heading text-sm font-semibold text-brand-primary">
                  Latest pipeline run — {new Date(data.legacyBrief.runDate).toLocaleDateString()}
                </h3>
                <BriefStatusBadge status={data.legacyBrief.status} />
              </div>

              {data.legacyBrief.discoverySummary && (
                <div className="mb-4 rounded-xl border border-brand-primary/10 bg-brand-bg/30 p-4">
                  <p className="text-sm leading-relaxed text-brand-muted">{data.legacyBrief.discoverySummary}</p>
                  {data.legacyBrief.status === "completed" && (
                    <p className="mt-2 text-xs text-brand-muted">
                      {data.legacyBrief.contentCount} pieces generated · {data.legacyBrief.approvedCount} passed director ·{" "}
                      {data.legacyBrief.rejectedCount} rejected
                    </p>
                  )}
                  {data.legacyBrief.status === "failed" && data.legacyBrief.errorMessage && (
                    <p className="mt-2 text-sm text-red-600">{data.legacyBrief.errorMessage}</p>
                  )}
                </div>
              )}

              {data.discovery.length > 0 && (
                <>
                  <h4 className="mb-2 text-xs font-semibold uppercase text-brand-sage">
                    Discovery items ({data.discovery.length})
                  </h4>
                  <DiscoveryList items={data.discovery} />
                </>
              )}
            </div>
          )}

          {!data?.legacyBrief && (
            <p className="text-sm text-brand-muted">
              No pipeline runs yet. Click &quot;Run Daily Pipeline&quot; above to start one.
            </p>
          )}
        </div>
      </details>
    </div>
  );
}
