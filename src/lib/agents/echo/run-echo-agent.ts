import { runAgentBrain } from "@/lib/agents/ai/agent-brain-engine";
import { isOpenAIConfigured } from "@/lib/openai/config";
import {
  synthesizeChurnRisks,
  synthesizeDailyReport,
  synthesizeFeatureRequests,
  synthesizeFeedback,
  synthesizeLoveSignals,
  synthesizeSentiment,
  synthesizeWeeklyReport,
} from "@/lib/agents/echo/feedback-synthesizer";
import { createServerClient } from "@/lib/supabase/server";
import { recordHandoff } from "@/lib/collaboration/handoff";
import type { Json } from "@/lib/supabase/database.types";

export interface EchoRunResult {
  feedbackCount: number;
  featureRequestCount: number;
  churnRiskCount: number;
  loveSignalCount: number;
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export async function runEchoAgent(): Promise<EchoRunResult> {
  if (isOpenAIConfigured()) {
    await runAgentBrain("echo");
  }

  const supabase = createServerClient();
  const today = todayDateString();

  const feedback = synthesizeFeedback();
  const featureRequests = synthesizeFeatureRequests();
  const sentiment = synthesizeSentiment(feedback);
  const loveSignals = synthesizeLoveSignals();
  const churnRisks = synthesizeChurnRisks();
  const daily = synthesizeDailyReport(feedback, featureRequests, churnRisks, loveSignals);

  await supabase.from("echo_feedback").delete().eq("report_date", today);
  await supabase.from("echo_feature_requests").delete().eq("report_date", today);
  await supabase.from("echo_love_signals").delete().eq("report_date", today);
  await supabase.from("echo_churn_risks").delete().eq("report_date", today);

  if (feedback.length > 0) {
    const { error } = await supabase.from("echo_feedback").insert(
      feedback.map((f) => ({
        source: f.source,
        category: f.category,
        feedback_type: f.feedbackType,
        sentiment: f.sentiment,
        content: f.content,
        author: f.author,
        rating: f.rating,
        report_date: today,
      }))
    );
    if (error) throw new Error(error.message);
  }

  if (featureRequests.length > 0) {
    const { error } = await supabase.from("echo_feature_requests").insert(
      featureRequests.map((f) => ({
        feature_name: f.featureName,
        category: f.category,
        description: f.description,
        frequency: f.frequency,
        priority: f.priority,
        impact: f.impact,
        estimated_demand: f.estimatedDemand,
        trend: f.trend,
        report_date: today,
      }))
    );
    if (error) throw new Error(error.message);
  }

  await supabase.from("echo_sentiment").upsert(
    {
      snapshot_date: today,
      positive_count: sentiment.positiveCount,
      neutral_count: sentiment.neutralCount,
      negative_count: sentiment.negativeCount,
      urgent_count: sentiment.urgentCount,
      positive_pct: sentiment.positivePct,
      negative_pct: sentiment.negativePct,
      trend_direction: sentiment.trendDirection,
      top_category: sentiment.topCategory,
      notes: sentiment.notes,
    },
    { onConflict: "snapshot_date" }
  );

  if (loveSignals.length > 0) {
    const { error } = await supabase.from("echo_love_signals").insert(
      loveSignals.map((l) => ({
        feature: l.feature,
        quote: l.quote,
        source: l.source,
        category: l.category,
        marketing_potential: l.marketingPotential,
        testimonial_ready: l.testimonialReady,
        ambassador_potential: l.ambassadorPotential,
        report_date: today,
      }))
    );
    if (error) throw new Error(error.message);
  }

  if (churnRisks.length > 0) {
    const { error } = await supabase.from("echo_churn_risks").insert(
      churnRisks.map((c) => ({
        title: c.title,
        description: c.description,
        churn_reason: c.churnReason,
        severity: c.severity,
        affected_users_estimate: c.affectedUsersEstimate,
        suggested_action: c.suggestedAction,
        report_date: today,
      }))
    );
    if (error) throw new Error(error.message);
  }

  const { data: existingDaily } = await supabase
    .from("echo_reports")
    .select("id")
    .eq("report_type", "daily")
    .eq("run_date", today)
    .maybeSingle();

  if (existingDaily) {
    await supabase
      .from("echo_reports")
      .update({ executive_summary: daily.executiveSummary, sections: daily.sections as unknown as Json })
      .eq("id", existingDaily.id);
  } else {
    await supabase.from("echo_reports").insert({
      report_type: "daily",
      run_date: today,
      executive_summary: daily.executiveSummary,
      sections: daily.sections as unknown as Json,
    });
  }

  const isMonday = new Date().getDay() === 1;
  const { data: recentWeekly } = await supabase
    .from("echo_reports")
    .select("id")
    .eq("report_type", "weekly")
    .gte("run_date", new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10))
    .limit(1);

  if (isMonday || !recentWeekly?.length) {
    const weekly = synthesizeWeeklyReport(feedback, featureRequests, churnRisks, loveSignals);
    await supabase.from("echo_reports").insert({
      report_type: "weekly",
      run_date: today,
      executive_summary: weekly.executiveSummary,
      sections: weekly.sections as unknown as Json,
    });
  }

  const topFeature = featureRequests[0];
  const topLove = loveSignals[0];

  // Phase 28: feedback insights route to Atlas (product/growth) and Bloom (content)
  if (topFeature) {
    await recordHandoff({
      fromAgent: "echo",
      toAgent: "atlas",
      workflowName: "Echo → Atlas",
      triggerType: "voc_insight",
      taskType: "growth_insight",
      taskDescription: `Top user request: ${topFeature.featureName} (${topFeature.frequency} users, ${topFeature.trend}). Fold into growth recommendations.`,
      priority: topFeature.priority >= 70 ? "high" : "medium",
      messageTitle: `VoC insight: ${topFeature.featureName}`,
      messageBody: `${topFeature.description}\n\nDemand: ${topFeature.estimatedDemand}, trend: ${topFeature.trend}.\n${churnRisks.length} churn risks flagged today.`,
      activityDetail: `Echo handed "${topFeature.featureName}" insight to Atlas`,
      metadata: { frequency: topFeature.frequency },
    });
  }
  if (topLove) {
    await recordHandoff({
      fromAgent: "echo",
      toAgent: "bloom",
      workflowName: "Echo → Bloom",
      triggerType: "love_signal",
      taskType: "content_from_feedback",
      taskDescription: `Turn this user love into content: "${topLove.quote}" (${topLove.feature}). Marketing potential: ${topLove.marketingPotential}.`,
      priority: "medium",
      messageTitle: `Testimonial-ready quote: ${topLove.feature}`,
      messageBody: `"${topLove.quote}" — ${topLove.source}\n\nUse as social proof in the next content batch.`,
      activityDetail: `Echo handed a love signal to Bloom for content`,
      metadata: { feature: topLove.feature },
    });
  }

  await supabase.from("agent_activity_log").insert({
    agent_id: "echo",
    action: "voc_scan",
    detail: topFeature
      ? `VoC scan complete — top request: ${topFeature.featureName} (${topFeature.frequency} users)`
      : `VoC scan complete — ${feedback.length} feedback items analyzed`,
    metadata: { feedback: feedback.length, features: featureRequests.length, urgent: sentiment.urgentCount },
  });

  return {
    feedbackCount: feedback.length,
    featureRequestCount: featureRequests.length,
    churnRiskCount: churnRisks.length,
    loveSignalCount: loveSignals.length,
  };
}
