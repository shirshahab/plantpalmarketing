import { clampScore, computePriorityScore } from "@/lib/agents/ivy/decision-engine";
import type {
  IvyBriefSections,
  IvyRecommendationCategory,
  IvyRecommendationDraft,
  IvyAlertDraft,
} from "@/lib/types";

export interface IvyAgentContext {
  pendingApprovals: { id: string; type: string; channel: string; draft: string; createdAt: string }[];
  topCreator: { name: string; handle: string; partnershipScore: number; followers: number } | null;
  topPartnership: { partnerName: string; stage: string; revenueGenerated: number; collaborationIdea: string } | null;
  topCompetitorThreat: { competitor: string; title: string; description: string; severity: string } | null;
  topContent: { platform: string; hook: string; viralScore: number; aggregateScore?: number } | null;
  communityTrends: string[];
  sproutReady: { platform: string; title: string; hook: string; id: string }[];
  urgentAlertsCount: number;
  pendingOutreach: number;
  highSeverityCompetitorAlerts: number;
}

function scoreApproval(item: IvyAgentContext["pendingApprovals"][0]): IvyRecommendationDraft {
  const isPartnership = item.channel === "Partnership" || item.type === "reply";
  const scores = {
    revenueImpact: isPartnership ? 85 : 55,
    growthImpact: isPartnership ? 80 : 60,
    viralityPotential: 40,
    timeSensitivity: 75,
  };
  return {
    category: "approval" as IvyRecommendationCategory,
    title: `Approve ${item.channel} item in queue`,
    description: item.draft.slice(0, 200),
    ...scores,
    priorityScore: computePriorityScore(scores),
    sourceAgent: isPartnership ? "oak" : "gate",
    sourceEntityId: item.id,
  };
}

function scorePartnershipROI(ctx: IvyAgentContext): IvyRecommendationDraft | null {
  if (!ctx.topPartnership) return null;
  const p = ctx.topPartnership;
  const scores = {
    revenueImpact: clampScore(p.revenueGenerated > 5000 ? 95 : p.revenueGenerated > 1000 ? 80 : 65),
    growthImpact: p.stage === "negotiating" ? 90 : 70,
    viralityPotential: 55,
    timeSensitivity: p.stage === "negotiating" ? 88 : 60,
  };
  return {
    category: "roi_action",
    title: `Prioritize ${p.partnerName} partnership`,
    description: `${p.stage} — ${p.collaborationIdea.slice(0, 150)}`,
    ...scores,
    priorityScore: computePriorityScore(scores),
    sourceAgent: "oak",
    sourceEntityId: null,
  };
}

function scoreCreatorGrowth(ctx: IvyAgentContext): IvyRecommendationDraft | null {
  if (!ctx.topCreator) return null;
  const c = ctx.topCreator;
  const scores = {
    revenueImpact: 50,
    growthImpact: clampScore(c.partnershipScore),
    viralityPotential: clampScore(Math.min(100, c.followers / 10000)),
    timeSensitivity: 70,
  };
  return {
    category: "growth_opportunity",
    title: `Convert ${c.handle} to Oak pipeline`,
    description: `${c.name} — ${c.followers.toLocaleString()} followers, partnership score ${c.partnershipScore}`,
    ...scores,
    priorityScore: computePriorityScore(scores),
    sourceAgent: "scout",
    sourceEntityId: null,
  };
}

function scoreSproutPublish(post: IvyAgentContext["sproutReady"][0]): IvyRecommendationDraft {
  const scores = {
    revenueImpact: 45,
    growthImpact: 75,
    viralityPotential: 85,
    timeSensitivity: 90,
  };
  return {
    category: "roi_action",
    title: `Publish ${post.platform} post today`,
    description: post.hook.slice(0, 150) || post.title,
    ...scores,
    priorityScore: computePriorityScore(scores),
    sourceAgent: "sprout",
    sourceEntityId: post.id,
  };
}

function scoreCompetitorThreat(ctx: IvyAgentContext): IvyRecommendationDraft | null {
  if (!ctx.topCompetitorThreat) return null;
  const t = ctx.topCompetitorThreat;
  const scores = {
    revenueImpact: t.severity === "high" ? 80 : 55,
    growthImpact: 50,
    viralityPotential: 35,
    timeSensitivity: t.severity === "high" ? 95 : 70,
  };
  return {
    category: "threat",
    title: `Review competitor: ${t.competitor} — ${t.title}`,
    description: t.description.slice(0, 200),
    ...scores,
    priorityScore: computePriorityScore(scores),
    sourceAgent: "sentinel",
    sourceEntityId: null,
  };
}

