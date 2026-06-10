import type { AgentSlug } from "@/lib/types";
import type {
  AnalyticsSummary,
  GrowthUpgradeRecommendation,
  RecommendedAction,
  WorkflowSummary,
} from "@/lib/daily-report/types";

interface RecTemplate {
  title: string;
  whyItMatters: string;
  expectedImpact: string;
  effort: "low" | "medium" | "high";
  ownerAgent: AgentSlug;
  nextStep: string;
  category: string;
  relevance: (ctx: { analytics: AnalyticsSummary; workflows: WorkflowSummary }) => number;
}

const CATALOG: RecTemplate[] = [
  {
    title: "Increase TikTok content volume",
    whyItMatters: "Plant content over-indexes on TikTok discovery. Volume + consistency compounds reach.",
    expectedImpact: "15–25% lift in top-of-funnel impressions within 30 days",
    effort: "medium",
    ownerAgent: "bloom",
    nextStep: "Brief Bloom on 5 TikTok scripts/week tied to top community questions.",
    category: "content",
    relevance: ({ analytics }) => (analytics.contentCreated.formats.tiktok ?? 0) < 2 ? 90 : 40,
  },
  {
    title: "Improve creator outreach response rate",
    whyItMatters: "Scout is surfacing leads but Oak conversion depends on fast, personalized outreach.",
    expectedImpact: "2–3 partnership conversations per month from existing lead pool",
    effort: "low",
    ownerAgent: "oak",
    nextStep: "Review top 3 Scout leads and draft outreach — human sends every message.",
    category: "partnerships",
    relevance: ({ analytics }) =>
      analytics.creatorLeads.found > 0 && analytics.partnershipUpdates.recommended < analytics.creatorLeads.found ? 95 : 35,
  },
  {
    title: "Launch Plant Rescue Challenge",
    whyItMatters: "Rescue content drives emotional engagement and positions PlantPal as the fix, not just ID.",
    expectedImpact: "High shareability; strong UGC loop potential",
    effort: "medium",
    ownerAgent: "scout",
    nextStep: "Scout identifies 3 creators for a 7-day rescue series — Oak negotiates, humans approve.",
    category: "campaigns",
    relevance: () => 70,
  },
  {
    title: "Build SEO landing pages for common plant problems",
    whyItMatters: "High-intent searches (yellow leaves, overwatering) convert better than generic app pages.",
    expectedImpact: "Organic install channel with compounding traffic",
    effort: "high",
    ownerAgent: "atlas",
    nextStep: "Atlas prioritizes top 10 Roots questions; Bloom drafts supporting content.",
    category: "seo",
    relevance: ({ analytics }) => (analytics.communityOpportunities.found > 0 ? 85 : 50),
  },
  {
    title: "Create ZIP-code gardening pages",
    whyItMatters: "Local intent captures seasonal planting windows — underserved in plant apps.",
    expectedImpact: "Long-tail organic traffic + local partnership hooks",
    effort: "high",
    ownerAgent: "fern",
    nextStep: "Fern models top metros; Atlas scopes MVP of 20 city pages.",
    category: "seo",
    relevance: () => 55,
  },
  {
    title: "Turn top community questions into content",
    whyItMatters: "Roots already found real questions — repurposing them reduces guesswork.",
    expectedImpact: "Higher relevance scores from Sage; better engagement",
    effort: "low",
    ownerAgent: "roots",
    nextStep: "Hand off top 3 community threads to Bloom as content briefs.",
    category: "content",
    relevance: ({ analytics }) => (analytics.communityOpportunities.found > 0 ? 92 : 30),
  },
  {
    title: "Add waitlist attribution tracking",
    whyItMatters: "Without source attribution, Fern and Atlas can't double down on winning channels.",
    expectedImpact: "Clear CAC by channel within 2 weeks of launch",
    effort: "medium",
    ownerAgent: "fern",
    nextStep: "Define UTM schema for every outbound link — engineering implements, humans approve.",
    category: "analytics",
    relevance: () => 75,
  },
  {
    title: "Add UTM links to every post",
    whyItMatters: "Sprout-scheduled posts need traceable links to close the content → install loop.",
    expectedImpact: "Per-post performance visibility",
    effort: "low",
    ownerAgent: "sprout",
    nextStep: "Gate checklist: every approved post includes UTM before Sprout queues.",
    category: "analytics",
    relevance: ({ analytics }) => (analytics.xSocial.publishQueue > 0 ? 80 : 60),
  },
  {
    title: "Add referral loop",
    whyItMatters: "Plant parents share wins — referral is the cheapest scale lever once core loop works.",
    expectedImpact: "10–20% of new installs from referrals at maturity",
    effort: "high",
    ownerAgent: "atlas",
    nextStep: "Atlas drafts referral MVP spec for founder review.",
    category: "growth",
    relevance: () => 65,
  },
  {
    title: "Add creator partnership codes",
    whyItMatters: "Tracks which creators actually drive installs — informs Scout scoring.",
    expectedImpact: "Data-driven creator ROI; better partnership prioritization",
    effort: "medium",
    ownerAgent: "oak",
    nextStep: "Oak proposes code structure for top 5 leads — no auto-contact.",
    category: "partnerships",
    relevance: ({ analytics }) => (analytics.creatorLeads.found > 0 ? 78 : 40),
  },
  {
    title: "Add content performance scoring",
    whyItMatters: "Bloom needs feedback loops to improve hooks, not just volume.",
    expectedImpact: "20% improvement in avg engagement on repeat formats",
    effort: "medium",
    ownerAgent: "sage",
    nextStep: "Sage scores published posts; Atlas correlates with installs.",
    category: "content",
    relevance: ({ analytics }) => (analytics.contentCreated.count > 3 ? 82 : 45),
  },
];

