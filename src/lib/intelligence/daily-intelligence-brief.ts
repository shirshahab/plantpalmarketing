import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import type { Json } from "@/lib/supabase/database.types";
import { getInternetPulseDashboard } from "@/lib/intelligence/intelligence-engine";

export interface DailyIntelligenceBrief {
  title: string;
  generatedAt: string;
  topTrends: string[];
  topOpportunities: string[];
  competitorActivity: string[];
  recommendedContent: string[];
  recommendedReplies: string[];
  intelligenceScore: string;
  pulse: Record<string, unknown>;
}

export async function generateDailyIntelligenceBrief(): Promise<DailyIntelligenceBrief | null> {
  const dashboard = await getInternetPulseDashboard();
  if (!dashboard.hasRealData) return null;

  const { pulse, clusters, score } = dashboard;

  const brief: DailyIntelligenceBrief = {
    title: "Daily Intelligence Brief",
    generatedAt: new Date().toISOString(),
    topTrends: clusters.slice(0, 5).map((c) => `${c.label} (${c.totalMentions} mentions, ${c.growthPercent}% growth)`),
    topOpportunities: [
      ...pulse.trendingTopics.slice(0, 3),
      pulse.contentOpportunities > 0 ? `${pulse.contentOpportunities} content opportunities` : "",
      pulse.seoOpportunities > 0 ? `${pulse.seoOpportunities} SEO topics` : "",
    ].filter(Boolean),
    competitorActivity:
      pulse.competitorMentions > 0
        ? [`${pulse.competitorMentions} competitor mentions detected`, ...dashboard.metrics.topCompetitors.map((c) => c.name)]
        : ["No competitor spikes today"],
    recommendedContent: pulse.trendingTopics.slice(0, 5),
    recommendedReplies: clusters
      .filter((c) => c.id !== "competitor")
      .slice(0, 5)
      .map((c) => `Reply cluster: ${c.label}`),
    intelligenceScore: score,
    pulse: pulse as unknown as Record<string, unknown>,
  };

  try {
    const supabase = createServerClient();
    const reportDate = new Date().toISOString().slice(0, 10);
    const summary = [
      `Intelligence Score: ${score}`,
      `Top trends: ${brief.topTrends.slice(0, 3).join("; ") || "—"}`,
      `Content opportunities: ${pulse.contentOpportunities}`,
      `Community questions: ${pulse.communityQuestions}`,
    ].join("\n");

    const { data: existing } = await supabase
      .from("daily_reports")
      .select("id")
      .eq("report_date", reportDate)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("daily_reports")
        .update({ intelligence_brief: brief as unknown as Json, summary })
        .eq("id", existing.id);
    } else {
      await supabase.from("daily_reports").insert({
        report_date: reportDate,
        summary,
        intelligence_brief: brief as unknown as Json,
        agent_productivity: {} as Json,
        workflow_summary: {} as Json,
        analytics_summary: {} as Json,
        api_usage_summary: {} as Json,
        growth_recommendations: {} as Json,
        recommended_actions: {} as Json,
      });
    }
  } catch (e) {
    if (!(e && typeof e === "object" && "message" in e && isMissingTableError(e as { message: string }))) {
      // brief still returned even if save fails
    }
  }

  return brief;
}
