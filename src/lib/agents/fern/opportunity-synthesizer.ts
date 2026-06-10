import {
  computeAcquisitionScore,
  estimateMonthlyInstalls,
} from "@/lib/agents/fern/acquisition-engine";
import type {
  FernExperimentDraft,
  FernForecastDraft,
  FernOpportunityDraft,
  FernTrafficSource,
} from "@/lib/types";

export interface FernAcquisitionContext {
  totalInstalls: number;
  channelBreakdown: Record<string, number>;
  creatorLeadCount: number;
  highPriorityCreators: number;
  communityOpportunities: number;
  partnershipPipeline: number;
  oakAttributedInstalls: number;
  waitlistCount: number;
  topCreatorHandle?: string;
  viralContentCount: number;
}

const TRAFFIC_SOURCES: FernTrafficSource[] = [
  "instagram", "tiktok", "youtube", "pinterest", "reddit",
  "facebook_groups", "google_search", "influencers", "partnerships",
];

function scoreOpportunity(
  draft: Omit<FernOpportunityDraft, "priorityScore">
): FernOpportunityDraft {
  return {
    ...draft,
    priorityScore: computeAcquisitionScore({
      reach: draft.reach,
      cost: draft.cost,
      difficulty: draft.difficulty,
      virality: draft.virality,
      estimatedInstalls: draft.estimatedInstalls,
    }),
  };
}

export function synthesizeOpportunities(ctx: FernAcquisitionContext): FernOpportunityDraft[] {
  const drafts: Omit<FernOpportunityDraft, "priorityScore">[] = [];

  drafts.push({
    title: "Partner with 50 gardening creators",
    description: `Scout found ${ctx.creatorLeadCount} creators — ${ctx.highPriorityCreators} high priority. Micro-creator codes outperform paid ads on CAC.`,
    trafficSource: "influencers",
    opportunityType: "partnership",
    reach: 85,
    cost: 45,
    difficulty: 55,
    virality: 80,
    estimatedInstalls: 2000,
    sourceAgent: "scout",
  });

  drafts.push({
    title: "Launch a 30 Day Plant Rescue Challenge",
    description: "Viral TikTok loop — users document saves with PlantPal reminders. Bloom has high-viral concepts ready for Sage review.",
    trafficSource: "tiktok",
    opportunityType: "viral_loop",
    reach: 90,
    cost: 25,
    difficulty: 35,
    virality: 92,
    estimatedInstalls: 1200,
    sourceAgent: "bloom",
  });

  drafts.push({
    title: "Create ZIP-based gardening reports",
    description: "Local SEO play — city-specific plant care reports rank in Google Search and drive organic installs.",
    trafficSource: "google_search",
    opportunityType: "acquisition",
    reach: 70,
    cost: 30,
    difficulty: 50,
    virality: 40,
    estimatedInstalls: 400,
    sourceAgent: "atlas",
  });

  drafts.push({
    title: "Create local gardening Facebook groups",
    description: `Roots found ${ctx.communityOpportunities} community opportunities — seed helpful groups in top metros.`,
    trafficSource: "facebook_groups",
    opportunityType: "community",
    reach: 65,
    cost: 20,
    difficulty: 40,
    virality: 55,
    estimatedInstalls: 350,
    sourceAgent: "roots",
  });

  const pinterestShare = ctx.channelBreakdown.pinterest ?? 6;
  drafts.push({
    title: "Build Pinterest traffic funnels",
    description: `Pinterest at ${pinterestShare}% of installs — underutilized. Carousel + save-to-board funnels could add 500 monthly installs.`,
    trafficSource: "pinterest",
    opportunityType: "traffic",
    reach: 75,
    cost: 22,
    difficulty: 38,
    virality: 68,
    estimatedInstalls: 500,
    sourceAgent: "bloom",
  });

  drafts.push({
    title: "Run a waitlist referral campaign",
    description: `${ctx.waitlistCount} waitlist signups — referral unlock for premium trial accelerates pre-launch word-of-mouth.`,
    trafficSource: "referral",
    opportunityType: "referral",
    reach: 60,
    cost: 15,
    difficulty: 25,
    virality: 70,
    estimatedInstalls: 600,
    sourceAgent: "ivy",
  });

  if (ctx.topCreatorHandle) {
    drafts.push({
      title: `Tomato Challenge campaign with ${ctx.topCreatorHandle}`,
      description: "Seasonal hook — tomato season rescue content drives installs from gardening audience.",
      trafficSource: "youtube",
      opportunityType: "viral_loop",
      reach: 78,
      cost: 40,
      difficulty: 45,
      virality: 82,
      estimatedInstalls: 900,
      sourceAgent: "scout",
    });
  }

  drafts.push({
    title: "Reddit helpful-reply acquisition loop",
    description: "Roots drafts helpful replies in r/houseplants, r/plantclinic — never spammy. High-intent traffic.",
    trafficSource: "reddit",
    opportunityType: "community",
    reach: 55,
    cost: 10,
    difficulty: 30,
    virality: 45,
    estimatedInstalls: 280,
    sourceAgent: "roots",
  });

  if (ctx.oakAttributedInstalls > 500) {
    drafts.push({
      title: "Scale nursery partnership install funnel",
      description: `Oak attributed ${ctx.oakAttributedInstalls.toLocaleString()} installs — in-store QR on plant tags is highest-ROI partnership channel.`,
      trafficSource: "partnerships",
      opportunityType: "partnership",
      reach: 72,
      cost: 35,
      difficulty: 48,
      virality: 50,
      estimatedInstalls: 800,
      sourceAgent: "oak",
    });
  }

  drafts.push({
    title: "Instagram Reels plant parent check-ins",
    description: "Repurpose Sage-approved Bloom Reels — weekly check-in format builds habit and shareability.",
    trafficSource: "instagram",
    opportunityType: "acquisition",
    reach: 80,
    cost: 28,
    difficulty: 32,
    virality: 75,
    estimatedInstalls: 650,
    sourceAgent: "bloom",
  });

  const tiktokShare = ctx.channelBreakdown.tiktok ?? 38;
  if (tiktokShare > 30) {
    drafts.push({
      title: "Double TikTok posting cadence",
      description: `TikTok drives ${tiktokShare}% of installs — highest-performing channel. Fern recommends prioritizing TikTok over X.`,
      trafficSource: "tiktok",
      opportunityType: "traffic",
      reach: 88,
      cost: 20,
      difficulty: 22,
      virality: 90,
      estimatedInstalls: 1100,
      sourceAgent: "sentinel",
    });
  }

  return drafts
    .map(scoreOpportunity)
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 10);
}

