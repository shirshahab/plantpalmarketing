/**
 * Phase 40 — Moss, Brand Guardian.
 * Every caption passes Moss before founder review.
 */

import {
  runVoiceCheck,
  VOICE_FAIL_REASON,
  VOICE_PASS_THRESHOLD,
  type VoiceCheckResult,
} from "@/lib/brand/voice-check";
import { createNotification } from "@/lib/notifications/create";
import { recordHandoff } from "@/lib/collaboration/handoff";
import type { AgentSlug } from "@/lib/types";

export const MOSS_AGENT_ID = "moss" as const;
export const MOSS_AUTO_REJECT_THRESHOLD = 6;
export const MOSS_REVISE_THRESHOLD = 7;

export interface MossReviewResult extends VoiceCheckResult {
  reviewedBy: "moss";
  sentBackTo?: AgentSlug;
  plantyApproved?: boolean;
}

export interface MossReviewInput {
  text: string;
  contentType: string;
  sourceTable: string;
  sourceId: string;
  producingAgent: AgentSlug;
  usesPlanty?: boolean;
}

/** Moss scores content 1-10. Below 8 never reaches founder. */
export function mossReviewCaption(text: string): MossReviewResult {
  const result = runVoiceCheck(text);
  return { ...result, reviewedBy: "moss" };
}

/** Full Moss gate — score, notify, hand back on failure. */
export async function mossGateContent(input: MossReviewInput): Promise<MossReviewResult> {
  const result = mossReviewCaption(input.text);

  if (!result.passed) {
    await createNotification({
      type: "brand_voice_failed",
      title: `Moss rejected: ${input.contentType}`,
      message: `${VOICE_FAIL_REASON} (score ${result.score}/10). Sent back to ${input.producingAgent}.`,
      targetRoute: mossTargetRoute(input.sourceTable, input.sourceId),
      targetTable: input.sourceTable,
      targetId: input.sourceId,
      priority: "high",
      metadata: { score: result.score, violations: result.violations, agent: input.producingAgent },
    });

    await recordHandoff({
      fromAgent: MOSS_AGENT_ID,
      toAgent: input.producingAgent,
      workflowName: `Moss → ${input.producingAgent}`,
      triggerType: "brand_voice_rejection",
      triggerId: input.sourceId,
      taskType: "content_revision",
      taskDescription: `Moss rejected (${result.score}/10): ${result.violations.slice(0, 3).join("; ") || VOICE_FAIL_REASON}`,
      priority: "high",
      messageTitle: `Moss voice check failed (${result.score}/10)`,
      messageBody: result.violations.join("\n") || VOICE_FAIL_REASON,
      activityDetail: `Moss sent content back to ${input.producingAgent} — score ${result.score}`,
    }).catch(() => undefined);
  }

  return result;
}

export function mossTargetRoute(sourceTable: string, sourceId: string): string {
  switch (sourceTable) {
    case "generated_assets":
      return `/images?asset=${sourceId}`;
    case "generated_videos":
      return `/video?video=${sourceId}`;
    case "creative_content_ideas":
      return `/content?highlight=${sourceId}`;
    case "approval_queue":
      return `/approvals?item=${sourceId}`;
    case "community_reply_drafts":
      return `/replies?draft=${sourceId}`;
    case "reddit_reply_drafts":
      return `/reddit?draft=${sourceId}`;
    default:
      return "/inbox";
  }
}

export function mossPassesForFounder(score: number): boolean {
  return score >= VOICE_PASS_THRESHOLD;
}
