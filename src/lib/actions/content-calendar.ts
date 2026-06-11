"use server";

import { revalidateDashboard } from "@/lib/actions/shared";
import { createServerClient } from "@/lib/supabase/server";
import { logCalendarPublish } from "@/lib/content-calendar/sync";
import { publishApprovedXTweet } from "@/lib/integrations/x-service";
import { isXPublishConfigured } from "@/lib/integrations/config";
import { recordHandoff } from "@/lib/collaboration/handoff";
import { transitionContentWorkflow } from "@/lib/workflow/engine";
import type { WorkflowStage } from "@/lib/workflow/types";
import type { CalendarStatus } from "@/lib/types";

export type CalendarActionResult = { ok: true; message?: string } | { ok: false; error: string };

async function syncCalendarWorkflow(
  calendarItemId: string,
  toStage: WorkflowStage,
  event: string,
  actor = "founder"
) {
  const supabase = createServerClient();
  const { data: item } = await supabase
    .from("content_calendar")
    .select("id, title, source_table, source_id")
    .eq("id", calendarItemId)
    .maybeSingle();
  if (!item) return;

  await transitionContentWorkflow({
    sourceTable: "content_calendar",
    sourceId: calendarItemId,
    toStage,
    event,
    actor,
    calendarItemId,
    title: item.title ?? "Calendar item",
    contentType: "calendar",
  });

  if (item.source_table && item.source_id) {
    await transitionContentWorkflow({
      sourceTable: item.source_table,
      sourceId: item.source_id,
      toStage,
      event,
      actor,
      calendarItemId,
    });
  }
}

/**
 * Phase 29 — founder leaves feedback directly on a calendar item.
 * Saves to content_feedback, optionally sends the item back to an agent
 * (status → needs_revision + revision task + message).
 */
