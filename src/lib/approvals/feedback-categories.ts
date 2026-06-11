export const FEEDBACK_CATEGORIES = [
  "approved as-is",
  "make more human",
  "make funnier",
  "too generic",
  "too salesy",
  "needs stronger hook",
  "needs clearer CTA",
  "wrong platform style",
  "off brand",
  "needs better visual",
  "fact check needed",
  "needs shorter caption",
  "needs stronger opening",
  "needs better thumbnail",
  "needs better video pacing",
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
