import { Star } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { SagePanel } from "@/components/sage/sage-panel";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import {
  getSageApprovalRecommendations,
  getSageCreativeOpportunities,
  getSageRejections,
  getSageReviews,
  getSageStats,
} from "@/lib/db/sage-queries";

async function loadSageData() {
  const [reviews, approvals, rejections, opportunities, stats] = await Promise.all([
    getSageReviews(),
    getSageApprovalRecommendations(),
    getSageRejections(),
    getSageCreativeOpportunities(),
    getSageStats(),
  ]);
  return {
    reviews,
    approvals,
    rejections,
    opportunities,
    stats,
    latestBatch: stats.latestBatch,
  };
}

export default async function SagePage() {
  const { data, error, configured } = await fetchPageData(loadSageData);

  if (!configured) {
    return (
      <div>
        <PageHeader title="Sage — Creative Director" />
        <ConfigBanner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Sage — Creative Director"
        description="Agent 8 scores every Bloom piece on 6 dimensions. Below 80 is rejected with rewrite suggestions. Nothing reaches approval without Sage."
      />
      <div className="mb-6 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
        Bloom → Sage review gate → Human approval queue. No content skips Creative Director review.
      </div>
      {error && <ErrorBanner message={error} />}

      {data ? (
        <SagePanel
          reviews={data.reviews}
          approvals={data.approvals}
          rejections={data.rejections}
          opportunities={data.opportunities}
          latestBatch={data.latestBatch}
          stats={data.stats}
        />
      ) : (
        !error && (
          <EmptyState
            icon={Star}
            title="Sage not initialized"
            description="System setup is still finishing. Once ready, run Bloom production followed by Sage review."
          />
        )
      )}
    </div>
  );
}