export async function submitCalendarItemFeedback(input: {
  id: string;
  feedbackCategory: string;
  note?: string;
  sendBackTo?: "sage" | "bloom" | "fern" | "";
}): Promise<CalendarActionResult> {
  try {
    const supabase = createServerClient();
    const note = (input.note ?? "").trim();
    const sendBack = input.sendBackTo ?? "";

    const { data: item, error: itemError } = await supabase
      .from("content_calendar")
      .select("id, title, platform")
      .eq("id", input.id)
      .maybeSingle();
    if (itemError || !item) return { ok: false, error: itemError?.message ?? "Calendar item not found" };

    try {
      await supabase.from("content_feedback").insert({
        source_table: "content_calendar",
        source_id: item.id,
        calendar_item_id: item.id,
        content_id: item.id,
        content_type: "calendar_item",
        agent_id: sendBack,
        feedback_type: "calendar_review",
        decision: sendBack ? "revision_requested" : "note",
        feedback_category: input.feedbackCategory,
        feedback_text: note,
        sent_back_to_agent: sendBack,
        created_by: "founder",
      });
    } catch {
      // optional table — feedback still flows through the revision path below
    }

    if (sendBack) {
      await supabase
        .from("content_calendar")
        .update({ status: "needs_revision", notes: note || input.feedbackCategory })
        .eq("id", item.id);
      await recordHandoff({
        fromAgent: "gate",
        toAgent: sendBack,
        workflowName: `Gate → ${sendBack[0].toUpperCase()}${sendBack.slice(1)}`,
        triggerType: "calendar_revision",
        triggerId: item.id,
        taskType: "content_revision",
        taskDescription: `Revise "${item.title}" (${input.feedbackCategory}). Founder notes: ${note || "see category"}`,
        priority: "high",
        messageTitle: `Revision requested — ${input.feedbackCategory}`,
        messageBody: `Founder feedback on "${item.title}" (${item.platform}):\n\n${note || input.feedbackCategory}`,
        activityDetail: `Founder sent "${item.title}" back to ${sendBack} — ${input.feedbackCategory}`,
      });
    }

    await revalidateDashboard();
    return { ok: true, message: sendBack ? `Sent back to ${sendBack}` : "Feedback saved" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Feedback failed" };
  }
}

export async function updateCalendarItemStatus(
  id: string,
  status: CalendarStatus
): Promise<CalendarActionResult> {
  try {
    const supabase = createServerClient();
    const { data: item, error } = await supabase
      .from("content_calendar")
      .update({
        status,
        ...(status === "published" ? { published_at: new Date().toISOString() } : {}),
        ...(status === "rejected" ? { approval_status: "rejected" } : {}),
        ...(status === "approved" ? { approval_status: "approved" } : {}),
      })
      .eq("id", id)
      .select("platform")
      .single();
    if (error) return { ok: false, error: error.message };

    await logCalendarPublish(id, {
      platform: item.platform,
      status: "status_change",
      metadata: { to: status, by: "human" },
    });

    if (status === "scheduled") {
      await syncCalendarWorkflow(id, "SCHEDULED", "Scheduled", "founder");
    } else if (status === "published") {
      await syncCalendarWorkflow(id, "PUBLISHED", "Published", "founder");
    } else if (status === "rejected") {
      await syncCalendarWorkflow(id, "REJECTED", "Rejected", "founder");
    }

    await revalidateDashboard();
    return { ok: true, message: `Status changed to ${status}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Status update failed" };
  }
}

export async function markCalendarItemPosted(
  id: string,
  publishedUrl?: string
): Promise<CalendarActionResult> {
  try {
    const supabase = createServerClient();
    const { data: item, error } = await supabase
      .from("content_calendar")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        ...(publishedUrl ? { platform_url: publishedUrl } : {}),
      })
      .eq("id", id)
      .select("platform, title")
      .single();
    if (error) return { ok: false, error: error.message };

    await logCalendarPublish(id, {
      platform: item.platform,
      status: "manual_published",
      publishedUrl,
      metadata: { by: "human" },
    });
    await syncCalendarWorkflow(id, "PUBLISHED", "Published", "founder");
    await supabase.from("agent_activity_log").insert({
      agent_id: "sprout",
      action: "calendar_published",
      detail: `Marked as posted: ${item.title.slice(0, 60)} (${item.platform})`,
      metadata: { calendar_item_id: id, published_url: publishedUrl ?? "" },
    });
    await revalidateDashboard();
    return { ok: true, message: "Marked as posted" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Mark as posted failed" };
  }
}

export async function saveCalendarItemPublishedUrl(
  id: string,
  url: string
): Promise<CalendarActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("content_calendar")
      .update({ platform_url: url })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    await revalidateDashboard();
    return { ok: true, message: "Published URL saved" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Save failed" };
  }
}

export async function saveCalendarItemNotes(
  id: string,
  notes: string
): Promise<CalendarActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("content_calendar").update({ notes }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    await revalidateDashboard();
    return { ok: true, message: "Notes saved" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Save failed" };
  }
}

export async function rescheduleCalendarItem(
  id: string,
  scheduledFor: string
): Promise<CalendarActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("content_calendar")
      .update({ scheduled_for: scheduledFor, status: "scheduled" })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    await syncCalendarWorkflow(id, "SCHEDULED", "Scheduled", "founder");
    await revalidateDashboard();
    return { ok: true, message: "Rescheduled" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Reschedule failed" };
  }
}

/**
 * Part 5 — X is the only platform allowed to publish via API, and only after
 * Sage + Gate approval, Sprout queueing, and this explicit human click.
 */
export async function publishCalendarItemToX(id: string): Promise<CalendarActionResult> {
  try {
    if (!isXPublishConfigured()) {
      return {
        ok: false,
        error: "X publish tokens missing — set X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET",
      };
    }

    const supabase = createServerClient();
    const { data: item, error } = await supabase
      .from("content_calendar")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !item) return { ok: false, error: error?.message ?? "Calendar item not found" };

    if (item.platform !== "x") {
      return { ok: false, error: "Only X supports API publishing — use the manual copy/upload workflow" };
    }
    if (item.source_table !== "x_post_queue" || !item.source_id) {
      return { ok: false, error: "This item is not linked to the X publish queue (Sprout)" };
    }
    if (item.status !== "ready_to_publish") {
      return { ok: false, error: `Item must be ready_to_publish (currently ${item.status})` };
    }

    const { tweetId } = await publishApprovedXTweet(item.source_id, "sprout");
    const platformUrl = `https://x.com/PlantPalApp/status/${tweetId}`;

    await supabase
      .from("content_calendar")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        platform_url: platformUrl,
      })
      .eq("id", id);

    await logCalendarPublish(id, {
      platform: "x",
      status: "published",
      publishedUrl: platformUrl,
      metadata: { tweet_id: tweetId, human_confirmed: true },
    });
    await syncCalendarWorkflow(id, "PUBLISHED", "Published", "sprout");

    await revalidateDashboard();
    return { ok: true, message: `Published to X — ${platformUrl}` };
  } catch (e) {
    const message = e instanceof Error ? e.message : "X publish failed";
    await logCalendarPublish(id, { platform: "x", status: "failed", errorMessage: message });
    return { ok: false, error: message };
  }
}
