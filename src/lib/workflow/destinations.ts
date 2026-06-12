/**
 * Phase 40 — Where did this item go? Every approval/rejection gets a destination.
 */

import type { WorkflowStage } from "@/lib/workflow/types";

export interface WorkflowDestination {
  action: string;
  destination: string;
  nextOwner: string;
  nextStep: string;
  stage: WorkflowStage;
  founderActionRequired: boolean;
  toast: string;
  strip: string;
}

export function destinationForImageApprove(): WorkflowDestination {
  return {
    action: "Approved image",
    destination: "Calendar",
    nextOwner: "Atlas",
    nextStep: "Schedule publish slot",
    stage: "CALENDAR_READY",
    founderActionRequired: false,
    toast: "Approved. Moved to Calendar. Ready to schedule.",
    strip: "Moved to Calendar",
  };
}

export function destinationForVideoApprove(): WorkflowDestination {
  return destinationForImageApprove();
}

export function destinationForIdeaApprove(): WorkflowDestination {
  return {
    action: "Approved idea",
    destination: "Bloom",
    nextOwner: "Bloom",
    nextStep: "Build content package",
    stage: "IN_PRODUCTION",
    founderActionRequired: false,
    toast: "Approved. Sent to Bloom for content package.",
    strip: "Sent to Bloom",
  };
}

export function destinationForReplyApprove(platform?: string): WorkflowDestination {
  const apiReady = platform === "x" || platform === "reddit";
  return {
    action: "Approved reply",
    destination: apiReady ? "Publish Ready" : "Reply Queue",
    nextOwner: "Sprout",
    nextStep: apiReady ? "Final publish click" : "Copy/paste package ready",
    stage: "CALENDAR_READY",
    founderActionRequired: false,
    toast: apiReady
      ? "Approved. Ready for final publish click."
      : "Approved. Moved to Reply Queue. Open original post to publish manually.",
    strip: "Moved to Reply Queue",
  };
}

export function destinationForReject(agent: string, itemType: string): WorkflowDestination {
  return {
    action: `Sent back ${itemType}`,
    destination: agent,
    nextOwner: agent,
    nextStep: "Revise and resubmit",
    stage: "REVISION_REQUESTED",
    founderActionRequired: false,
    toast: `Sent back to ${agent} with your feedback.`,
    strip: `Waiting on ${agent.charAt(0).toUpperCase()}${agent.slice(1)}`,
  };
}

export function destinationForKill(): WorkflowDestination {
  return {
    action: "Killed campaign",
    destination: "Archive",
    nextOwner: "",
    nextStep: "Archived",
    stage: "KILLED",
    founderActionRequired: false,
    toast: "Campaign killed. Archived.",
    strip: "Archived",
  };
}

export function destinationForCalendarSchedule(dateLabel: string): WorkflowDestination {
  return {
    action: "Rescheduled",
    destination: "Calendar",
    nextOwner: "Sprout",
    nextStep: "Publish at scheduled time",
    stage: "SCHEDULED",
    founderActionRequired: false,
    toast: `Moved to ${dateLabel}.`,
    strip: `Scheduled for ${dateLabel}`,
  };
}

/** Inbox helper — what happens if founder approves or rejects. */
export function inboxOutcome(
  section: string,
  decision: "approve" | "reject"
): { label: string; detail: string } {
  const map: Record<string, { approve: { label: string; detail: string }; reject: { label: string; detail: string } }> = {
    ideas: {
      approve: { label: "If approved", detail: "Goes to Bloom for content package" },
      reject: { label: "If rejected", detail: "Goes back to Atlas for refinement" },
    },
    images: {
      approve: { label: "If approved", detail: "Moves to Calendar" },
      reject: { label: "If rejected", detail: "Back to Fern" },
    },
    videos: {
      approve: { label: "If approved", detail: "Moves to Calendar" },
      reject: { label: "If rejected", detail: "Back to Fern" },
    },
    replies: {
      approve: { label: "If approved", detail: "Ready for manual post or final click post" },
      reject: { label: "If rejected", detail: "Back to Sage" },
    },
    calendar: {
      approve: { label: "If scheduled", detail: "Sprout publishes at slot" },
      reject: { label: "If rejected", detail: "Sent back for revision" },
    },
    intelligence: {
      approve: { label: "Draft reply", detail: "Roots drafts reply → Moss → Sage → Gate → Reply Queue" },
      reject: { label: "If ignored", detail: "Alert archived — no action taken" },
    },
  };
  return map[section]?.[decision] ?? { label: decision === "approve" ? "If approved" : "If rejected", detail: "See workflow history" };
}