export function buildGrowthRecommendations(
  analytics: AnalyticsSummary,
  workflows: WorkflowSummary
): GrowthUpgradeRecommendation[] {
  return [...CATALOG]
    .sort((a, b) => b.relevance({ analytics, workflows }) - a.relevance({ analytics, workflows }))
    .slice(0, 8)
    .map(({ relevance: _r, ...rec }) => {
      void _r;
      return rec;
    });
}

export function buildRecommendedActions(
  analytics: AnalyticsSummary,
  workflows: WorkflowSummary,
  growthRecs: GrowthUpgradeRecommendation[]
): RecommendedAction[] {
  const actions: RecommendedAction[] = [];

  if (analytics.approvalQueue.pending > 0) {
    actions.push({
      title: `Clear ${analytics.approvalQueue.pending} pending approvals`,
      description: "Gate and Roots items are blocking downstream agents. Founder review required.",
      priority: "urgent",
      ownerAgent: "gate",
      requiresHumanApproval: true,
    });
  }

  for (const wf of workflows.blocked.slice(0, 2)) {
    actions.push({
      title: `Unblock: ${wf.workflowName}`,
      description: wf.recommendedFix,
      priority: "high",
      ownerAgent: wf.agentsInvolved[wf.agentsInvolved.length - 1] ?? "ivy",
      requiresHumanApproval: true,
    });
  }

  if (analytics.competitorAlerts.highSeverity > 0) {
    actions.push({
      title: "Review high-severity competitor alerts",
      description: `${analytics.competitorAlerts.highSeverity} alerts need Atlas response plan.`,
      priority: "high",
      ownerAgent: "atlas",
      requiresHumanApproval: true,
    });
  }

  for (const rec of growthRecs.slice(0, 3)) {
    actions.push({
      title: rec.title,
      description: rec.nextStep,
      priority: rec.effort === "low" ? "medium" : "high",
      ownerAgent: rec.ownerAgent,
      requiresHumanApproval: true,
    });
  }

  if (actions.length === 0) {
    actions.push({
      title: "Run agent pipeline",
      description: "No blockers detected. Trigger Scout, Roots, and Sentinel for fresh inputs.",
      priority: "medium",
      ownerAgent: "ivy",
      requiresHumanApproval: true,
    });
  }

  return actions;
}
