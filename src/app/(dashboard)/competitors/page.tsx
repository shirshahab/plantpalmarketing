import { Radar } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { SentinelPanel } from "@/components/competitors/sentinel-panel";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import {
  getCompetitorIntelAlerts,
  getCompetitorScoreboard,
  getLatestCompetitorBrief,
  getSentinelStats,
} from "@/lib/db/sentinel-queries";

async function loadCompetitorIntel() {
  const [scoreboard, alerts, dailyBrief, stats] = await Promise.all([
    getCompetitorScoreboard(),
    getCompetitorIntelAlerts(),
    getLatestCompetitorBrief(),
    getSentinelStats(),
  ]);
  return { scoreboard, alerts, dailyBrief, stats };
}

export default async function CompetitorMonitorPage() {
  const { data, error, configured } = await fetchPageData(loadCompetitorIntel);

  if (!configured) {
    return (<div><PageHeader title="Competitor Monitor" /><ConfigBanner /></div>);
  }

  return (
    <div>
      <PageHeader
        title="Competitor Scoreboard"
        description="Sentinel monitors 8 gardening apps — rankings, reviews, features, social, ads, partnerships."
      />
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Intelligence findings queue to approval for strategic response. No automatic competitive actions.
      </div>
      {error && <ErrorBanner message={error} />}

      {data ? (
        <SentinelPanel
          scoreboard={data.scoreboard}
          alerts={data.alerts}
          dailyBrief={data.dailyBrief}
          stats={data.stats}
        />
      ) : (
        !error && (
          <EmptyState
            icon={Radar}
            title="Sentinel not initialized"
            description="Run migrations 007 + 008, then run Sentinel from PlantPal HQ."
          />
        )
      )}
    </div>
  );
}
