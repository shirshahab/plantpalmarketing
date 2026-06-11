import { PageHeader } from "@/components/ui/page-header";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { LaunchPanel } from "@/components/launch/launch-panel";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import { getLaunchData } from "@/lib/db/launch-queries";

export const dynamic = "force-dynamic";

export default async function LaunchPage() {
  const { data, error, configured } = await fetchPageData(getLaunchData);

  if (!configured) {
    return (
      <div>
        <PageHeader title="Launch Readiness" />
        <ConfigBanner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Launch Readiness"
        description="One score, zero excuses. Every system gets checked against live data. All green means ship it."
      />
      {error && <ErrorBanner message={error} />}
      {data && <LaunchPanel data={data} />}
    </div>
  );
}
