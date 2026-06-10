import {
  clampMetric,
  computeOpportunityScore,
  forecastUsers,
  inferGrowthStage,
} from "@/lib/agents/atlas/decision-engine";
import type {
  AtlasBottleneckDraft,
  AtlasExperimentDraft,
  AtlasForecastDraft,
  AtlasGrowthReportSections,
  AtlasRecommendationDraft,
} from "@/lib/types";

export interface AtlasGrowthContext {
  totalUsers: number;
  totalInstalls: number;
  waitlistCount: number;
  conversionRate: number;
  engagementRate: number;
  retentionD7: number;
  retentionD30: number;
  trafficSessions: number;
  channelBreakdown: Record<string, number>;
  oakInstalls: number;
  topCreatorHandle?: string;
  topCreatorFollowers?: number;
  sproutPlatforms: string[];
  pendingApprovals: number;
}

const EXPERIMENT_TEMPLATES: Omit<AtlasExperimentDraft, "priorityScore">[] = [
  {
    name: "Referral Campaign",
    hypothesis: "Plant parents refer friends when rewarded with premium care streaks",
    expectedOutcome: "+15% weekly installs from word-of-mouth",
    effort: "medium",
    impact: 78,
    status: "proposed",
    results: "",
  },
  {
    name: "Plant Rescue Challenge",
    hypothesis: "30-day rescue challenge drives viral TikTok content and app installs",
    expectedOutcome: "+800 installs in 30 days via creator amplification",
    effort: "low",
    impact: 85,
    status: "proposed",
    results: "",
  },
  {
    name: "Creator Ambassador Program",
    hypothesis: "5 micro-creators with unique codes outperform paid ads on CAC",
    expectedOutcome: "2,000 installs/month at <$2 CAC",
    effort: "medium",
    impact: 88,
    status: "proposed",
    results: "",
  },
  {
    name: "Waitlist Giveaway",
    hypothesis: "Free premium year for waitlist referrals accelerates pre-launch growth",
    expectedOutcome: "+500 waitlist signups in 2 weeks",
    effort: "low",
    impact: 65,
    status: "proposed",
    results: "",
  },
  {
    name: "Local Gardening Reports",
    hypothesis: "City-specific plant care reports rank in local search and drive organic installs",
    expectedOutcome: "+200 organic installs/month per city launched",
    effort: "high",
    impact: 72,
    status: "proposed",
    results: "",
  },
  {
    name: "Garden Streak Program",
    hypothesis: "Daily care streaks with push notifications improve D7 retention by 12%",
    expectedOutcome: "Retention D7 from 34% → 46%",
    effort: "medium",
    impact: 82,
    status: "proposed",
    results: "",
  },
];

function channelScores(channels: Record<string, number>) {
  const entries = Object.entries(channels).sort((a, b) => b[1] - a[1]);
  const best = entries[0] ?? ["tiktok", 0];
  const worst = entries[entries.length - 1] ?? ["x", 0];
  return { best, worst, entries };
}

