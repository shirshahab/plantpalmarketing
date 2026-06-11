import { PageHeader } from "@/components/ui/page-header";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { CompanyOsPanel } from "@/components/company-os/company-os-panel";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import { getCompanyOsPageData } from "@/lib/db/company-os-queries";

export const dynamic = "force-dynamic";

export default async function CompanyOsPage({
  searchParams,
}: {
  searchParams: Promise<{ workflow?: string }>;
}) {
  const { workflow } = await searchParams;
  const { data, error, configured } = await fetchPageData(getCompanyOsPageData);

  if (!configured) {
    return (
      <div>
        <PageHeader title="Company OS" />
        <ConfigBanner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Company OS"
        description="Every workflow, handoff, output, decision, and bottleneck in one place. What happened, who did it, where it went next."
      />
      {error && <ErrorBanner message={error} />}
      {data && <CompanyOsPanel data={data} workflowQuery={workflow} />}
    </div>
  );
}
