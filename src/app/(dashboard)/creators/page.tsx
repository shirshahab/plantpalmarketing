import { Users } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { CreatorCRMPanel } from "@/components/creators/creator-crm-panel";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import { getCreatorLeads, getCreatorPartnerships, getScoutStats } from "@/lib/db/scout-roots-queries";

async function loadCreatorCRM() {
  const [leads, partnerships, stats] = await Promise.all([
    getCreatorLeads(),
    getCreatorPartnerships(),
    getScoutStats(),
  ]);
  return { leads, partnerships, stats };
}

export default async function CreatorCRMPage({
  searchParams,
}: {
  searchParams: Promise<{ priority?: string }>;
}) {
  const params = await searchParams;
  const { data, error, configured } = await fetchPageData(loadCreatorCRM);

  if (!configured) {
    return (<div><PageHeader title="Creator CRM" /><ConfigBanner /></div>);
  }

  return (
    <div>
      <PageHeader
        title="Creator CRM"
        description="Scout discovers creators across TikTok, Instagram, YouTube, Pinterest, blogs & podcasts. Human approval before outreach."
      />
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <strong>No automatic outreach.</strong> All partnership leads flow through approval_queue.
      </div>
      {error && <ErrorBanner message={error} />}

      {data ? (
        <CreatorCRMPanel
          leads={data.leads}
          partnerships={data.partnerships}
          stats={data.stats}
          initialPriority={params.priority}
        />
      ) : (
        !error && (
          <EmptyState
            icon={Users}
            title="No creator leads yet"
            description="Run migration 005 + 006, then run Scout from PlantPal HQ."
          />
        )
      )}
    </div>
  );
}
