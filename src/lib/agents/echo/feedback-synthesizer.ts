import {
  classifyUrgency,
  computeFeaturePriority,
  computeSentimentTrend,
} from "@/lib/agents/echo/sentiment-engine";
import type {
  EchoCategory,
  EchoChurnRiskDraft,
  EchoFeedbackDraft,
  EchoFeatureRequestDraft,
  EchoLoveSignalDraft,
  EchoReportSections,
  EchoSentimentSnapshot,
} from "@/lib/types";

const SEED_FEEDBACK: EchoFeedbackDraft[] = [
  { source: "app_review", category: "plant_doctor", feedbackType: "praise", sentiment: "positive", content: "Plant Doctor saved my fiddle leaf fig — diagnosed root rot before I killed it!", author: "Sarah M.", rating: 5 },
  { source: "reddit", category: "landscape_designer", feedbackType: "feature_request", sentiment: "neutral", content: "Would love a landscape designer feature to plan my backyard beds visually", author: "u/garden_planner_42", rating: null },
  { source: "support_ticket", category: "onboarding", feedbackType: "confusion", sentiment: "negative", content: "I signed up but can't figure out how to add my first plant — where is the button?", author: "Ticket #1847", rating: null },
  { source: "app_review", category: "plant_identification", feedbackType: "satisfaction", sentiment: "positive", content: "Best plant ID app I've used — identified 12 plants on my first walk", author: "James K.", rating: 5 },
  { source: "survey", category: "academy", feedbackType: "feature_request", sentiment: "neutral", content: "Need more vegetable gardening content in Academy — tomatoes, peppers, herbs", author: "Survey #892", rating: null },
  { source: "tiktok_comment", category: "reminders", feedbackType: "praise", sentiment: "positive", content: "The watering reminders are a game changer — my plants have never looked better", author: "@plantmom_tiktok", rating: null },
  { source: "email", category: "pricing", feedbackType: "complaint", sentiment: "negative", content: "Premium is too expensive for what you get — considering canceling", author: "mike@email.com", rating: null },
  { source: "youtube_comment", category: "plant_doctor", feedbackType: "praise", sentiment: "positive", content: "Plant Doctor feature is incredible — showed me exactly what was wrong with my monstera", author: "GardenTube Fan", rating: null },
  { source: "facebook_groups", category: "community", feedbackType: "feature_request", sentiment: "neutral", content: "Wish there was a way to connect with other plant parents in my city", author: "FB Group Member", rating: null },
  { source: "app_review", category: "performance", feedbackType: "bug_report", sentiment: "urgent", content: "App crashes every time I open Plant Doctor on iOS 18 — unusable", author: "Alex T.", rating: 1 },
  { source: "instagram_comment", category: "tasks", feedbackType: "friction", sentiment: "negative", content: "Task list is confusing — too many notifications, can't customize schedule", author: "@urbanjunglejen", rating: null },
  { source: "reddit", category: "subscriptions", feedbackType: "retention_issue", sentiment: "negative", content: "Free tier is too limited — can't justify $9.99/month for reminders only", author: "u/frugal_planter", rating: null },
  { source: "survey", category: "landscape_designer", feedbackType: "feature_request", sentiment: "neutral", content: "Landscape designer would be amazing for planning raised beds", author: "Survey #901", rating: null },
  { source: "app_review", category: "onboarding", feedbackType: "onboarding_issue", sentiment: "negative", content: "Onboarding asks too many questions before I can add a plant", author: "New User", rating: 2 },
  { source: "community_comment", category: "academy", feedbackType: "praise", sentiment: "positive", content: "Academy courses helped me go from plant killer to confident parent in 30 days", author: "Community Member", rating: null },
];