export function synthesizeBottlenecks(ctx: AtlasGrowthContext): AtlasBottleneckDraft[] {
  const bottlenecks: AtlasBottleneckDraft[] = [];

  if (ctx.conversionRate < 4) {
    bottlenecks.push({
      bottleneckType: "conversion",
      title: "Weak landing page conversion",
      description: `Conversion rate ${ctx.conversionRate}% is below 4% benchmark for plant apps`,
      severity: ctx.conversionRate < 2.5 ? "high" : "medium",
      suggestedFix: "A/B test hero copy emphasizing 'save your plants' + add social proof from Oak partnerships",
      metricValue: ctx.conversionRate,
      benchmarkValue: 4,
    });
  }

  if (ctx.engagementRate < 40) {
    bottlenecks.push({
      bottleneckType: "engagement",
      title: "Low in-app engagement",
      description: `Engagement rate ${ctx.engagementRate}% — users install but don't complete onboarding`,
      severity: "medium",
      suggestedFix: "Launch Garden Streak Program experiment — push notifications on day 1, 3, 7",
      metricValue: ctx.engagementRate,
      benchmarkValue: 45,
    });
  }

  if (ctx.retentionD7 < 35) {
    bottlenecks.push({
      bottleneckType: "retention",
      title: "Poor D7 retention",
      description: `Only ${ctx.retentionD7}% of users return after 7 days`,
      severity: ctx.retentionD7 < 25 ? "high" : "medium",
      suggestedFix: "Add plant rescue reminders + weekly care digest email",
      metricValue: ctx.retentionD7,
      benchmarkValue: 40,
    });
  }

  const { worst } = channelScores(ctx.channelBreakdown);
  if (worst[1] < 5) {
    bottlenecks.push({
      bottleneckType: "channel_underperformance",
      title: `Underperforming channel: ${worst[0]}`,
      description: `${worst[0]} drives only ${worst[1]}% of installs — below 5% threshold`,
      severity: "low",
      suggestedFix: `Pause ${worst[0]} spend; reallocate to top channel. Test 2 weeks before deprioritizing.`,
      metricValue: worst[1],
      benchmarkValue: 5,
    });
  }

  if (ctx.waitlistCount > 0 && ctx.conversionRate < 3) {
    bottlenecks.push({
      bottleneckType: "waitlist",
      title: "Waitlist not converting to installs",
      description: `${ctx.waitlistCount} waitlist signups but low install conversion`,
      severity: "medium",
      suggestedFix: "Run Waitlist Giveaway experiment — referral unlock for premium trial",
      metricValue: ctx.waitlistCount,
      benchmarkValue: 0,
    });
  }

  return bottlenecks;
}

