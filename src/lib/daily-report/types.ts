import type { AgentSlug, CollaborationPriority } from "@/lib/types";

export interface AgentProductivityEntry {
  agentId: AgentSlug;
  name: string;
  role: string;
  tasksCompleted: number;
  tasksCreated: number;
  messagesSent: number;
  eventsTriggered: number;
  outputsGenerated: number;
  blockers: string[];
  productivityScore: number;
  connected: boolean;
}

export interface WorkflowRunEntry {
  workflowName: string;
  agentsInvolved: AgentSlug[];
  status: "completed" | "active" | "blocked" | "idle";
  itemsMoved: number;
  bottleneck: string;
  recommendedFix: string;
}

export interface WorkflowSummary {
  completed: WorkflowRunEntry[];
  active: WorkflowRunEntry[];
  blocked: WorkflowRunEntry[];
  all: WorkflowRunEntry[];
}

export interface AnalyticsSection {
  label: string;
  value: number | string;
  detail?: string;
  connected: boolean;
}

export interface AnalyticsSummary {
  periodLabel: string;
  sections: {
    approvalQueue: AnalyticsSection;
    contentCreated: AnalyticsSection;
    creatorLeads: AnalyticsSection;
    communityOpportunities: AnalyticsSection;
    competitorAlerts: AnalyticsSection;
    partnershipUpdates: AnalyticsSection;
    xPosts: AnalyticsSection;
    xQueue: AnalyticsSection;
    agentTasks: AnalyticsSection;
    agentMessages: AnalyticsSection;
    agentEvents: AnalyticsSection;
    contentCalendar?: AnalyticsSection;
    agentRuns?: AnalyticsSection;
    hqWorkflowEvents?: AnalyticsSection;
    integrationCalls?: AnalyticsSection;
    providerHealth?: AnalyticsSection;
  };
  approvalQueue: {
    pending: number;
    approved: number;
    rejected: number;
    connected: boolean;
  };
  contentCreated: { count: number; formats: Record<string, number>; connected: boolean };
  creatorLeads: { found: number; highPriority: number; connected: boolean };
  communityOpportunities: { found: number; pendingReplies: number; connected: boolean };
  competitorAlerts: { active: number; highSeverity: number; connected: boolean };
  partnershipUpdates: { recommended: number; active: number; connected: boolean };
  xSocial: {
    followerCount: number;
    engagement24h: number;
    drafts: number;
    gateQueue: number;
    publishQueue: number;
    connected: boolean;
  };
}

export interface ProviderUsageEntry {
  provider: string;
  totalCalls: number;
  successful: number;
  failed: number;
  rateLimitWarnings: number;
  lastSuccessAt: string | null;
  lastErrorAt?: string | null;
  lastErrorMessage?: string;
  connected: boolean;
}

/** Phase 28 — click targets that turn brief items into a control panel. */
export interface BriefTarget {
  targetRoute?: string;
  targetTable?: string;
  targetId?: string;
  targetFilter?: string;
  targetLabel?: string;
}

export interface ExecutiveSummaryStructured {
  whatHappened: string;
  biggestWin: string;
  biggestRisk: string;
  needsAttention: (string | ({ text: string } & BriefTarget))[];
  aiError: string | null;
}

export interface ContentReport {
  created: number;
  approved: number;
  rejected: number;
  scheduled: number;
  missingAssets: number;
  readyToPublish: number;
  topOpportunities: string[];
  connected: boolean;
}

export interface GrowthReport {
  creatorLeads: number;
  highPriorityLeads: number;
  partnershipOpportunities: number;
  communityOpportunities: number;
  competitorAlerts: number;
  highSeverityAlerts: number;
  recommendedMoves: string[];
  connected: boolean;
}

export type ActionCategory = "urgent" | "growth" | "content" | "system";

export interface ActionItemEntry extends BriefTarget {
  title: string;
  ownerAgent: AgentSlug;
  priority: CollaborationPriority;
  impactScore: number;
  nextStep: string;
  category: ActionCategory;
}

export interface ActionPlan {
  urgent: ActionItemEntry[];
  growth: ActionItemEntry[];
  content: ActionItemEntry[];
  system: ActionItemEntry[];
}

export interface FounderReviewItem extends BriefTarget {
  label: string;
  detail: string;
  kind: "approval" | "publish" | "outreach" | "high_risk";
}

export interface FounderReview {
  needingApproval: number;
  readyToPublish: number;
  outreachAwaiting: number;
  highRisk: number;
  items: FounderReviewItem[];
  connected: boolean;
}

export interface ApiUsageSummary {
  providers: ProviderUsageEntry[];
  totalSuccessful: number;
  totalFailed: number;
  totalRateLimitWarnings: number;
  costEstimatePlaceholder: string;
  connected: boolean;
}

export interface GrowthUpgradeRecommendation {
  title: string;
  whyItMatters: string;
  expectedImpact: string;
  effort: "low" | "medium" | "high";
  ownerAgent: AgentSlug;
  nextStep: string;
  category: string;
}

export interface RecommendedAction {
  title: string;
  description: string;
  priority: CollaborationPriority;
  ownerAgent: AgentSlug;
  requiresHumanApproval: boolean;
}

export interface GrowthActionItem {
  id: string;
  title: string;
  description: string;
  priority: CollaborationPriority;
  impactScore: number;
  effortScore: number;
  ownerAgent: AgentSlug;
  status: "recommended" | "approved" | "in_progress" | "completed" | "dismissed";
  dueDate: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface DailyReport {
  id: string;
  reportDate: string;
  summary: string;
  agentProductivity: AgentProductivityEntry[];
  workflowSummary: WorkflowSummary;
  analyticsSummary: AnalyticsSummary;
  apiUsageSummary: ApiUsageSummary;
  growthRecommendations: GrowthUpgradeRecommendation[];
  recommendedActions: RecommendedAction[];
  // Phase 27 structured sections (optional — older saved reports won't have them)
  executiveSummary?: ExecutiveSummaryStructured | null;
  contentReport?: ContentReport | null;
  growthReport?: GrowthReport | null;
  actionPlan?: ActionPlan | null;
  founderReview?: FounderReview | null;
  createdAt: string;
}

export interface DailyReportRawData {
  since: string;
  until: string;
}