const FEATURE_REQUESTS: Omit<EchoFeatureRequestDraft, "priority">[] = [
  { featureName: "Landscape Designer", category: "landscape_designer", description: "Visual backyard and bed planning tool", frequency: 42, impact: 88, estimatedDemand: 420, trend: "rising" },
  { featureName: "Vegetable Gardening Track", category: "academy", description: "Dedicated vegetable content — tomatoes, peppers, herbs", frequency: 38, impact: 75, estimatedDemand: 380, trend: "rising" },
  { featureName: "Local Community Groups", category: "community", description: "Connect with plant parents in your city", frequency: 24, impact: 65, estimatedDemand: 240, trend: "emerging" },
  { featureName: "Custom Reminder Schedules", category: "reminders", description: "Flexible notification timing per plant", frequency: 19, impact: 70, estimatedDemand: 190, trend: "stable" },
  { featureName: "Multi-Plant Dashboard", category: "tasks", description: "Overview of all plants health at a glance", frequency: 15, impact: 60, estimatedDemand: 150, trend: "stable" },
  { featureName: "Offline Plant ID", category: "plant_identification", description: "Identify plants without internet connection", frequency: 12, impact: 55, estimatedDemand: 120, trend: "emerging" },
];

export function synthesizeFeedback(): EchoFeedbackDraft[] {
  return SEED_FEEDBACK.map((f) => ({
    ...f,
    sentiment: classifyUrgency(f.content, f.sentiment),
  }));
}

export function synthesizeFeatureRequests(): EchoFeatureRequestDraft[] {
  return FEATURE_REQUESTS.map((f) => ({
    ...f,
    priority: computeFeaturePriority(f.frequency, f.impact, f.estimatedDemand),
  })).sort((a, b) => b.priority - a.priority);
}

export function synthesizeSentiment(feedback: EchoFeedbackDraft[]): EchoSentimentSnapshot {
  const counts = { positive: 0, neutral: 0, negative: 0, urgent: 0 };
  const categoryCounts: Record<string, number> = {};

  for (const f of feedback) {
    counts[f.sentiment]++;
    categoryCounts[f.category] = (categoryCounts[f.category] ?? 0) + 1;
  }

  const total = feedback.length || 1;
  const positivePct = Math.round((counts.positive / total) * 1000) / 10;
  const negativePct = Math.round(((counts.negative + counts.urgent) / total) * 1000) / 10;
  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "general_feedback";

  return {
    positiveCount: counts.positive,
    neutralCount: counts.neutral,
    negativeCount: counts.negative,
    urgentCount: counts.urgent,
    positivePct,
    negativePct,
    trendDirection: computeSentimentTrend(positivePct, 58),
    topCategory: topCategory as EchoCategory,
    notes: counts.urgent > 0 ? `${counts.urgent} urgent items require immediate review` : "Sentiment stable week-over-week",
  };
}

export function synthesizeLoveSignals(): EchoLoveSignalDraft[] {
  return [
    { feature: "Plant Doctor", quote: "Plant Doctor saved my fiddle leaf fig — diagnosed root rot before I killed it!", source: "app_review", category: "plant_doctor", marketingPotential: 92, testimonialReady: true, ambassadorPotential: false },
    { feature: "Plant Identification", quote: "Best plant ID app I've used — identified 12 plants on my first walk", source: "app_review", category: "plant_identification", marketingPotential: 88, testimonialReady: true, ambassadorPotential: true },
    { feature: "Watering Reminders", quote: "The watering reminders are a game changer — my plants have never looked better", source: "tiktok_comment", category: "reminders", marketingPotential: 85, testimonialReady: true, ambassadorPotential: true },
    { feature: "Plant Doctor", quote: "Plant Doctor feature is incredible — showed me exactly what was wrong with my monstera", source: "youtube_comment", category: "plant_doctor", marketingPotential: 90, testimonialReady: true, ambassadorPotential: false },
    { feature: "Academy", quote: "Academy courses helped me go from plant killer to confident parent in 30 days", source: "community_comment", category: "academy", marketingPotential: 82, testimonialReady: true, ambassadorPotential: true },
  ];
}

export function synthesizeChurnRisks(): EchoChurnRiskDraft[] {
  return [
    { title: "Onboarding confusion blocking activation", description: "Multiple users can't find how to add first plant — high drop-off risk in first session", churnReason: "confusion", severity: "high", affectedUsersEstimate: 340, suggestedAction: "Simplify onboarding to 2 steps — add plant CTA on home screen" },
    { title: "Premium pricing pushback", description: "Users feel free tier too limited and premium too expensive for reminders-only value", churnReason: "pricing", severity: "medium", affectedUsersEstimate: 180, suggestedAction: "Highlight Plant Doctor + Academy value in upgrade prompt" },
    { title: "iOS Plant Doctor crash", description: "App crashes on iOS 18 when opening Plant Doctor — blocks core feature", churnReason: "bugs", severity: "high", affectedUsersEstimate: 95, suggestedAction: "Escalate to engineering — urgent bug fix before next release" },
    { title: "Notification overload", description: "Users frustrated by too many task reminders with no customization", churnReason: "poor_experience", severity: "medium", affectedUsersEstimate: 120, suggestedAction: "Ship custom reminder schedules — already top feature request" },
    { title: "Missing landscape designer", description: "42 users requesting landscape designer — competitive gap vs alternatives", churnReason: "missing_features", severity: "medium", affectedUsersEstimate: 42, suggestedAction: "Prioritize landscape designer in product roadmap discussion" },
  ];
}

