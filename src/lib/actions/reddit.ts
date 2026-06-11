"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import {
  checkRedditConnection,
  fetchSubredditPosts,
  isRedditConfigured,
  postRedditComment,
} from "@/lib/reddit/client";
import { checkReplySafety } from "@/lib/reddit/safety";
import { recordHandoff } from "@/lib/collaboration/handoff";

type Result = { ok: true; message?: string } | { ok: false; error: string };

const MIGRATION_HINT =
  "Reddit tables not found — run supabase/migrations/049_phase29_reddit_automation.sql";

const QUESTION_HINTS = ["?", "help", "why", "how", "what", "dying", "yellow", "brown", "advice", "problem", "wrong"];

async function logRedditAction(row: Record<string, unknown>) {
  try {
    const supabase = createServerClient();
    await supabase.from("reddit_publish_logs").insert(row as never);
  } catch {
    // non-blocking
  }
}

/** Step 1 — read-only connection check. Test this first. */
export async function checkRedditAccountConnection(): Promise<Result> {
  if (!isRedditConfigured()) {
    return { ok: false, error: "Reddit credentials not set. Add REDDIT_* env vars in Vercel and redeploy." };
  }
  const info = await checkRedditConnection();
  const supabase = createServerClient();
  try {
    const { data: account } = await supabase.from("reddit_accounts").select("id").limit(1).maybeSingle();
    const update: {
      username?: string;
      status?: string;
      karma?: number;
      account_age_days?: number;
      rate_limit_remaining?: number;
      last_checked_at?: string;
      notes?: string;
    } = info.ok
      ? {
          username: info.username ?? "",
          status: "connected",
          karma: info.karma ?? 0,
          account_age_days: info.accountAgeDays ?? 0,
          rate_limit_remaining: info.rateLimitRemaining ?? 0,
          last_checked_at: new Date().toISOString(),
        }
      : { status: "error", notes: info.error ?? "Connection failed", last_checked_at: new Date().toISOString() };
    if (account) {
      await supabase.from("reddit_accounts").update(update).eq("id", account.id);
    } else {
      await supabase.from("reddit_accounts").insert(update);
    }
  } catch (e) {
    if (isMissingTableError(e as { message?: string })) return { ok: false, error: MIGRATION_HINT };
  }

  revalidatePath("/reddit");
  return info.ok
    ? { ok: true, message: `Connected as u/${info.username} (${info.karma} karma)` }
    : { ok: false, error: info.error ?? "Connection failed" };
}

/** Step 2 — read-only scan of monitored subreddits for plant questions. */
export async function scanRedditOpportunities(): Promise<Result> {
  if (!isRedditConfigured()) {
    return { ok: false, error: "Reddit credentials not set — read-only scan requires REDDIT_* env vars." };
  }
  try {
    const supabase = createServerClient();
    const { data: account, error: accountError } = await supabase
      .from("reddit_accounts")
      .select("monitored_subreddits")
      .limit(1)
      .maybeSingle();
    if (accountError && isMissingTableError(accountError)) return { ok: false, error: MIGRATION_HINT };

    const subreddits = (account?.monitored_subreddits ?? ["houseplants", "plantclinic"]).slice(0, 3);
    let found = 0;

    for (const subreddit of subreddits) {
      const result = await fetchSubredditPosts(subreddit, 10);
      if (!result.ok) continue;

      for (const post of result.posts) {
        const text = `${post.title} ${post.selftext}`.toLowerCase();
        const isQuestion = QUESTION_HINTS.some((h) => text.includes(h));
        if (!isQuestion) continue;

        await supabase
          .from("reddit_opportunities")
          .upsert(
            {
              subreddit: post.subreddit,
              post_id: post.postId,
              permalink: post.permalink,
              author: post.author,
              title: post.title,
              question: post.selftext || post.title,
              risk_score: post.numComments > 20 ? 60 : 30,
              status: "found",
            },
            { onConflict: "post_id", ignoreDuplicates: true }
          );
        found++;
      }
    }

    await logRedditAction({ action: "scan", status: "success", metadata: { subreddits, found } });
    revalidatePath("/reddit");
    return { ok: true, message: `Scan complete — ${found} question posts recorded.` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Scan failed" };
  }
}

/** Step 3 — draft a help-first reply for an opportunity (no posting). */
export async function draftRedditReply(opportunityId: string): Promise<Result> {
  try {
    const supabase = createServerClient();
    const { data: opp, error: oppError } = await supabase
      .from("reddit_opportunities")
      .select("*")
      .eq("id", opportunityId)
      .maybeSingle();
    if (oppError || !opp) {
      return { ok: false, error: oppError && isMissingTableError(oppError) ? MIGRATION_HINT : (oppError?.message ?? "Opportunity not found") };
    }

    // Help-first template — Bloom/Sage refine via the normal content pipeline
    const draft = [
      `Sounds frustrating — a few things usually cause this:`,
      ``,
      `1. Check the soil moisture 2 inches down before watering (most yellowing comes from overwatering, not underwatering).`,
      `2. Make sure the pot drains — roots sitting in water suffocate.`,
      `3. Look at the newest leaves vs oldest: old-leaf yellowing is often normal aging.`,
      ``,
      `If you can describe the light it gets and how often you water, happy to narrow it down further.`,
    ].join("\n");

    const { error } = await supabase.from("reddit_reply_drafts").insert({
      opportunity_id: opp.id,
      subreddit: opp.subreddit,
      post_id: opp.post_id,
      permalink: opp.permalink,
      author: opp.author,
      question: opp.question,
      draft_reply: draft,
      status: "pending_approval",
      risk_score: opp.risk_score,
    });
    if (error) return { ok: false, error: isMissingTableError(error) ? MIGRATION_HINT : error.message };

    await supabase.from("reddit_opportunities").update({ status: "drafted" }).eq("id", opp.id);

    await recordHandoff({
      fromAgent: "roots",
      toAgent: "gate",
      workflowName: "Roots → Gate",
      triggerType: "reddit_reply_draft",
      triggerId: opp.id,
      taskType: "reddit_reply_review",
      taskDescription: `Review Reddit reply draft for r/${opp.subreddit}: "${opp.title.slice(0, 80)}"`,
      priority: "high",
      messageTitle: `Reddit reply needs founder approval — r/${opp.subreddit}`,
      messageBody: `Question: ${opp.question.slice(0, 300)}\n\nDraft:\n${draft}`,
      activityDetail: `Roots drafted a Reddit reply for r/${opp.subreddit} — awaiting founder approval`,
    });

    revalidatePath("/reddit");
    return { ok: true, message: "Draft created — awaiting founder approval." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Draft failed" };
  }
}

/** Founder edits/approves the reply text without posting. */
export async function updateRedditDraft(draftId: string, replyText: string): Promise<Result> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("reddit_reply_drafts")
      .update({ draft_reply: replyText })
      .eq("id", draftId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/reddit");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Update failed" };
  }
}

