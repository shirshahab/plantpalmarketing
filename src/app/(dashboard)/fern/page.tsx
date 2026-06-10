import { Sprout } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { FernPanel } from "@/components/fern/fern-panel";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import {
  getFernExperiments,
  getFernForecasts,
  getFernOpportunities,
  getFernStats,
} from "@/lib/db/fern-queries";

async function loadFernData() {
  const [opportunities, experiments, forecasts, stats] = await Promise.all([
    getFernOpportunities(),
    getFernExperiments(),
    getFernForecasts(),
    getFernStats(),
  ]);
  return { opportunities, experiments, forecasts, stats };
}

export default async function FernPage() {
  const { data, error, configured } = await fetchPageData(loadFernData);

  if (!configured) {
    return (
      <div>
        <PageHeader title="Fern — User Acquisition" />
        <ConfigBanner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Fern — User Acquisition Agent"
        description="Agent 13 finds install opportunities across traffic sources. Fern recommends — humans approve execution."
      />
      <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        Fern tracks Instagram, TikTok, YouTube, Pinterest, Reddit, Facebook Groups, Google Search, Influencers, and Partnerships. Fern does not run ads.
      </div>
      {error && <ErrorBanner message={error} />}

      {data ? (
        <FernPanel {...data} />
      ) : (
        !error && (
          <EmptyState
            icon={Sprout}
            title="Fern not initialized"
            description="Run migrations 021 + 022, then run acquisition scan."
          />
        )
      )}
    </div>
  );
}