export function synthesizeExperiments(): FernExperimentDraft[] {
  return [
    {
      name: "Plant Rescue Challenge",
      hypothesis: "30-day rescue challenge on TikTok drives viral installs via creator amplification",
      effort: "low",
      expectedImpact: 88,
      status: "proposed",
      results: "",
    },
    {
      name: "Creator Ambassador Program",
      hypothesis: "5 micro-creators with unique codes outperform paid ads this month",
      effort: "medium",
      expectedImpact: 90,
      status: "proposed",
      results: "",
    },
    {
      name: "Pinterest Save Funnel",
      hypothesis: "Carousel pins with care-plan CTAs convert visual search intent to installs",
      effort: "low",
      expectedImpact: 72,
      status: "proposed",
      results: "",
    },
    {
      name: "Waitlist Referral Unlock",
      hypothesis: "Refer-3-get-premium unlock grows waitlist 40% in 2 weeks",
      effort: "low",
      expectedImpact: 65,
      status: "proposed",
      results: "",
    },
    {
      name: "ZIP Gardening Reports",
      hypothesis: "Local SEO reports in 10 cities drive 200 organic installs/month each",
      effort: "high",
      expectedImpact: 70,
      status: "proposed",
      results: "",
    },
  ];
}

export function synthesizeForecasts(ctx: FernAcquisitionContext): FernForecastDraft[] {
  const monthlyBase = Math.max(200, Math.round(ctx.totalInstalls * 0.08));

  const forecasts: FernForecastDraft[] = [
    {
      horizon: "7d",
      trafficSource: "all",
      predictedInstalls: Math.round(monthlyBase * 0.25),
      confidence: 80,
      assumptions: "Baseline weekly install velocity across all channels",
    },
    {
      horizon: "30d",
      trafficSource: "all",
      predictedInstalls: monthlyBase,
      confidence: 72,
      assumptions: "No new experiments launched — current channel mix holds",
    },
    {
      horizon: "monthly",
      trafficSource: "tiktok",
      predictedInstalls: estimateMonthlyInstalls(monthlyBase, ctx.channelBreakdown.tiktok ?? 38, 15),
      confidence: 75,
      assumptions: "TikTok share grows with doubled posting cadence",
    },
    {
      horizon: "monthly",
      trafficSource: "pinterest",
      predictedInstalls: 500,
      confidence: 68,
      assumptions: "Pinterest funnel experiment — Fern identified 500 monthly install opportunity",
    },
    {
      horizon: "monthly",
      trafficSource: "influencers",
      predictedInstalls: 2000,
      confidence: 62,
      assumptions: "Creator partnerships outperform paid ads — 50 creator outreach program",
    },
    {
      horizon: "90d",
      trafficSource: "all",
      predictedInstalls: Math.round(monthlyBase * 2.8),
      confidence: 50,
      assumptions: "Includes Plant Rescue Challenge + ambassador program if approved",
    },
  ];

  return forecasts;
}

export function synthesizeChannelBreakdown(
  opportunities: FernOpportunityDraft[]
): Record<FernTrafficSource, { installs: number; score: number }> {
  const breakdown = {} as Record<string, { installs: number; score: number }>;
  for (const src of TRAFFIC_SOURCES) {
    const opps = opportunities.filter((o) => o.trafficSource === src);
    breakdown[src] = {
      installs: opps.reduce((s, o) => s + o.estimatedInstalls, 0),
      score: opps.length > 0 ? Math.round(opps.reduce((s, o) => s + o.priorityScore, 0) / opps.length) : 0,
    };
  }
  return breakdown as Record<FernTrafficSource, { installs: number; score: number }>;
}
