import { PageHeader } from "@/components/ui/page-header";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { ScheduleBoard } from "@/components/automation/schedule-board";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import { getSchedulesPageData } from "@/lib/db/schedule-queries";

export const dynamic = "force-dynamic";

export default async function SchedulesPage() {
  const { data, error, configured } = await fetchPageData(getSchedulesPageData);

  if (!configured) {
    return (
      <div>
        <PageHeader title="Agent Schedules" />
        <ConfigBanner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Agent Schedules"
        description="Who runs when, how fast, and whether they're earning their desk. Scout every 2h, Roots hourly, Sprout every 30 min, Ivy daily at 8."
      />
      {error && <ErrorBanner message={error} />}
      {data && <ScheduleBoard rows={data.rows} recentRuns={data.recentRuns} />}
    </div>
  );
}
