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
  createdAt: string;
}

export interface DailyReportRawData {
  since: string;
  until: string;
}
