export const TRACKED_COMPETITORS = [
  "PictureThis",
  "Planta",
  "PlantIn",
  "Greg",
  "Blossom",
  "PlantNet",
  "Gardenia",
  "Garden Answers",
] as const;

export type TrackedCompetitor = (typeof TRACKED_COMPETITORS)[number];

export interface MockIntelAlert {
  competitor: TrackedCompetitor;
  alertType: "new_feature" | "app_store_ranking" | "viral_post" | "new_ad" | "negative_reviews" | "partnership_discovered" | "social_growth" | "review_trend";
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  source: string;
  recommendedAction: string;
}

const ALERT_POOL: MockIntelAlert[] = [
  {
    competitor: "Blossom",
    alertType: "social_growth",
    title: "Blossom Instagram reels up 22% this week",
    description: "Succulent care reels averaging 45k views. Hashtag #BlossomApp trending in plant parent niche.",
    severity: "medium",
    source: "Instagram",
    recommendedAction: "Test succulent-specific care content on our channels.",
  },
  {
    competitor: "PlantIn",
    alertType: "new_ad",
    title: "PlantIn YouTube pre-roll ads detected",
    description: "15-second ''snap and diagnose'' ads running on gardening channels.",
    severity: "medium",
    source: "YouTube",
    recommendedAction: "Differentiate messaging — diagnosis without ongoing care is incomplete.",
  },
  {
    competitor: "Garden Answers",
    alertType: "partnership_discovered",
    title: "Garden Answers × Burpee seed partnership",
    description: "Co-branded spring planting guide with QR to Garden Answers forum.",
    severity: "low",
    source: "Web",
    recommendedAction: "Explore seed company partnerships in our pipeline tracker.",
  },
  {
    competitor: "PictureThis",
    alertType: "review_trend",
    title: "PictureThis review velocity slowing",
    description: "New review count down 12% month-over-month. Users citing subscription fatigue.",
    severity: "low",
    source: "App Store",
    recommendedAction: "Opportunity to position PlantPal as fair-value care companion.",
  },
];

export function pickMockAlerts(count: number): MockIntelAlert[] {
  return [...ALERT_POOL].sort(() => Math.random() - 0.5).slice(0, Math.min(count, ALERT_POOL.length));
}

export function buildDailyBrief(alerts: MockIntelAlert[]) {
  const high = alerts.filter((a) => a.severity === "high");
  const threat = high[0] ?? alerts[0];
  const opportunity = alerts.find((a) => a.alertType === "negative_reviews" || a.alertType === "review_trend") ?? alerts[1];

  return {
    biggestThreat: threat
      ? `${threat.competitor}: ${threat.title}`
      : "No critical threats detected today.",
    biggestOpportunity: opportunity
      ? `${opportunity.competitor} — ${opportunity.description.slice(0, 120)}`
      : "Monitor for review trend shifts among mid-tier competitors.",
    recommendedResponse: alerts
      .slice(0, 3)
      .map((a, i) => `${i + 1}) ${a.recommendedAction}`)
      .join(" "),
  };
}
