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
import { runVoiceCheck, VOICE_FAIL_REASON, VOICE_PASS_THRESHOLD } from "@/lib/brand/voice-check";
import { recordHandoff } from "@/lib/collaboration/handoff";

type Result = { ok: true; message?: string } | { ok: false; error: string };

const MIGRATION_HINT =
  "System setup is still finishing. This section will populate once the backend is ready.";

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

    // Phase 35 — replies sound like a knowledgeable friend, never customer
    // support, never ChatGPT. Help first, casual, no marketing language.
    const draft = [
      `Overwatering is usually the culprit here. Plants like a drink. They don't like living in a swamp.`,
      ``,
      `Quick checks before the next watering:`,
      `Poke the soil two inches down. Damp? Walk away. Most yellowing is drowning, not thirst.`,
      `Make sure the pot actually drains. Roots sitting in water give up fast.`,
      `Old bottom leaves going yellow on their own is often just the plant retiring them. That part's fine.`,
      ``,
      `Tell me the light situation and how often you water and I can narrow it down.`,
    ].join("\n");

    // Voice gate — corporate or robotic drafts never reach the founder.
    const voice = runVoiceCheck(draft);
    if (voice.score < VOICE_PASS_THRESHOLD) {
      await recordHandoff({
        fromAgent: "gate",
        toAgent: "sage",
        workflowName: "Voice Gate → Sage",
        triggerType: "voice_check_failed",
        triggerId: opp.id,
        taskType: "voice_revision",
        taskDescription: `Reddit reply draft failed the PlantPal voice check (${voice.score}/10). Rewrite it: ${voice.violations.slice(0, 2).join("; ")}`,
        priority: "medium",
        messageTitle: `${VOICE_FAIL_REASON} — Reddit reply for r/${opp.subreddit}`,
        messageBody: `Draft scored ${voice.score}/10.\n\nViolations: ${voice.violations.join("; ")}\n\nDraft:\n${draft}`,
        activityDetail: `Voice gate rejected a Reddit reply draft (${voice.score}/10) — sent to Sage`,
      });
      return { ok: false, error: `${VOICE_FAIL_REASON} (${voice.score}/10) — sent back to Sage for a rewrite.` };
    }

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

/** Draft a Reddit reply from an F5Bot intelligence alert (read-only until OAuth + founder approval). */
export async function draftRedditReplyFromIntelligence(alertId: string): Promise<Result> {
  try {
    const supabase = createServerClient();
    const { data: alert, error } = await supabase
      .from("intelligence_alerts")
      .select("*")
      .eq("id", alertId)
      .maybeSingle();
    if (error || !alert) {
      return { ok: false, error: error?.message ?? "Alert not found" };
    }

    const subreddit = String(alert.subreddit ?? "houseplants").replace(/^r\//, "");
    const question = String(alert.body || alert.title);
    const draft = [
      `This usually comes down to watering rhythm and light, not the plant being dramatic (even though it looks dramatic).`,
      ``,
      `Check the top two inches of soil before watering again. If it is still damp, wait.`,
      `Make sure the pot drains freely. Sitting water is the fastest way to yellow leaves.`,
      ``,
      `If you share your watering schedule and window direction, I can help narrow it down.`,
    ].join("\n");

    const voice = runVoiceCheck(draft);
    if (voice.score < VOICE_PASS_THRESHOLD) {
      return { ok: false, error: `${VOICE_FAIL_REASON} (${voice.score}/10). Edit manually before approval.` };
    }

    const { error: insertError } = await supabase.from("reddit_reply_drafts").insert({
      opportunity_id: null,
      subreddit,
      post_id: "",
      permalink: String(alert.url ?? ""),
      author: String(alert.author ?? ""),
      question,
      draft_reply: draft,
      status: "pending_approval",
      risk_score: alert.priority === "high" ? 2 : 4,
    });
    if (insertError) {
      return { ok: false, error: isMissingTableError(insertError) ? MIGRATION_HINT : insertError.message };
    }

    revalidatePath("/reddit");
    return { ok: true, message: "Draft created from F5Bot alert. Awaiting founder approval." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Draft failed" };
  }
}

/** Phase 31 Step 7 — track engagement (upvotes, notes) on posted replies. */
export async function updateRedditEngagement(
  logId: string,
  upvotes: number,
  note: string
): Promise<Result> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("reddit_publish_logs")
      .update({ upvotes: Math.max(0, Math.round(upvotes)), engagement_note: note.trim() })
      .eq("id", logId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/reddit");
    return { ok: true, message: "Engagement saved" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to save engagement" };
  }
}
