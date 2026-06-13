import { Flower2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { BloomPanel } from "@/components/bloom/bloom-panel";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import { createServerClient } from "@/lib/supabase/server";
import {
  getBloomCalendarPieces,
  getBloomContentPieces,
  getBloomDraftQueue,
  getBloomPerformance,
  getBloomStats,
} from "@/lib/db/bloom-queries";

async function loadBloomData() {
  const supabase = createServerClient();
  const [pieces, calendarPieces, draftQueue, performance, stats, founderIncomingRes] = await Promise.all([
    getBloomContentPieces(),
    getBloomCalendarPieces(),
    getBloomDraftQueue(),
    getBloomPerformance(),
    getBloomStats(),
    supabase
      .from("creative_content_ideas")
      .select("id, title, hook, status, created_at, updated_at")
      .eq("status", "approved")
      .order("updated_at", { ascending: false })
      .limit(12),
  ]);

  return {
    pieces,
    calendarPieces,
    draftQueue,
    performance,
    stats,
    latestRun: stats.latestRun,
    founderIncoming: (founderIncomingRes.data ?? []).map((row) => ({
      id: String(row.id),
      title: String(row.title ?? "Approved idea"),
      hook: String(row.hook ?? ""),
      updatedAt: String(row.updated_at ?? row.created_at),
    })),
  };
}

export default async function BloomPage() {
  const { data, error, configured } = await fetchPageData(loadBloomData);

  if (!configured) {
    return (
      <div>
        <PageHeader title="Bloom. Content Production" />
        <ConfigBanner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Bloom. Content Production"
        description="Agent 7 generates 39 daily content pieces. All output goes to Sage for Creative Director review before human approval."
      />
      <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Bloom → Sage review gate → Human approval. No content skips Creative Director review.
      </div>
      {error && <ErrorBanner message={error} />}

      {data ? (
        <BloomPanel
          pieces={data.pieces}
          calendarPieces={data.calendarPieces}
          draftQueue={data.draftQueue}
          performance={data.performance}
          latestRun={data.latestRun}
          stats={data.stats}
          founderIncoming={data.founderIncoming}
        />
      ) : (
        !error && (
          <EmptyState
            icon={Flower2}
            title="Bloom not initialized"
            description="System setup is still finishing. Once ready, run Bloom from PlantPal HQ or this page."
          />
        )
      )}
    </div>
  );
}
