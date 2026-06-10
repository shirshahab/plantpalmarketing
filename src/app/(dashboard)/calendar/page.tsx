import { ContentCalendarPanel } from "@/components/calendar/content-calendar-panel";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { PageHeader } from "@/components/ui/page-header";
import { getCalendarPageData } from "@/lib/db/calendar-queries";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import { isXPublishConfigured } from "@/lib/integrations/config";

export const dynamic = "force-dynamic";

export default async function ContentCalendarPage() {
  const { data, error, configured } = await fetchPageData(getCalendarPageData);

  if (!configured) {
    return (
      <div>
        <PageHeader title="Content Calendar" />
        <ConfigBanner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Content Calendar"
        description="Publishing command center — every approved, scheduled, drafted, and posted piece of content by day and channel."
      />
      {error && <ErrorBanner message={error} />}
      <ContentCalendarPanel
        items={data?.items ?? []}
        assets={data?.assets ?? []}
        publishLogs={data?.publishLogs ?? []}
        stats={
          data?.stats ?? {
            scheduledToday: 0,
            readyToPublish: 0,
            missingAssets: 0,
            postedToday: 0,
            approved: 0,
            overdue: 0,
          }
        }
        xPublishConfigured={isXPublishConfigured()}
      />
    </div>
  );
}