export async function rejectRedditDraft(draftId: string, reason: string): Promise<Result> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("reddit_reply_drafts")
      .update({ status: "rejected", review_feedback: reason || "Rejected by founder" })
      .eq("id", draftId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/reddit");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Reject failed" };
  }
}

/**
 * Step 4 — founder-approved posting. Runs every safety rule server-side
 * immediately before the API call. This is the ONLY path that posts to Reddit.
 */
export async function approveAndPostRedditReply(draftId: string): Promise<Result> {
  try {
    const supabase = createServerClient();
    const { data: draft, error: draftError } = await supabase
      .from("reddit_reply_drafts")
      .select("*")
      .eq("id", draftId)
      .maybeSingle();
    if (draftError || !draft) return { ok: false, error: draftError?.message ?? "Draft not found" };
    if (draft.status === "posted") return { ok: false, error: "Already posted." };

    if (!isRedditConfigured()) {
      return { ok: false, error: "Reddit credentials not set — cannot post. Add REDDIT_* env vars." };
    }
    if (!draft.post_id) {
      return { ok: false, error: "Draft has no Reddit post id — re-scan opportunities first." };
    }

    const safety = await checkReplySafety({ subreddit: draft.subreddit, replyText: draft.draft_reply });
    if (!safety.allowed) {
      await logRedditAction({
        draft_id: draft.id,
        subreddit: draft.subreddit,
        action: "post_reply",
        status: "blocked",
        error_message: safety.reason ?? "Blocked by safety rules",
      });
      return { ok: false, error: `Blocked by safety rules: ${safety.reason}` };
    }

    const result = await postRedditComment(draft.post_id, draft.draft_reply);
    if (!result.ok) {
      await supabase
        .from("reddit_reply_drafts")
        .update({ status: "failed", error_message: result.error ?? "Post failed" })
        .eq("id", draft.id);
      await logRedditAction({
        draft_id: draft.id,
        subreddit: draft.subreddit,
        action: "post_reply",
        status: "failed",
        error_message: result.error ?? "",
        rate_limit_remaining: result.rateLimitRemaining ?? null,
      });
      revalidatePath("/reddit");
      return { ok: false, error: result.error ?? "Post failed" };
    }

    await supabase
      .from("reddit_reply_drafts")
      .update({
        status: "posted",
        approved_reply: draft.draft_reply,
        comment_id: result.commentId ?? "",
        posted_at: new Date().toISOString(),
        published_url: result.permalink ?? "",
      })
      .eq("id", draft.id);
    if (draft.opportunity_id) {
      await supabase.from("reddit_opportunities").update({ status: "answered" }).eq("id", draft.opportunity_id);
    }
    await logRedditAction({
      draft_id: draft.id,
      subreddit: draft.subreddit,
      post_id: draft.post_id,
      comment_id: result.commentId ?? "",
      permalink: result.permalink ?? "",
      action: "post_reply",
      status: "success",
      published_url: result.permalink ?? "",
      rate_limit_remaining: result.rateLimitRemaining ?? null,
    });

    revalidatePath("/reddit");
    return { ok: true, message: `Posted — ${result.permalink || "reply live on Reddit"}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Post failed" };
  }
}
