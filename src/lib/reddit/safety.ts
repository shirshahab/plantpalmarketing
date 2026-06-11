import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";

/** Hard-coded fallbacks if reddit_safety_rules is missing — always conservative. */
const DEFAULT_RULES = {
  max_replies_per_day: 5,
  max_replies_per_subreddit_per_day: 1,
  allow_links: false,
  require_founder_approval: true,
  skip_no_promo_subreddits: true,
  must_answer_question: true,
  min_account_warmup_days: 7,
};

export interface RedditSafetyRules {
  maxRepliesPerDay: number;
  maxRepliesPerSubredditPerDay: number;
  allowLinks: boolean;
  requireFounderApproval: boolean;
  skipNoPromoSubreddits: boolean;
  mustAnswerQuestion: boolean;
  minAccountWarmupDays: number;
}

export async function getRedditSafetyRules(): Promise<RedditSafetyRules> {
  const rules = { ...DEFAULT_RULES };
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase.from("reddit_safety_rules").select("*").eq("enabled", true);
    if (error) {
      if (!isMissingTableError(error)) throw error;
      return mapRules(rules);
    }
    for (const row of data ?? []) {
      const key = row.rule_key as keyof typeof DEFAULT_RULES;
      if (!(key in rules)) continue;
      const v = row.rule_value.trim().toLowerCase();
      if (typeof rules[key] === "boolean") {
        (rules as Record<string, unknown>)[key] = v === "true";
      } else {
        const n = Number(v);
        if (Number.isFinite(n)) (rules as Record<string, unknown>)[key] = n;
      }
    }
  } catch {
    // fall back to conservative defaults
  }
  return mapRules(rules);
}

function mapRules(r: typeof DEFAULT_RULES): RedditSafetyRules {
  return {
    maxRepliesPerDay: r.max_replies_per_day,
    maxRepliesPerSubredditPerDay: r.max_replies_per_subreddit_per_day,
    allowLinks: r.allow_links,
    requireFounderApproval: r.require_founder_approval,
    skipNoPromoSubreddits: r.skip_no_promo_subreddits,
    mustAnswerQuestion: r.must_answer_question,
    minAccountWarmupDays: r.min_account_warmup_days,
  };
}

const PROMO_PHRASES = ["download our app", "check out our", "use code", "limited offer", "buy now", "sign up at"];

export interface SafetyCheckResult {
  allowed: boolean;
  reason?: string;
}

/** Server-side gate run immediately before any Reddit post. */
export async function checkReplySafety(input: {
  subreddit: string;
  replyText: string;
}): Promise<SafetyCheckResult> {
  const rules = await getRedditSafetyRules();
  const supabase = createServerClient();
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  // Daily caps from publish logs
  try {
    const [total, perSub] = await Promise.all([
      supabase
        .from("reddit_publish_logs")
        .select("id", { count: "exact", head: true })
        .eq("status", "success")
        .gte("created_at", dayStart.toISOString()),
      supabase
        .from("reddit_publish_logs")
        .select("id", { count: "exact", head: true })
        .eq("status", "success")
        .eq("subreddit", input.subreddit)
        .gte("created_at", dayStart.toISOString()),
    ]);
    if (!total.error && (total.count ?? 0) >= rules.maxRepliesPerDay) {
      return { allowed: false, reason: `Daily cap reached (${rules.maxRepliesPerDay} replies/day).` };
    }
    if (!perSub.error && (perSub.count ?? 0) >= rules.maxRepliesPerSubredditPerDay) {
      return {
        allowed: false,
        reason: `Subreddit cap reached (${rules.maxRepliesPerSubredditPerDay}/day in r/${input.subreddit}).`,
      };
    }
  } catch {
    // If logs are unavailable, stay conservative and still apply content checks
  }

  // Content checks
  const text = input.replyText.toLowerCase();
  if (!rules.allowLinks && /https?:\/\//.test(text)) {
    return { allowed: false, reason: "Links are not allowed in replies yet (safety rule)." };
  }
  const promo = PROMO_PHRASES.find((p) => text.includes(p));
  if (promo) {
    return { allowed: false, reason: `Reply sounds promotional ("${promo}"). Rewrite it help-first.` };
  }
  if (input.replyText.trim().length < 40) {
    return { allowed: false, reason: "Reply too short to be genuinely helpful." };
  }

  return { allowed: true };
}
