import { Telescope } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { AtlasPanel } from "@/components/atlas/atlas-panel";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import {
  getAtlasBottlenecks,
  getAtlasExperiments,
  getAtlasForecasts,
  getAtlasRecommendations,
  getAtlasStats,
  getLatestAtlasMetrics,
  getLatestAtlasReport,
} from "@/lib/db/atlas-queries";

async function loadAtlasData() {
  const [metrics, dailyReport, weeklyReport, recommendations, experiments, forecasts, bottlenecks, stats] =
    await Promise.all([
      getLatestAtlasMetrics(),
      getLatestAtlasReport("daily"),
      getLatestAtlasReport("weekly"),
      getAtlasRecommendations(),
      getAtlasExperiments(),
      getAtlasForecasts(),
      getAtlasBottlenecks(),
      getAtlasStats(),
    ]);
  return { metrics, dailyReport, weeklyReport, recommendations, experiments, forecasts, bottlenecks, stats };
}

export default async function AtlasPage() {
  const { data, error, configured } = await fetchPageData(loadAtlasData);

  if (!configured) {
    return (
      <div>
        <PageHeader title="Atlas — Head of Growth" />
        <ConfigBanner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Atlas — Head of Growth"
        description="Agent 12 identifies growth opportunities and bottlenecks. Atlas recommends — humans decide."
      />
      <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
        Atlas does not create content, partnerships, or publish posts. Atlas answers: what is the fastest path from 0 → 1M users?
      </div>
      {error && <ErrorBanner message={error} />}

      {data ? (
        <AtlasPanel {...data} />
      ) : (
        !error && (
          <EmptyState
            icon={Telescope}
            title="Atlas not initialized"
            description="System setup is still finishing. Once ready, generate the growth brief."
          />
        )
      )}
    </div>
  );
}
