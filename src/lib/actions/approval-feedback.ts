"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { syncApprovalQueueItemToCalendar } from "@/lib/content-calendar/sync";
import type { ApprovalFeedbackInput } from "@/lib/approvals/feedback-categories";

type Result = { ok: true; status: string } | { ok: false; error: string };

/** Best-effort insert — optional tables must never break the approval flow. */
async function tryInsert(table: "agent_tasks" | "agent_messages" | "agent_activity_log" | "content_feedback", row: Record<string, unknown>) {
  try {
    const supabase = createServerClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from(table as any).insert(row as any);
  } catch {
    // non-blocking
  }
}

/**
 * Phase 28 — founder decision with structured feedback on an approval_queue item.
 * Approve / approve with note / reject with reason / send back to Sage or Bloom.
 */
export async function submitApprovalDecision(input: ApprovalFeedbackInput): Promise<Result> {
  try {
    const supabase = createServerClient();
    const now = new Date().toISOString();
    const note = (input.note ?? "").trim();
    const category =
      input.feedbackCategory ||
      (input.decision === "approve" || input.decision === "approve_with_note" ? "approved as-is" : "too generic");

    const { data: item, error: itemError } = await supabase
      .from("approval_queue")
      .select("*")
      .eq("id", input.id)
      .maybeSingle();
    if (itemError || !item) return { ok: false, error: itemError?.message ?? "Approval item not found" };

    const isApprove = input.decision === "approve" || input.decision === "approve_with_note";
    const isReject = input.decision === "reject";
    const sendBackAgent =
      input.decision === "send_back_to_sage" ? "sage" : input.decision === "send_back_to_bloom" ? "bloom" : "";

    const status = isApprove ? "approved" : isReject ? "rejected" : "revision_requested";

    // Build the update — if migration 047 isn't applied yet, this falls back to status-only below
    const fullUpdate: {
      status: string;
      feedback_category: string;
      approval_feedback?: string;
      approved_by?: string;
      approved_at?: string;
      rejection_reason?: string;
      rejected_at?: string;
      revision_notes?: string;
      sent_back_to_agent?: string;
    } = {
      status,
      feedback_category: category,
      ...(isApprove ? { approval_feedback: note, approved_by: "founder", approved_at: now } : {}),
      ...(isReject ? { rejection_reason: note || category, rejected_at: now } : {}),
      ...(sendBackAgent ? { revision_notes: note || category, sent_back_to_agent: sendBackAgent } : {}),
    };

    let { error: updateError } = await supabase.from("approval_queue").update(fullUpdate).eq("id", input.id);
    if (updateError) {
      // Older schema without feedback columns / revision status — degrade gracefully
      const fallbackStatus = sendBackAgent ? "rejected" : status;
      const { error: fallbackError } = await supabase
        .from("approval_queue")
        .update({ status: fallbackStatus })
        .eq("id", input.id);
      if (fallbackError) return { ok: false, error: updateError.message };
      updateError = null;
    }

    // Record feedback so agents can learn from it
    await tryInsert("content_feedback", {
      source_table: "approval_queue",
      source_id: input.id,
      decision: isApprove
        ? input.decision === "approve_with_note"
          ? "approved_with_note"
          : "approved"
        : isReject
          ? "rejected"
          : "revision_requested",
      feedback_category: category,
      feedback_text: note,
      sent_back_to_agent: sendBackAgent,
      created_by: "founder",
    });

    if (isApprove || isReject) {
      await syncApprovalQueueItemToCalendar(input.id, isApprove);
    }

    if (sendBackAgent) {
      const summary = item.draft.slice(0, 120);

      // 1. The agent receives an actionable revision task
      await tryInsert("agent_tasks", {
        assigned_agent: sendBackAgent,
        created_by: "gate",
        task_type: "content_revision",
        description: `Revise content (${category}): "${summary}". Founder notes: ${note || "see feedback category"}`,
        priority: "high",
        status: "pending",
      });

      // 2. agent_messages records the feedback for the agent
      await tryInsert("agent_messages", {
        from_agent: "gate",
        to_agent: sendBackAgent,
        message_type: "revision_request",
        priority: "high",
        title: `Revision requested — ${category}`,
        body: `Founder sent this back.\n\nFeedback: ${note || category}\n\nContent:\n${item.draft}`,
        status: "unread",
      });

      // 3. content_calendar item moves to needs_revision
      try {
        await supabase
          .from("content_calendar")
          .update({ status: "needs_revision", notes: note || category })
          .eq("source_table", "approval_queue")
          .eq("source_id", input.id);
        if (item.source_id) {
          await supabase
            .from("content_calendar")
            .update({ status: "needs_revision", notes: note || category })
            .eq("source_id", item.source_id)
            .in("source_table", ["bloom_content_pieces", "pipeline_content"]);
        }
      } catch {
        // calendar table optional
      }

      await tryInsert("agent_activity_log", {
        agent_id: "gate",
        action: "revision_requested",
        detail: `Founder sent content back to ${sendBackAgent} — ${category}`,
        metadata: { approval_id: input.id, category, note },
      });
    } else {
      await tryInsert("agent_activity_log", {
        agent_id: "gate",
        action: isApprove ? "founder_approved" : "founder_rejected",
        detail: `Founder ${isApprove ? "approved" : "rejected"} ${item.type} (${category})${note ? ` — "${note.slice(0, 80)}"` : ""}`,
        metadata: { approval_id: input.id, category },
      });
    }

    revalidatePath("/", "layout");
    return { ok: true, status };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to submit decision" };
  }
}
