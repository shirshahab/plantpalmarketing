/**
 * Phase 39 — Unified Content Workflow types.
 */

export const WORKFLOW_STAGES = [
  "IDEA",
  "PENDING_FOUNDER_IDEA_APPROVAL",
  "IN_PRODUCTION",
  "PENDING_FOUNDER_ASSET_APPROVAL",
  "CALENDAR_READY",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
  "REJECTED",
] as const;

export type WorkflowStage = (typeof WORKFLOW_STAGES)[number];

export type WorkflowBadge =
  | "Waiting Founder"
  | "In Production"
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
}

export interface ContentWorkflowRow {
  id: string;
  sourceTable: string;
  sourceId: string;
  contentType: string;
  title: string;
  currentStage: WorkflowStage;
  assignedAgent: string;
  nextAgent: string;
  nextAction: string;
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
  CALENDAR_READY: "Calendar Ready",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
  ARCHIVED: "Rejected",
  REJECTED: "Rejected",
};

export const BADGE_VARIANT: Record<
  WorkflowBadge,
  "success" | "warning" | "danger" | "info" | "muted"
> = {
  "Waiting Founder": "warning",
  "In Production": "info",
  "Calendar Ready": "success",
  Scheduled: "success",
  Published: "success",
  Rejected: "danger",
};

/** Default agent routing per stage. */
export const STAGE_ROUTING: Record<
  WorkflowStage,
  { assigned: string; next: string; action: string }
> = {
  IDEA: { assigned: "scout", next: "bloom", action: "Develop content idea" },
  PENDING_FOUNDER_IDEA_APPROVAL: { assigned: "gate", next: "bloom", action: "Founder approves or rejects idea" },
  IN_PRODUCTION: { assigned: "fern", next: "gate", action: "Produce asset (image or video)" },
  PENDING_FOUNDER_ASSET_APPROVAL: { assigned: "gate", next: "atlas", action: "Founder approves asset" },
  CALENDAR_READY: { assigned: "atlas", next: "sprout", action: "Schedule publish slot" },
  SCHEDULED: { assigned: "sprout", next: "sprout", action: "Publish at scheduled time" },
  PUBLISHED: { assigned: "sprout", next: "", action: "Monitor performance" },
  ARCHIVED: { assigned: "", next: "", action: "Archived" },
  REJECTED: { assigned: "", next: "", action: "Campaign killed" },
};

export type InboxSection =
  | "ideas"
  | "images"
  | "videos"
  | "replies"
  | "calendar";

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
