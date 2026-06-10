import { AutomationPanel } from "@/components/automation/automation-panel";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { PageHeader } from "@/components/ui/page-header";
import { getAutomationPageData } from "@/lib/db/automation-queries";
import { fetchPageData } from "@/lib/db/fetch-page-data";

export const dynamic = "force-dynamic";

export default async function AutomationPage() {
  const { data, error, configured } = await fetchPageData(getAutomationPageData);

  if (!configured) {
    return (
      <div>
        <PageHeader title="Automation" />
        <ConfigBanner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Automation"
        description="Agents do the work — you approve the moments that matter. Risk-based approval gates, daily batch review, and full run history."
      />
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        No fully autonomous public posting. Reddit, TikTok, Instagram, YouTube, and Blog are prepared as
        one-click/copy-paste packages. X publishes only after a final human click.
      </div>
      {error && <ErrorBanner message={error} />}
      <AutomationPanel
        rules={data?.rules ?? []}
        runs={data?.runs ?? []}
        failedRuns={data?.failedRuns ?? []}
        pendingItems={data?.inbox.pending ?? []}
        decidedToday={data?.inbox.decided ?? []}
        todayActivity={data?.todayActivity ?? []}
      />
    </div>
  );
}
