import { Badge } from "@/components/ui/badge";
import { BADGE_VARIANT, STAGE_BADGE, type WorkflowStage } from "@/lib/workflow/types";

/** Phase 39/40 — unified workflow status badge visible everywhere. */
export function WorkflowStageBadge({ stage }: { stage: WorkflowStage | string }) {
  const s = stage as WorkflowStage;
  const label = STAGE_BADGE[s] ?? "In Production";
  const variant = BADGE_VARIANT[label] ?? "muted";
  return <Badge variant={variant}>{label}</Badge>;
}

/** Convenience: map legacy table statuses to workflow stages for display. */
export function legacyStatusToStage(status: string): WorkflowStage {
  switch (status) {
    case "pending":
    case "awaiting_review":
      return "PENDING_FOUNDER_IDEA_APPROVAL";
    case "generating":
    case "pending_generation":
    case "package_ready":
      return "IN_PRODUCTION";
    case "needs_revision":
      return "REVISION_REQUESTED";
    case "generated":
    case "generated_not_uploaded":
      return "PENDING_FOUNDER_ASSET_APPROVAL";
    case "approved":
      return "CALENDAR_READY";
    case "scheduled":
      return "SCHEDULED";
    case "published":
      return "PUBLISHED";
    case "rejected":
    case "killed":
      return "KILLED";
    default:
      return "IN_PRODUCTION";
  }
}

export function LegacyWorkflowBadge({ status }: { status: string }) {
  return <WorkflowStageBadge stage={legacyStatusToStage(status)} />;
}