function scoreCommunityTrend(trend: string, index: number): IvyRecommendationDraft {
  const scores = {
    revenueImpact: 35,
    growthImpact: 70 - index * 5,
    viralityPotential: 60,
    timeSensitivity: 55,
  };
  return {
    category: "growth_opportunity",
    title: `Engage community trend: ${trend.slice(0, 60)}`,
    description: trend,
    ...scores,
    priorityScore: computePriorityScore(scores),
    sourceAgent: "roots",
    sourceEntityId: null,
  };
}

export function synthesizeRecommendations(ctx: IvyAgentContext): IvyRecommendationDraft[] {
  const drafts: IvyRecommendationDraft[] = [];

  for (const approval of ctx.pendingApprovals.slice(0, 5)) {
    drafts.push(scoreApproval(approval));
  }

  const partnership = scorePartnershipROI(ctx);
  if (partnership) drafts.push(partnership);

  const creator = scoreCreatorGrowth(ctx);
  if (creator) drafts.push(creator);

  for (const post of ctx.sproutReady.slice(0, 3)) {
    drafts.push(scoreSproutPublish(post));
  }

  const threat = scoreCompetitorThreat(ctx);
  if (threat) drafts.push(threat);

  for (const [i, trend] of ctx.communityTrends.slice(0, 3).entries()) {
    drafts.push(scoreCommunityTrend(trend, i));
  }

  if (ctx.topContent) {
    const scores = {
      revenueImpact: 40,
      growthImpact: 65,
      viralityPotential: clampScore(ctx.topContent.viralScore),
      timeSensitivity: 50,
    };
    drafts.push({
      category: "growth_opportunity",
      title: `Amplify top content: ${ctx.topContent.platform}`,
      description: ctx.topContent.hook.slice(0, 150),
      ...scores,
      priorityScore: computePriorityScore(scores),
      sourceAgent: "bloom",
      sourceEntityId: null,
    });
  }

  return drafts.sort((a, b) => b.priorityScore - a.priorityScore);
}

export function synthesizeAlerts(ctx: IvyAgentContext): IvyAlertDraft[] {
  const alerts: IvyAlertDraft[] = [];

  if (ctx.topCompetitorThreat && ctx.topCompetitorThreat.severity === "high") {
    alerts.push({
      alertType: "urgent",
      title: `Competitor feature launch: ${ctx.topCompetitorThreat.competitor}`,
      description: ctx.topCompetitorThreat.description.slice(0, 250),
      priorityScore: 92,
      sourceAgent: "sentinel",
      sourceEntityId: null,
    });
  }

  if (ctx.pendingOutreach > 0) {
    alerts.push({
      alertType: "urgent",
      title: `${ctx.pendingOutreach} partnership outreach drafts awaiting approval`,
      description: "Oak has queued outreach — human approval required before any contact.",
      priorityScore: 85,
      sourceAgent: "oak",
      sourceEntityId: null,
    });
  }

  if (ctx.pendingApprovals.length > 3) {
    alerts.push({
      alertType: "risk",
      title: `Approval backlog: ${ctx.pendingApprovals.length} items pending`,
      description: "Gate queue is growing — delays may miss time-sensitive opportunities.",
      priorityScore: 78,
      sourceAgent: "gate",
      sourceEntityId: null,
    });
  }

  if (ctx.topPartnership?.stage === "negotiating") {
    alerts.push({
      alertType: "growth",
      title: `High-value deal negotiating: ${ctx.topPartnership.partnerName}`,
      description: ctx.topPartnership.collaborationIdea.slice(0, 200),
      priorityScore: 82,
      sourceAgent: "oak",
      sourceEntityId: null,
    });
  }

  return alerts.sort((a, b) => b.priorityScore - a.priorityScore);
}