export function synthesizeRecommendations(ctx: AtlasGrowthContext): AtlasRecommendationDraft[] {
  const { best, worst } = channelScores(ctx.channelBreakdown);
  const stage = inferGrowthStage(ctx.totalUsers);
  const recs: AtlasRecommendationDraft[] = [];

  recs.push({
    title: `Prioritize ${best[0]} over ${worst[0]}`,
    description: `${best[0]} drives ${best[1]}% of installs vs ${worst[0]} at ${worst[1]}%. Fastest path to growth is doubling down on ${best[0]}.`,
    category: "channel",
    reach: clampMetric(best[1] * 3),
    cost: 30,
    difficulty: 25,
    virality: best[0] === "tiktok" ? 90 : 60,
    revenuePotential: 55,
    retentionPotential: 45,
    priorityScore: 0,
    sourceAgent: "sprout",
  });

  if (ctx.oakInstalls > 500) {
    const scores = { reach: 75, cost: 40, difficulty: 50, virality: 55, revenuePotential: 80, retentionPotential: 70 };
    recs.push({
      title: "Scale creator partnerships for installs",
      description: `Oak partnerships attributed ${ctx.oakInstalls.toLocaleString()} installs — predict 2,000+ this month with 3 more ambassadors`,
      category: "acquisition",
      ...scores,
      priorityScore: 0,
      sourceAgent: "oak",
    });
  }

  if (worst[0] === "pinterest" || (ctx.channelBreakdown.pinterest ?? 0) < 8) {
    const scores = { reach: 70, cost: 25, difficulty: 35, virality: 65, revenuePotential: 50, retentionPotential: 60 };
    recs.push({
      title: "Pinterest is an underutilized acquisition channel",
      description: "Plant care visual search on Pinterest underindexed — carousel content from Bloom could capture high-intent users",
      category: "acquisition",
      ...scores,
      priorityScore: 0,
      sourceAgent: "bloom",
    });
  }

  if (ctx.retentionD7 < 40) {
    const scores = { reach: 60, cost: 35, difficulty: 40, virality: 50, revenuePotential: 45, retentionPotential: 90 };
    recs.push({
      title: "Launch Garden Streak Program",
      description: "Retention is the bottleneck to 10k users — streaks + push notifications are the fastest win",
      category: "retention",
      ...scores,
      priorityScore: 0,
      sourceAgent: "atlas",
    });
  }

  if (ctx.topCreatorHandle) {
    const scores = { reach: 80, cost: 45, difficulty: 55, virality: 85, revenuePotential: 60, retentionPotential: 50 };
    recs.push({
      title: `Plant Rescue Challenge with ${ctx.topCreatorHandle}`,
      description: `${ctx.topCreatorFollowers?.toLocaleString() ?? "High"} follower creator — 30-day challenge could generate viral loop`,
      category: "experiment",
      ...scores,
      priorityScore: 0,
      sourceAgent: "scout",
    });
  }

  const stageRecs: Record<string, AtlasRecommendationDraft> = {
    "0_to_1k": {
      title: "Focus on single-channel dominance before expanding",
      description: "At 0→1k stage, pick TikTok OR Reddit — not both. Nail one loop first.",
      category: "acquisition",
      reach: 85, cost: 20, difficulty: 30, virality: 80, revenuePotential: 40, retentionPotential: 50,
      priorityScore: 0, sourceAgent: "atlas",
    },
    "1k_to_10k": {
      title: "Activate referral loop + creator ambassadors",
      description: "1k→10k requires word-of-mouth — referral campaign + 5 creator codes",
      category: "acquisition",
      reach: 75, cost: 35, difficulty: 45, virality: 75, revenuePotential: 65, retentionPotential: 55,
      priorityScore: 0, sourceAgent: "atlas",
    },
    "10k_to_100k": {
      title: "Double down on retention before paid acquisition",
      description: "10k→100k — fix D30 retention before scaling paid channels",
      category: "retention",
      reach: 70, cost: 40, difficulty: 50, virality: 45, revenuePotential: 70, retentionPotential: 90,
      priorityScore: 0, sourceAgent: "atlas",
    },
    "100k_to_1m": {
      title: "Expand partnership channels and localized content",
      description: "100k→1m — nursery partnerships + city-specific reports at scale",
      category: "acquisition",
      reach: 90, cost: 55, difficulty: 65, virality: 50, revenuePotential: 85, retentionPotential: 70,
      priorityScore: 0, sourceAgent: "oak",
    },
  };
  recs.push(stageRecs[stage]);

  return recs
    .map((r) => ({
      ...r,
      priorityScore: computeOpportunityScore({
        reach: r.reach,
        cost: r.cost,
        difficulty: r.difficulty,
        virality: r.virality,
        revenuePotential: r.revenuePotential,
        retentionPotential: r.retentionPotential,
      }),
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

export function synthesizeExperiments(ctx: AtlasGrowthContext): AtlasExperimentDraft[] {
  const stage = inferGrowthStage(ctx.totalUsers);
  const filtered =
    stage === "0_to_1k"
      ? EXPERIMENT_TEMPLATES.filter((e) => ["Plant Rescue Challenge", "Waitlist Giveaway"].includes(e.name))
      : stage === "1k_to_10k"
        ? EXPERIMENT_TEMPLATES.filter((e) =>
            ["Referral Campaign", "Plant Rescue Challenge", "Creator Ambassador Program", "Garden Streak Program"].includes(e.name)
          )
        : EXPERIMENT_TEMPLATES;

  return filtered.map((e) => ({
    ...e,
    priorityScore: Math.round(e.impact * 0.6 + (100 - (e.effort === "high" ? 70 : e.effort === "medium" ? 40 : 15)) * 0.4),
  }));
}

export function synthesizeForecasts(ctx: AtlasGrowthContext): AtlasForecastDraft[] {
  const weeklyGrowth =
    ctx.totalUsers < 1000 ? 8 : ctx.totalUsers < 10000 ? 5.5 : ctx.totalUsers < 100000 ? 3.2 : 1.8;

  return [
    {
      horizon: "7d",
      predictedUsers: forecastUsers(ctx.totalUsers, weeklyGrowth, 7),
      predictedInstalls: Math.round(ctx.totalInstalls * 0.02 * (1 + weeklyGrowth / 100)),
      growthRatePct: weeklyGrowth,
      confidence: 82,
      assumptions: `Based on ${weeklyGrowth}% weekly growth, current ${ctx.totalUsers} users`,
    },
    {
      horizon: "30d",
      predictedUsers: forecastUsers(ctx.totalUsers, weeklyGrowth, 30),
      predictedInstalls: Math.round(ctx.totalInstalls * 0.08 * (1 + weeklyGrowth / 100)),
      growthRatePct: weeklyGrowth * 4,
      confidence: 72,
      assumptions: "Assumes no major channel changes; Oak partnerships hold steady",
    },
    {
      horizon: "90d",
      predictedUsers: forecastUsers(ctx.totalUsers, weeklyGrowth * 0.9, 90),
      predictedInstalls: Math.round(ctx.totalInstalls * 0.22),
      growthRatePct: weeklyGrowth * 12,
      confidence: 58,
      assumptions: "Includes 2 growth experiments running — Creator Ambassador + Streak Program",
    },
    {
      horizon: "annual",
      predictedUsers: forecastUsers(ctx.totalUsers, weeklyGrowth * 0.75, 365),
      predictedInstalls: Math.round(ctx.totalInstalls * 1.8),
      growthRatePct: weeklyGrowth * 52,
      confidence: 42,
      assumptions: `Stage: ${inferGrowthStage(ctx.totalUsers)} — high uncertainty beyond 90 days`,
    },
  ];
}

export function synthesizeDailyReport(
  ctx: AtlasGrowthContext,
  recommendations: AtlasRecommendationDraft[],
  bottlenecks: AtlasBottleneckDraft[]
): { executiveSummary: string; sections: AtlasGrowthReportSections } {
  const { best, worst } = channelScores(ctx.channelBreakdown);
  const topOpp = recommendations[0];
  const topRisk = bottlenecks.find((b) => b.severity === "high") ?? bottlenecks[0];
  const fastestWin = recommendations.find((r) => r.cost < 35 && r.difficulty < 40) ?? recommendations[1];

  const sections: AtlasGrowthReportSections = {
    biggestOpportunity: topOpp?.title ?? "Run growth scan to identify opportunities",
    biggestRisk: topRisk?.title ?? "No critical bottlenecks detected",
    fastestWin: fastestWin?.title ?? topOpp?.title ?? "—",
    bestPerformingChannel: `${best[0]} (${best[1]}% of installs)`,
    worstPerformingChannel: `${worst[0]} (${worst[1]}% of installs)`,
    recommendedAction: topOpp?.description ?? "Generate growth brief",
    totalUsers: ctx.totalUsers,
    growthStage: inferGrowthStage(ctx.totalUsers),
  };

  const executiveSummary = [
    `Today's Growth Brief: ${ctx.totalUsers.toLocaleString()} users (${(sections.growthStage ?? "1k_to_10k").replace(/_/g, " → ")}).`,
    topOpp ? `Biggest opportunity: ${topOpp.title}.` : null,
    topRisk ? `Biggest risk: ${topRisk.title}.` : null,
    `Best channel: ${best[0]}. Atlas recommends — humans decide.`,
  ]
    .filter(Boolean)
    .join(" ");

  return { executiveSummary, sections };
}

export function synthesizeWeeklyReport(
  ctx: AtlasGrowthContext,
  recommendations: AtlasRecommendationDraft[]
): { executiveSummary: string; sections: AtlasGrowthReportSections } {
  const daily = synthesizeDailyReport(ctx, recommendations, synthesizeBottlenecks(ctx));

  const weeklySections: AtlasGrowthReportSections = {
    ...daily.sections,
    whatWorked: [
      `${daily.sections.bestPerformingChannel} outperformed targets`,
      ctx.oakInstalls > 0 ? `Oak partnerships: ${ctx.oakInstalls.toLocaleString()} attributed installs` : "Scout finding high-fit creators",
      "Bloom TikTok concepts scoring 80+ viral with Sage",
    ],
    whatFailed: [
      `${daily.sections.worstPerformingChannel} underdelivering`,
      ctx.retentionD7 < 35 ? `D7 retention at ${ctx.retentionD7}% — below target` : "X/Threads engagement flat",
      ctx.pendingApprovals > 3 ? "Approval backlog slowing experiment velocity" : "Paid acquisition CAC rising",
    ],
    doubleDown: recommendations.slice(0, 3).map((r) => r.title),
    stopDoing: [
      `Reduce ${daily.sections.worstPerformingChannel.split(" ")[0]} posting frequency`,
      "Pause low-viral Bloom formats until Sage pass rate improves",
    ],
  };

  return {
    executiveSummary: `Weekly Growth Strategy Memo: ${ctx.totalUsers.toLocaleString()} users. Double down on ${daily.sections.bestPerformingChannel}. Stop: ${weeklySections.stopDoing?.[0]}.`,
    sections: weeklySections,
  };
}
