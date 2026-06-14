/**
 * Phase 39/40 — Unified Content Workflow types.
 */

export const WORKFLOW_STAGES = [
  "IDEA",
  "PENDING_FOUNDER_IDEA_APPROVAL",
  "IN_PRODUCTION",
  "PENDING_FOUNDER_ASSET_APPROVAL",
  "PENDING_FOUNDER_REPLY_APPROVAL",
  "REVISION_REQUESTED",
  "WITH_AGENT",
  "CALENDAR_READY",
  "SCHEDULED",
  "PUBLISHED",
  "KILLED",
  "ARCHIVED",
  "REJECTED",
] as const;

export type WorkflowStage = (typeof WORKFLOW_STAGES)[number];

export type WorkflowBadge =
  | "Waiting Founder"
  | "In Production"
  | "With Agent"
  | "Needs Revision"
  | "Calendar Ready"
  | "Scheduled"
  | "Published"
  | "Rejected";

export interface WorkflowHistoryEntry {
  at: string;
  stage: WorkflowStage;
  event: string;
  actor: string;
  agent?: string;
  note?: string;
  destination?: string;
}

export interface ContentWorkflowRow {
  id: string;
  sourceTable: string;
  sourceId: string;
  contentType: string;
  title: string;
  currentStage: WorkflowStage;
  currentOwner: string;
  assignedAgent: string;
  nextAgent: string;
  nextAction: string;
  destinationLabel: string;
  founderActionRequired: boolean;
  lastTransitionAt: string;
  historyLog: WorkflowHistoryEntry[];
  calendarItemId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** Maps internal stages to founder-facing badge labels. */
export const STAGE_BADGE: Record<WorkflowStage, WorkflowBadge> = {
  IDEA: "In Production",
  PENDING_FOUNDER_IDEA_APPROVAL: "Waiting Founder",
  IN_PRODUCTION: "In Production",
  PENDING_FOUNDER_ASSET_APPROVAL: "Waiting Founder",
  PENDING_FOUNDER_REPLY_APPROVAL: "Waiting Founder",
  REVISION_REQUESTED: "Needs Revision",
  WITH_AGENT: "With Agent",
  CALENDAR_READY: "Calendar Ready",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
  KILLED: "Rejected",
  ARCHIVED: "Rejected",
  REJECTED: "Rejected",
};

export const BADGE_VARIANT: Record<
  WorkflowBadge,
  "success" | "warning" | "danger" | "info" | "muted"
> = {
  "Waiting Founder": "warning",
  "In Production": "info",
  "With Agent": "info",
  "Needs Revision": "warning",
  "Calendar Ready": "success",
  Scheduled: "success",
  Published: "success",
  Rejected: "danger",
};

/** Default agent routing per stage. */
export const STAGE_ROUTING: Record<
  WorkflowStage,
  { assigned: string; next: string; action: string; owner: string; founderAction: boolean }
> = {
  IDEA: { assigned: "scout", next: "bloom", action: "Develop content idea", owner: "scout", founderAction: false },
  PENDING_FOUNDER_IDEA_APPROVAL: { assigned: "gate", next: "bloom", action: "Founder approves or rejects idea", owner: "founder", founderAction: true },
  IN_PRODUCTION: { assigned: "fern", next: "moss", action: "Produce asset (image or video)", owner: "fern", founderAction: false },
  PENDING_FOUNDER_ASSET_APPROVAL: { assigned: "gate", next: "atlas", action: "Founder approves asset", owner: "founder", founderAction: true },
  PENDING_FOUNDER_REPLY_APPROVAL: { assigned: "gate", next: "sprout", action: "Founder approves reply", owner: "founder", founderAction: true },
  REVISION_REQUESTED: { assigned: "bloom", next: "moss", action: "Revise based on founder feedback", owner: "bloom", founderAction: false },
  WITH_AGENT: { assigned: "moss", next: "gate", action: "Agent working on revision", owner: "moss", founderAction: false },
  CALENDAR_READY: { assigned: "atlas", next: "sprout", action: "Schedule publish slot", owner: "atlas", founderAction: false },
  SCHEDULED: { assigned: "sprout", next: "sprout", action: "Publish at scheduled time", owner: "sprout", founderAction: false },
  PUBLISHED: { assigned: "sprout", next: "", action: "Monitor performance", owner: "sprout", founderAction: false },
  KILLED: { assigned: "", next: "", action: "Campaign killed", owner: "", founderAction: false },
  ARCHIVED: { assigned: "", next: "", action: "Archived", owner: "", founderAction: false },
  REJECTED: { assigned: "", next: "", action: "Campaign killed", owner: "", founderAction: false },
};

export type InboxSection =
  | "ideas"
  | "images"
  | "videos"
  | "replies"
  | "calendar"
  | "intelligence"
  | "seo"
  | "creators";

export type InboxTab =
  | "all"
  | "replies"
  | "ideas"
  | "videos"
  | "images"
  | "seo"
  | "creators"
  | "intelligence";

export interface InboxItem {
  id: string;
  section: InboxSection;
  sourceTable: string;
  sourceId: string;
  title: string;
  summary: string;
  stage: WorkflowStage;
  badge: WorkflowBadge;
  href: string;
  channel?: string;
  createdAt: string;
  currentOwner?: string;
  nextOwner?: string;
  whyAct?: string;
  ifApproved?: string;
  ifRejected?: string;
  sourceUrl?: string;
  sourceBody?: string;
  sourcePlatform?: string;
  subreddit?: string;
  recommendedAction?: string;
  matchedKeywords?: string[];
  priority?: string;
  classification?: string;
  nextAction?: string;
}

export interface FounderAttentionItem {
  id: string;
  title: string;
  type: string;
  priority: string;
  owner: string;
  nextAction: string;
  href: string;
  section: InboxSection;
}

/** Asset/video statuses that belong in Creative Department (production + review). */
export const CREATIVE_DEPARTMENT_ASSET_STATUSES = new Set([
  "pending_generation",
  "package_ready",
  "generating",
  "generated",
  "generated_not_uploaded",
  "needs_revision",
]);

export function isInCreativeDepartment(status: string, calendarItemId?: string | null): boolean {
  if (calendarItemId) return false;
  return CREATIVE_DEPARTMENT_ASSET_STATUSES.has(status);
}

export function stageRequiresFounder(stage: WorkflowStage): boolean {
  return STAGE_ROUTING[stage]?.founderAction ?? false;
}
