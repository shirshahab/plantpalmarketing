import { Server } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { AgentOperationsPanel } from "@/components/agent-operations/agent-operations-panel";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import { getAgentOperationsData } from "@/lib/db/agent-operations-queries";

export default async function AgentOperationsPage() {
  const { data, error, configured } = await fetchPageData(getAgentOperationsData);

  if (!configured) {
    return (
      <div>
        <PageHeader title="Agent Operations" />
        <ConfigBanner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Agent Operations"
        description="Autonomous scheduling via Vercel Cron — track last run, next run, success, failure, and items created. Human approval still required for all outbound actions."
      />
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Agents scan, draft, and queue work 24/7 via Vercel Cron. No auto-posting or auto-outreach — Gate and Sprout stay manual; all outputs go to approval_queue.
      </div>
      {error && <ErrorBanner message={error} />}

      {data && data.schedules.length > 0 ? (
        <AgentOperationsPanel {...data} />
      ) : (
        !error && (
          <EmptyState
            icon={Server}
            title="Agent worker system not initialized"
            description="System setup is still finishing. Set CRON_SECRET and deploy to Vercel for autonomous agent runs."
          />
        )
      )}
    </div>
  );
}
