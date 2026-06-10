export const FEEDBACK_CATEGORIES = [
  "make more human",
  "make funnier",
  "too generic",
  "too salesy",
  "needs stronger hook",
  "needs clearer CTA",
  "off brand",
  "fact check needed",
  "wrong platform style",
  "needs better visual",
  "approved as-is",
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export type ApprovalDecision =
  | "approve"
  | "approve_with_note"
  | "reject"
  | "send_back_to_sage"
  | "send_back_to_bloom";

export interface ApprovalFeedbackInput {
  id: string;
  decision: ApprovalDecision;
  feedbackCategory?: string;
  note?: string;
}
