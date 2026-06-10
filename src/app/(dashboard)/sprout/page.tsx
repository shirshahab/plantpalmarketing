import { Rocket } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { SproutPanel } from "@/components/sprout/sprout-panel";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import {
  getSproutCalendarPosts,
  getSproutQueue,
  getSproutScheduledPosts,
  getSproutStats,
} from "@/lib/db/sprout-queries";

async function loadSproutData() {
  const [allPosts, calendarPosts, queue, readyPosts, stats] = await Promise.all([
    getSproutScheduledPosts(),
    getSproutCalendarPosts(),
    getSproutQueue(),
    getSproutScheduledPosts("ready"),
    getSproutStats(),
  ]);
  return { allPosts, calendarPosts, queue, readyPosts, stats };
}

export default async function SproutPage() {
  const { data, error, configured } = await fetchPageData(loadSproutData);

  if (!configured) {
    return (
      <div>
        <PageHeader title="Sprout — Publishing" />
        <ConfigBanner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Sprout — Publishing Agent"
        description="Agent 9 schedules human-approved content across 6 platforms. Approval required before scheduling. No auto-publishing."
      />
      <div className="mb-6 rounded-2xl border border-lime-200 bg-lime-50 px-4 py-3 text-sm text-lime-900">
        Gate (human) → Sprout (schedule) → Manual publish. Sprout never posts automatically.
      </div>
      {error && <ErrorBanner message={error} />}

      {data ? (
        <SproutPanel
          allPosts={data.allPosts}
          calendarPosts={data.calendarPosts}
          queue={data.queue}
          readyPosts={data.readyPosts}
          stats={data.stats}
        />
      ) : (
        !error && (
          <EmptyState
            icon={Rocket}
            title="Sprout not initialized"
            description="Run migrations 013 + 014, approve content via Gate, then open Sprout."
          />
        )
      )}
    </div>
  );
}
