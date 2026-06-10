import { Twitter } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { XDashboardPanel } from "@/components/integrations/x-dashboard-panel";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import { getXDashboardData } from "@/lib/db/integration-queries";

async function loadXData() {
  return getXDashboardData();
}

export default async function XDashboardPage() {
  const { data, error, configured } = await fetchPageData(loadXData);

  if (!configured) {
    return (
      <div>
        <PageHeader title="X Dashboard" />
        <ConfigBanner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="X (Twitter) Dashboard"
        description="Account metrics, engagement, content queues, and manual publish after Gate approval."
      />
      <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900">
        Publishing flow: Bloom drafts → Sage review → Gate approval → Sprout queue → manual publish to X.
      </div>
      {error && <ErrorBanner message={error} />}

      {data ? (
        <XDashboardPanel
          snapshot={data.snapshot}
          recentPosts={data.recentPosts}
          topPosts={data.topPosts}
          drafts={data.drafts}
          gateQueue={data.gateQueue}
          publishQueue={data.publishQueue}
          stats={data.stats}
        />
      ) : (
        !error && (
          <EmptyState
            icon={Twitter}
            title="X dashboard not initialized"
            description="Run migrations 029 + 030, add X_BEARER_TOKEN to .env.local, then sync."
          />
        )
      )}
    </div>
  );
}
