import { FileBarChart } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { DailyReportPanel } from "@/components/daily-report/daily-report-panel";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import { getDailyReportPageData } from "@/lib/db/daily-report-queries";

export default async function DailyReportPage() {
  const { data, error, configured } = await fetchPageData(getDailyReportPageData);

  if (!configured) {
    return (
      <div>
        <PageHeader title="Daily Report" />
        <ConfigBanner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Daily Report"
        description="Ivy synthesizes 24h of agent activity, workflows, API usage, and growth recommendations. Read-only — humans approve all actions."
      />
      <div className="mb-6 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
        No auto-posting. No auto-contacting creators. This report recommends only — founder decides what ships.
      </div>
      {error && <ErrorBanner message={error} />}

      {data || !error ? (
        <DailyReportPanel
          latestReport={data?.latestReport ?? null}
          reports={data?.reports ?? []}
          workflowRuns={data?.workflowRuns ?? []}
          actionItems={data?.actionItems ?? []}
          calendarStats={data?.calendarStats ?? null}
          calendarToday={data?.calendarToday ?? []}
        />
      ) : (
        <EmptyState
          icon={FileBarChart}
          title="Daily report system not initialized"
          description="System setup is still finishing. Once ready, generate your first report from HQ."
        />
      )}
    </div>
  );
}
