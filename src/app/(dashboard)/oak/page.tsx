import { TreeDeciduous } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { OakPanel } from "@/components/oak/oak-panel";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import {
  getOakFollowUps,
  getOakOutreachQueue,
  getOakPartnershipPipeline,
  getOakStats,
} from "@/lib/db/oak-queries";

async function loadOakData() {
  const [pipeline, outreachQueue, followUps, stats] = await Promise.all([
    getOakPartnershipPipeline(),
    getOakOutreachQueue(),
    getOakFollowUps(),
    getOakStats(),
  ]);
  return { pipeline, outreachQueue, followUps, stats };
}

export default async function OakPage() {
  const { data, error, configured } = await fetchPageData(loadOakData);

  if (!configured) {
    return (
      <div>
        <PageHeader title="Oak — Partnership Manager" />
        <ConfigBanner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Oak — Partnership Manager"
        description="Agent 10 converts Scout leads into partnerships. Outreach requires approval — no auto-contact."
      />
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Scout discovers → Oak converts → human approves outreach → track through Contacted → Replied → Negotiating → Active → Completed.
      </div>
      {error && <ErrorBanner message={error} />}

      {data ? (
        <OakPanel
          pipeline={data.pipeline}
          outreachQueue={data.outreachQueue}
          followUps={data.followUps}
          stats={data.stats}
        />
      ) : (
        !error && (
          <EmptyState
            icon={TreeDeciduous}
            title="Oak not initialized"
            description="System setup is still finishing. Once ready, convert Scout leads from this page."
          />
        )
      )}
    </div>
  );
}
