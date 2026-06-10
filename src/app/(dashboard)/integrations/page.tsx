import { Plug } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { IntegrationsPanel } from "@/components/integrations/integrations-panel";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import { getIntegrationsDashboard } from "@/lib/db/integration-queries";

async function loadIntegrationsData() {
  return getIntegrationsDashboard();
}

export default async function IntegrationsPage() {
  const { data, error, configured } = await fetchPageData(loadIntegrationsData);

  if (!configured) {
    return (
      <div>
        <PageHeader title="Integrations" />
        <ConfigBanner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Integrations Layer"
        description="Centralized provider health, logs, and connection testing for OpenAI, OpenWeather, PlantNet, Perenual, SerpAPI, and X."
      />
      <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
        All API keys stay server-side. Rate limiting, retry logic, and error handling wrap every provider call.
      </div>
      {error && <ErrorBanner message={error} />}

      {data ? (
        <IntegrationsPanel statuses={data.statuses} logs={data.logs} />
      ) : (
        !error && (
          <EmptyState
            icon={Plug}
            title="Integrations not initialized"
            description="Run migration 031 in Supabase SQL Editor, then add API keys to .env.local."
          />
        )
      )}
    </div>
  );
}
