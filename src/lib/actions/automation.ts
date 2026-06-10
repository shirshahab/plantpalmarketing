"use server";

import { revalidateDashboard } from "@/lib/actions/shared";
import {
  applyApprovalToSource,
  buildDailyApprovalInbox,
  recordAutomationRun,
} from "@/lib/automation/engine";
import { getBestPostingTime, nextSlotDate } from "@/lib/agents/sprout/posting-times";
import { runSproutAgent } from "@/lib/agents/sprout/run-sprout-agent";
import { syncSproutScheduleToCalendar } from "@/lib/content-calendar/sync";
import { createServerClient } from "@/lib/supabase/server";
import type { AutomationAction, SproutPlatform } from "@/lib/types";

export type AutomationActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function runDailyAutomation(): Promise<AutomationActionResult> {
  try {
    const result = await buildDailyApprovalInbox();
    await recordAutomationRun({
      ruleKey: "internal_reports",
      agentId: "ivy",
      action: "build_approval_inbox",
      itemsProcessed: Object.values(result.byType).reduce((s, n) => s + n, 0),
      itemsCreated: result.added,
      detail: `Built daily approval inbox — ${result.added} new items for review`,
      metadata: result.byType,
    });
    await revalidateDashboard();
    return {
      ok: true,
      message:
        result.added > 0
          ? `Inbox ready — ${result.added} new items to review`
          : "Inbox is up to date — nothing new to review",
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Automation run failed";
    await recordAutomationRun({
      ruleKey: "internal_reports",
      agentId: "ivy",
      action: "build_approval_inbox",
      status: "failed",
      errorMessage: error,
    });
    return { ok: false, error };
  }
}

export async function toggleAutomationRule(
  id: string,
  enabled: boolean
): Promise<AutomationActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("automation_rules").update({ enabled }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    await revalidateDashboard();
    return { ok: true, message: enabled ? "Rule enabled" : "Rule disabled" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Toggle failed" };
  }
}

export async function setAutomationRuleAction(
  id: string,
  action: AutomationAction
): Promise<AutomationActionResult> {
  try {
    const supabase = createServerClient();
    const { data: rule, error: fetchError } = await supabase
      .from("automation_rules")
      .select("risk_level, label")
      .eq("id", id)
      .single();
    if (fetchError || !rule) return { ok: false, error: fetchError?.message ?? "Rule not found" };

    // Safety: high-risk workflows can never be fully auto-approved
    if (rule.risk_level === "high" && action === "auto_approve") {
      return {
        ok: false,
        error: `${rule.label} is high risk — auto-approval is locked until safety rules are proven`,
      };
    }

    const { error } = await supabase.from("automation_rules").update({ action }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    await revalidateDashboard();
    return { ok: true, message: `Approval mode set to ${action.replace("_", " ")}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Update failed" };
  }
}

async function decideItems(ids: string[], approved: boolean): Promise<AutomationActionResult> {
  if (ids.length === 0) return { ok: false, error: "No items selected" };
  try {
    const supabase = createServerClient();
    const { data: items, error } = await supabase
      .from("batch_approvals")
      .select("*")
      .in("id", ids)
      .eq("status", "pending");
    if (error) return { ok: false, error: error.message };

    let processed = 0;
    for (const item of items ?? []) {
      if (item.source_table && item.source_id) {
        await applyApprovalToSource(item.source_table, item.source_id, approved);
      }
      await supabase
        .from("batch_approvals")
        .update({ status: approved ? "approved" : "rejected", decided_at: new Date().toISOString() })
        .eq("id", item.id);
      processed++;
    }

    await recordAutomationRun({
      ruleKey: "internal_reports",
      agentId: "gate",
      action: approved ? "batch_approve" : "batch_reject",
      itemsProcessed: processed,
      detail: `${approved ? "Approved" : "Rejected"} ${processed} items from the daily inbox`,
    });
    await revalidateDashboard();
    return { ok: true, message: `${approved ? "Approved" : "Rejected"} ${processed} item${processed === 1 ? "" : "s"}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Batch decision failed" };
  }
}

export async function approveBatchItems(ids: string[]): Promise<AutomationActionResult> {
  return decideItems(ids, true);
}

export async function rejectBatchItems(ids: string[]): Promise<AutomationActionResult> {
  return decideItems(ids, false);
}

/** Approves every pending inbox item that is NOT high risk. */
export async function approveAllLowRisk(): Promise<AutomationActionResult> {
  try {
    const supabase = createServerClient();
    const { data: items, error } = await supabase
      .from("batch_approvals")
      .select("id")
      .eq("status", "pending")
      .neq("risk_level", "high");
    if (error) return { ok: false, error: error.message };
    if (!items?.length) return { ok: true, message: "No low-risk items pending" };
    return decideItems(items.map((i) => i.id), true);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Approve failed" };
  }
}

export async function updateBatchItemContent(
  id: string,
  content: string
): Promise<AutomationActionResult> {
  try {
    const supabase = createServerClient();
    const { data: item, error } = await supabase
      .from("batch_approvals")
      .select("source_table, source_id, metadata")
      .eq("id", id)
      .single();
    if (error || !item) return { ok: false, error: error?.message ?? "Item not found" };

    // Propagate the edit to the underlying record
    if (item.source_id) {
      if (item.source_table === "x_post_queue") {
        await supabase.from("x_post_queue").update({ text: content }).eq("id", item.source_id);
      } else if (item.source_table === "approval_queue") {
        await supabase.from("approval_queue").update({ draft: content }).eq("id", item.source_id);
      } else if (item.source_table === "community_reply_drafts") {
        await supabase.from("community_reply_drafts").update({ draft: content }).eq("id", item.source_id);
      } else if (item.source_table === "bloom_content_pieces") {
        await supabase.from("bloom_content_pieces").update({ caption: content }).eq("id", item.source_id);
      }
    }

    const meta = (item.metadata as Record<string, unknown>) ?? {};
    const { error: updateError } = await supabase
      .from("batch_approvals")
      .update({ content, metadata: { ...meta, edited: true, editedAt: new Date().toISOString() } })
      .eq("id", id);
    if (updateError) return { ok: false, error: updateError.message };

    await revalidateDashboard();
    return { ok: true, message: "Edit saved to the draft" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Edit failed" };
  }
}

export async function sendBackToSage(id: string): Promise<AutomationActionResult> {
  try {
    const supabase = createServerClient();
    const { data: item, error } = await supabase
      .from("batch_approvals")
      .select("source_table, source_id, metadata, title")
      .eq("id", id)
      .single();
    if (error || !item) return { ok: false, error: error?.message ?? "Item not found" };

    if (item.source_table === "x_post_queue" && item.source_id) {
      await supabase.from("x_post_queue").update({ status: "sage_review" }).eq("id", item.source_id);
    } else {
      // Find the underlying Bloom piece (directly, or via the approval queue link)
      let pieceId = item.source_table === "bloom_content_pieces" ? item.source_id : null;
      if (!pieceId && item.source_table === "approval_queue" && item.source_id) {
        const { data: approval } = await supabase
          .from("approval_queue")
          .select("source_id")
          .eq("id", item.source_id)
          .maybeSingle();
        pieceId = approval?.source_id ?? null;
        await supabase.from("approval_queue").delete().eq("id", item.source_id);
      }
      if (!pieceId) return { ok: false, error: "This item has no Bloom source to send back" };
      await supabase
        .from("bloom_content_pieces")
        .update({ status: "awaiting_review" })
        .eq("id", pieceId);
    }

    await supabase
      .from("batch_approvals")
      .update({ status: "sent_back", decided_at: new Date().toISOString() })
      .eq("id", id);

    await supabase.from("agent_activity_log").insert({
      agent_id: "sage",
      action: "sent_back_for_review",
      detail: `Founder sent "${item.title.slice(0, 50)}" back to Sage for another pass`,
      metadata: { batch_item_id: id },
    });

    await revalidateDashboard();
    return { ok: true, message: "Sent back to Sage — it will be re-scored on the next review run" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Send back failed" };
  }
}

/**
 * Schedule everything approved: Sprout queues approved Bloom pieces, then each
 * waiting post is auto-assigned its best time slot (calendar_scheduling is a
 * low-risk, auto-approved rule). No publishing happens here.
 */
export async function scheduleApprovedContent(): Promise<AutomationActionResult> {
  try {
    const supabase = createServerClient();

    let queued = 0;
    try {
      const result = await runSproutAgent();
      queued = result.queued;
    } catch {
      // No approved pieces waiting — still try to schedule the existing queue
    }

    const { data: waiting, error } = await supabase
      .from("sprout_scheduled_posts")
      .select("id, platform")
      .eq("status", "waiting");
    if (error) return { ok: false, error: error.message };

    let scheduled = 0;
    for (const post of waiting ?? []) {
      const slot = getBestPostingTime(post.platform as SproutPlatform);
      const scheduledAt = nextSlotDate(slot.dayOfWeek, slot.hour).toISOString();
      const { error: updateError } = await supabase
        .from("sprout_scheduled_posts")
        .update({
          status: "ready",
          schedule_approved: true,
          scheduled_at: scheduledAt,
          recommended_time_label: slot.label,
          best_time_score: slot.score,
        })
        .eq("id", post.id);
      if (updateError) continue;
      await syncSproutScheduleToCalendar(post.id);
      scheduled++;
    }

    await recordAutomationRun({
      ruleKey: "calendar_scheduling",
      agentId: "sprout",
      action: "auto_schedule_approved",
      itemsProcessed: queued + scheduled,
      itemsCreated: scheduled,
      detail: `Sprout queued ${queued} new posts and auto-scheduled ${scheduled} into best time slots`,
    });
    await revalidateDashboard();
    return { ok: true, message: `Queued ${queued}, scheduled ${scheduled} posts into best time slots` };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Scheduling failed";
    await recordAutomationRun({
      ruleKey: "calendar_scheduling",
      agentId: "sprout",
      action: "auto_schedule_approved",
      status: "failed",
      errorMessage: error,
    });
    return { ok: false, error };
  }
}
