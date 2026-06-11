import { Crown } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { IvyPanel } from "@/components/ivy/ivy-panel";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import {
  getIvyActionCenter,
  getIvyAlerts,
  getIvyRecommendations,
  getIvyStats,
  getLatestIvyBrief,
} from "@/lib/db/ivy-queries";

async function loadIvyData() {
  const [dailyBrief, weeklyBrief, recommendations, alerts, actionCenter, stats] = await Promise.all([
    getLatestIvyBrief("daily"),
    getLatestIvyBrief("weekly"),
    getIvyRecommendations(),
    getIvyAlerts(),
    getIvyActionCenter(),
    getIvyStats(),
  ]);
  return { dailyBrief, weeklyBrief, recommendations, alerts, actionCenter, stats };
}

export default async function IvyPage() {
  const { data, error, configured } = await fetchPageData(loadIvyData);

  if (!configured) {
    return (
      <div>
        <PageHeader title="Ivy — Chief of Staff" />
        <ConfigBanner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Ivy — Chief of Staff"
        description="Agent 11 manages priorities across PlantPal HQ. Ivy recommends — humans decide."
      />
      <div className="mb-6 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
        Ivy does not create content or execute actions. Every morning brief surfaces opportunities, threats, and approvals ranked by revenue, growth, virality, and time sensitivity.
      </div>
      {error && <ErrorBanner message={error} />}

      {data ? (
        <IvyPanel {...data} />
      ) : (
        !error && (
          <EmptyState
            icon={Crown}
            title="Ivy not initialized"
            description="System setup is still finishing. Once ready, generate the morning brief."
          />
        )
      )}
    </div>
  );
}
