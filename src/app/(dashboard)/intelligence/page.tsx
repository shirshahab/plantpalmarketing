import Link from "next/link";
import { Suspense } from "react";
import { Radar } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ConfigBanner } from "@/components/ui/config-banner";
import { IntelligenceAlertsFilters } from "@/components/intelligence/intelligence-alerts-filters";
import { IntelligenceAlertsList } from "@/components/intelligence/intelligence-alerts-list";
import { IntelligenceMetricsPanel } from "@/components/intelligence/intelligence-metrics-panel";
import { GenerateIntelligenceBriefButton } from "@/components/intelligence/generate-intelligence-brief-button";
import { getInternetPulseDashboard } from "@/lib/intelligence/intelligence-engine";
import {
  getIntelligenceFilterOptions,
  getSavedIntelligenceAlerts,
} from "@/lib/intelligence/saved-alerts-queries";
import { F5BotSetupCard } from "@/components/intelligence/f5bot-setup-card";
import { getF5BotSetupStatus } from "@/lib/intelligence/f5bot-setup-status";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function IntelligencePage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    classification?: string;
    priority?: string;
    assigned_agent?: string;
  }>;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <PageHeader title="Intelligence" description="Live Internet Pulse from F5Bot" />
        <ConfigBanner />
      </div>
    );
  }

  const params = await searchParams;
  const filters = {
    status: params.status,
    classification: params.classification,
    priority: params.priority,
    assignedAgent: params.assigned_agent,
  };

  const [dashboard, { alerts, total }, options] = await Promise.all([
    getInternetPulseDashboard(),
    getSavedIntelligenceAlerts(filters, 100),
    getIntelligenceFilterOptions(),
  ]);

  return (
    <div>
      <PageHeader
        title="Intelligence"
        description="Real F5Bot alerts powering PlantPal HQ. Trends, opportunities, and agent routing."
      />

      <F5BotSetupCard status={getF5BotSetupStatus()} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          href="/admin/f5bot-test"
          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-white px-3 py-1.5 text-xs font-medium text-brand-primary shadow-sm hover:bg-brand-bg"
        >
          <Radar className="h-3.5 w-3.5" />
          F5Bot Test & Ingest
        </Link>
        <GenerateIntelligenceBriefButton />
      </div>

      {dashboard.hasRealData ? (
        <IntelligenceMetricsPanel
          metrics={dashboard.metrics}
          score={dashboard.score}
          clusters={dashboard.clusters}
        />
      ) : (
        <p className="mb-6 text-sm text-brand-muted">
          No saved alerts yet. Use F5Bot Test to ingest, or wait for the 30-minute cron.
        </p>
      )}

      <Suspense fallback={<div className="mb-6 h-20 animate-pulse rounded-2xl bg-brand-bg" />}>
        <IntelligenceAlertsFilters options={options} />
      </Suspense>

      <IntelligenceAlertsList alerts={alerts} total={total} />
    </div>
  );
}
