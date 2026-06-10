"use server";

import { revalidateDashboard } from "@/lib/actions/shared";
import { createServerClient } from "@/lib/supabase/server";
import { logCalendarPublish } from "@/lib/content-calendar/sync";
import { publishApprovedXTweet } from "@/lib/integrations/x-service";
import { isXPublishConfigured } from "@/lib/integrations/config";
import type { CalendarStatus } from "@/lib/types";

export type CalendarActionResult = { ok: true; message?: string } | { ok: false; error: string };

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
      .update({ scheduled_for: scheduledFor })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
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

    await revalidateDashboard();
    return { ok: true, message: `Published to X — ${platformUrl}` };
  } catch (e) {
    const message = e instanceof Error ? e.message : "X publish failed";
    await logCalendarPublish(id, { platform: "x", status: "failed", errorMessage: message });
    return { ok: false, error: message };
  }
}
