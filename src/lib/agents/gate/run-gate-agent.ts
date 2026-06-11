import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";

export interface GateRunResult {
  itemsRiskScored: number;
  pendingApprovals: number;
}

const HIGH_RISK_SIGNALS = [
  "http://",
  "https://",
  "discount",
  "promo code",
  "buy now",
  "click here",
  "free download",
];

function scoreRisk(text: string): number {
  const lower = text.toLowerCase();
  let score = 10;
  for (const signal of HIGH_RISK_SIGNALS) {
    if (lower.includes(signal)) score += 25;
  }
  if (text.length > 1200) score += 10;
  return Math.min(100, score);
}

/**
 * Phase 31 — Gate runs event-driven. Risk-scores any Reddit reply drafts that
 * haven't been scored yet and counts the founder's pending approval backlog.
 */
export async function runGateAgent(): Promise<GateRunResult> {
  const supabase = createServerClient();
  const result: GateRunResult = { itemsRiskScored: 0, pendingApprovals: 0 };

  // 1. Risk-score unscored Reddit drafts
  try {
    const { data: drafts, error } = await supabase
      .from("reddit_reply_drafts")
      .select("id, draft_reply, risk_score")
      .in("status", ["draft", "pending_approval"])
      .eq("risk_score", 0)
      .limit(25);
    if (!error) {
      for (const draft of drafts ?? []) {
        await supabase
          .from("reddit_reply_drafts")
          .update({ risk_score: scoreRisk(draft.draft_reply) })
          .eq("id", draft.id);
        result.itemsRiskScored += 1;
      }
    }
  } catch {
    // reddit tables optional
  }

  // 2. Count the approval backlog
  try {
    const { count, error } = await supabase
      .from("approval_queue")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    if (error && !isMissingTableError(error)) throw new Error(error.message);
    result.pendingApprovals = count ?? 0;
  } catch {
    // optional
  }

  return result;
}

export async function gateHasPendingWork(): Promise<boolean> {
  const supabase = createServerClient();
  try {
    const [approvals, drafts] = await Promise.all([
      supabase.from("approval_queue").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase
        .from("reddit_reply_drafts")
        .select("*", { count: "exact", head: true })
        .in("status", ["draft", "pending_approval"])
        .eq("risk_score", 0),
    ]);
    return (approvals.count ?? 0) > 0 || (drafts.count ?? 0) > 0;
  } catch {
    return false;
  }
}
