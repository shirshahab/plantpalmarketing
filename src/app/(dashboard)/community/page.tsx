import { Eye } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { CommunityListeningPanel } from "@/components/community/community-listening-panel";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import { getCommunityOpportunities } from "@/lib/db/queries";
import { getCommunityReplyDrafts, getRootsStats } from "@/lib/db/scout-roots-queries";

async function loadCommunity() {
  const [opportunities, replyDrafts, stats] = await Promise.all([
    getCommunityOpportunities(),
    getCommunityReplyDrafts(),
    getRootsStats(),
  ]);
  return { opportunities, replyDrafts, stats };
}

export default async function CommunityListeningPage() {
  const { data, error, configured } = await fetchPageData(loadCommunity);

  if (!configured) {
    return (<div><PageHeader title="Community Listening" /><ConfigBanner /></div>);
  }

  return (
    <div>
      <PageHeader
        title="Community Listening"
        description="Roots monitors Reddit, Threads, X, Facebook Groups & forums. Helpful replies — human approval required."
      />
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <strong>Human approval required.</strong> No replies are posted or commented automatically.
      </div>
      {error && <ErrorBanner message={error} />}

      {data ? (
        <CommunityListeningPanel
          opportunities={data.opportunities}
          replyDrafts={data.replyDrafts}
          stats={data.stats}
        />
      ) : (
        !error && (
          <EmptyState
            icon={Eye}
            title="No community opportunities"
            description="Run migration 005 + 006, then run Roots from PlantPal HQ."
          />
        )
      )}
    </div>
  );
}
