import { MessageCircleHeart } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { EchoPanel } from "@/components/echo/echo-panel";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import {
  getEchoChurnRisks,
  getEchoFeatureRequests,
  getEchoFeedback,
  getEchoLoveSignals,
  getEchoSentiment,
  getEchoStats,
  getLatestEchoReport,
} from "@/lib/db/echo-queries";

async function loadEchoData() {
  const [feedback, featureRequests, sentiment, loveSignals, churnRisks, dailyReport, weeklyReport, stats] =
    await Promise.all([
      getEchoFeedback(),
      getEchoFeatureRequests(),
      getEchoSentiment(),
      getEchoLoveSignals(),
      getEchoChurnRisks(),
      getLatestEchoReport("daily"),
      getLatestEchoReport("weekly"),
      getEchoStats(),
    ]);
  return { feedback, featureRequests, sentiment, loveSignals, churnRisks, dailyReport, weeklyReport, stats };
}

export default async function EchoPage() {
  const { data, error, configured } = await fetchPageData(loadEchoData);

  if (!configured) {
    return (
      <div>
        <PageHeader title="Echo — Voice of Customer" />
        <ConfigBanner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Echo — Voice of Customer"
        description="Agent 14 analyzes customer feedback from every source. Echo provides insights — humans decide actions."
      />
      <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
        Echo never responds to users. Echo collects from support tickets, app reviews, emails, community, Reddit, social comments, and surveys — then surfaces pain points, feature requests, sentiment, love signals, and churn risks.
      </div>
      {error && <ErrorBanner message={error} />}

      {data ? (
        <EchoPanel {...data} />
      ) : (
        !error && (
          <EmptyState
            icon={MessageCircleHeart}
            title="Echo not initialized"
            description="System setup is still finishing. Once ready, run a VoC scan."
          />
        )
      )}
    </div>
  );
}