export function synthesizeDailyReport(
  feedback: EchoFeedbackDraft[],
  features: EchoFeatureRequestDraft[],
  churnRisks: EchoChurnRiskDraft[],
  loveSignals: EchoLoveSignalDraft[]
): { executiveSummary: string; sections: EchoReportSections } {
  const complaints = feedback.filter((f) => f.sentiment === "negative" || f.sentiment === "urgent").slice(0, 5);
  const requests = features.slice(0, 5);
  const positive = feedback.filter((f) => f.sentiment === "positive").slice(0, 3);
  const urgent = feedback.filter((f) => f.sentiment === "urgent");

  const sections: EchoReportSections = {
    topComplaints: complaints.map((c) => c.content.slice(0, 120)),
    topFeatureRequests: requests.map((r) => `${r.featureName} (${r.frequency} requests)`),
    topPositiveFeedback: positive.map((p) => p.content.slice(0, 120)),
    urgentIssues: urgent.map((u) => u.content.slice(0, 120)),
    recommendedActions: [
      urgent.length > 0 ? `Address urgent: ${urgent[0].content.slice(0, 60)}` : null,
      requests[0] ? `Evaluate roadmap priority for ${requests[0].featureName}` : null,
      churnRisks[0] ? `Mitigate churn risk: ${churnRisks[0].title}` : null,
      loveSignals[0] ? `Amplify love signal: ${loveSignals[0].feature} testimonial` : null,
    ].filter(Boolean) as string[],
  };

  const executiveSummary = [
    `Echo analyzed ${feedback.length} feedback items today.`,
    `${complaints.length} complaints, ${requests.length} feature requests tracked.`,
    urgent.length > 0 ? `${urgent.length} urgent issues need attention.` : `Sentiment trending ${positive.length > complaints.length ? "positive" : "mixed"}.`,
    `Top request: ${requests[0]?.featureName ?? "none"}. Echo provides insights — humans decide.`,
  ].join(" ");

  return { executiveSummary, sections };
}

export function synthesizeWeeklyReport(
  feedback: EchoFeedbackDraft[],
  features: EchoFeatureRequestDraft[],
  churnRisks: EchoChurnRiskDraft[],
  loveSignals: EchoLoveSignalDraft[]
): { executiveSummary: string; sections: EchoReportSections } {
  const daily = synthesizeDailyReport(feedback, features, churnRisks, loveSignals);

  const weeklySections: EchoReportSections = {
    ...daily.sections,
    whatUsersLove: loveSignals.map((l) => `${l.feature}: "${l.quote.slice(0, 80)}"`),
    whatUsersHate: feedback
      .filter((f) => f.sentiment === "negative")
      .slice(0, 5)
      .map((f) => f.content.slice(0, 100)),
    whatUsersWantNext: features.slice(0, 5).map((f) => `${f.featureName} — ${f.frequency} requests (${f.trend})`),
    biggestRetentionRisks: churnRisks.filter((c) => c.severity === "high").map((c) => c.title),
    productRecommendations: [
      `Prioritize ${features[0]?.featureName ?? "top feature request"} — ${features[0]?.frequency ?? 0} users asking`,
      "Fix onboarding confusion — highest churn risk",
      "Escalate iOS Plant Doctor crash to engineering",
      "Consider vegetable gardening Academy track — rising demand",
    ],
  };

  return {
    executiveSummary: `Weekly Voice of Customer: ${feedback.length} items analyzed. Users love Plant Doctor and reminders. Top demand: ${features[0]?.featureName}. Biggest risk: onboarding confusion.`,
    sections: weeklySections,
  };
}