export function synthesizeDailyBrief(ctx: IvyAgentContext, recommendations: IvyRecommendationDraft[]): {
  executiveSummary: string;
  sections: IvyBriefSections;
} {
  const topOpp = recommendations.filter((r) => r.category === "growth_opportunity").slice(0, 3);
  const topActions = recommendations.filter((r) => r.category === "roi_action").slice(0, 3);
  const topApproval = recommendations.find((r) => r.category === "approval");

  const sections: IvyBriefSections = {
    executiveSummary: "",
    topOpportunities: topOpp.map((r) => r.title),
    highestPriorityApproval: topApproval?.title ?? "No pending approvals in queue",
    bestCreatorFound: ctx.topCreator
      ? `${ctx.topCreator.name} (${ctx.topCreator.handle}) — score ${ctx.topCreator.partnershipScore}`
      : "No high-priority creators discovered yet — run Scout scan",
    bestPartnershipOpportunity: ctx.topPartnership
      ? `${ctx.topPartnership.partnerName} (${ctx.topPartnership.stage}) — $${ctx.topPartnership.revenueGenerated.toLocaleString()} attributed`
      : "No active partnership pipeline — convert Scout leads via Oak",
    biggestCompetitorThreat: ctx.topCompetitorThreat
      ? `${ctx.topCompetitorThreat.competitor}: ${ctx.topCompetitorThreat.title}`
      : "No high-severity competitor alerts today",
    bestContentCreated: ctx.topContent
      ? `${ctx.topContent.platform}: "${ctx.topContent.hook.slice(0, 80)}" — viral ${ctx.topContent.viralScore}`
      : "No Bloom content scored yet today",
    communityTrends: ctx.communityTrends.length > 0 ? ctx.communityTrends : ["Monitor Roots for emerging plant care discussions"],
    recommendedActions: topActions.map((r) => r.title).concat(
      recommendations.filter((r) => r.category === "threat").slice(0, 1).map((r) => r.title)
    ),
  };

  const urgentCount = ctx.urgentAlertsCount + ctx.highSeverityCompetitorAlerts;
  const executiveSummary = [
    `Good morning. Ivy reviewed all 8 agents overnight.`,
    urgentCount > 0
      ? `${urgentCount} urgent items need your attention today.`
      : `Pipeline is steady — ${ctx.pendingApprovals.length} approvals in queue.`,
    ctx.topPartnership
      ? `Top partnership: ${ctx.topPartnership.partnerName} (${ctx.topPartnership.stage}).`
      : null,
    topApproval ? `First approval: ${topApproval.title}.` : null,
  ]
    .filter(Boolean)
    .join(" ");

  sections.executiveSummary = executiveSummary;

  return { executiveSummary, sections };
}

export function synthesizeWeeklyBrief(ctx: IvyAgentContext, recommendations: IvyRecommendationDraft[]): {
  executiveSummary: string;
  sections: IvyBriefSections;
} {
  const daily = synthesizeDailyBrief(ctx, recommendations);
  const weeklySections: IvyBriefSections = {
    ...daily.sections,
    executiveSummary: `Weekly strategic review: ${recommendations.length} prioritized actions across Scout, Roots, Sentinel, Bloom, Sage, Sprout, Oak, and Gate. ${ctx.topPartnership ? `Partnership revenue leader: ${ctx.topPartnership.partnerName}.` : ""} Focus this week on approvals, competitor response, and high-ROI creator conversions.`,
    topOpportunities: [
      ...daily.sections.topOpportunities,
      "Review Sage rejection patterns for content quality improvements",
      "Audit Sprout publish cadence vs. engagement windows",
    ].slice(0, 5),
    recommendedActions: [
      "Run Scout + Oak scans to refresh partnership pipeline",
      "Review Sentinel weekly threat landscape",
      ...daily.sections.recommendedActions,
    ].slice(0, 6),
  };

  return {
    executiveSummary: weeklySections.executiveSummary,
    sections: weeklySections,
  };
}

export function pickActionCenter(recommendations: IvyRecommendationDraft[]) {
  return {
    roiActions: recommendations.filter((r) => r.category === "roi_action").slice(0, 3),
    threats: recommendations.filter((r) => r.category === "threat").slice(0, 3),
    approvals: recommendations.filter((r) => r.category === "approval").slice(0, 3),
    growthOpportunities: recommendations.filter((r) => r.category === "growth_opportunity").slice(0, 3),
  };
}
