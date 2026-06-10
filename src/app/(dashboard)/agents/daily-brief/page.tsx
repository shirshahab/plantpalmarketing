import { Bot, Clock, FileText, ThumbsDown } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { StatCard } from "@/components/ui/stat-card";
import { RunPipelinePanel } from "@/components/agents/run-pipeline-panel";
import { DiscoveryList } from "@/components/agents/discovery-list";
import { BriefStatusBadge } from "@/components/agents/pipeline-status-badge";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import {
  getLatestDailyBrief,
  getDiscoveryItemsByBrief,
  getAgentStats,
} from "@/lib/db/agent-queries";
import { isOpenAIConfigured } from "@/lib/openai/config";
import { isSupabaseConfigured } from "@/lib/supabase/config";

async function loadDailyBriefPage() {
  const [brief, stats] = await Promise.all([getLatestDailyBrief(), getAgentStats()]);
  const discovery = brief ? await getDiscoveryItemsByBrief(brief.id) : [];
  return { brief, discovery, stats };
}

export default async function DailyBriefPage() {
  const configured = isSupabaseConfigured();
  const openaiReady = isOpenAIConfigured();

  if (!configured) {
    return (
      <div>
        <PageHeader title="Daily Brief" />
        <ConfigBanner />
      </div>
    );
  }

  const { data, error } = await fetchPageData(loadDailyBriefPage);
  const brief = data?.brief;
  const discovery = data?.discovery ?? [];
  const stats = data?.stats;

  return (
    <div>
      <PageHeader
        title="Daily Brief"
        description="Discovery Agent output — trending topics, gardener questions, and content opportunities."
      />

      {!openaiReady && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Add <code className="rounded bg-white px-1">OPENAI_API_KEY</code> to{" "}
          <code className="rounded bg-white px-1">.env.local</code> to run agents.
          Run migration <code className="rounded bg-white px-1">004_content_agent_system.sql</code> if tables are missing.
        </div>
      )}

      {error && <ErrorBanner message={error} />}

      <RunPipelinePanel />

      {stats && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Pipeline Runs" value={stats.briefCount} icon={Bot} />
          <StatCard label="Total Content" value={stats.pipelineCount} icon={FileText} />
          <StatCard label="Pending Review" value={stats.pendingCount} icon={Clock} />
          <StatCard label="Director Rejected" value={stats.rejectedCount} icon={ThumbsDown} />
        </div>
      )}

      {brief && (
        <div className="mt-8">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="font-heading text-lg font-semibold text-brand-primary">
              Latest Brief — {new Date(brief.runDate).toLocaleDateString()}
            </h2>
            <BriefStatusBadge status={brief.status} />
          </div>

          {brief.discoverySummary && (
            <div className="mb-6 rounded-2xl border border-brand-primary/10 bg-white p-5">
              <h3 className="text-sm font-semibold text-brand-primary">Executive Summary</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted">{brief.discoverySummary}</p>
              {brief.status === "completed" && (
                <p className="mt-3 text-xs text-brand-muted">
                  {brief.contentCount} pieces generated · {brief.approvedCount} passed director ·{" "}
                  {brief.rejectedCount} rejected
                </p>
              )}
              {brief.status === "failed" && brief.errorMessage && (
                <p className="mt-3 text-sm text-red-600">{brief.errorMessage}</p>
              )}
            </div>
          )}

          <h3 className="mb-3 font-heading text-base font-semibold text-brand-primary">
            Discovery Items ({discovery.length})
          </h3>
          <DiscoveryList items={discovery} />
        </div>
      )}

      {!brief && !error && (
        <p className="mt-8 text-sm text-brand-muted">
          No briefs yet. Click &quot;Run Daily Pipeline&quot; to start the first agent run.
        </p>
      )}
    </div>
  );
}
