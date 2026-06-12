/** Phase 40 — Notification Center types. */

export const NOTIFICATION_TYPES = [
  "founder_action",
  "agent_completed",
  "approval_needed",
  "revision_ready",
  "calendar_ready",
  "publish_ready",
  "video_ready",
  "asset_ready",
  "workflow_blocked",
  "api_failure",
  "storage_failure",
  "brand_voice_failed",
  "planty_suggestion",
  "f5bot_alert",
  "competitor_alert",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type NotificationFilter =
  | "all"
  | "founder_action"
  | "agent_updates"
  | "failures"
  | "calendar"
  | "content";

export interface NotificationRow {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  targetRoute: string;
  targetTable: string | null;
  targetId: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  readAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message?: string;
  targetRoute?: string;
  targetTable?: string;
  targetId?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  metadata?: Record<string, unknown>;
}
