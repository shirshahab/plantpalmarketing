export const FEEDBACK_CATEGORIES = [
  "approved as-is",
  "make more human",
  "make funnier",
  "too generic",
  "too salesy",
  "wrong tone",
  "wrong platform style",
  "too long",
  "too short",
  "needs stronger hook",
  "needs clearer CTA",
  "off brand",
  "fact check needed",
  "needs better visual",
  "needs better video pacing",
  "needs source check",
  "needs shorter caption",
  "needs stronger opening",
  "needs better thumbnail",
  "other",
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export type ApprovalDecision =
  | "approve"
  | "approve_with_note"
  | "reject"
  | "send_back_to_sage"
  | "send_back_to_bloom"
  | "send_back_to_fern";

export interface ApprovalFeedbackInput {
  id: string;
  decision: ApprovalDecision;
  feedbackCategory?: string;
  note?: string;
}
