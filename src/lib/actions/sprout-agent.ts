"use server";

import { revalidateDashboard } from "@/lib/actions/shared";
import { getBestPostingTime, nextSlotDate } from "@/lib/agents/sprout/posting-times";
import { runSproutAgent } from "@/lib/agents/sprout/run-sprout-agent";
import { syncSproutScheduleToCalendar } from "@/lib/content-calendar/sync";
import { createServerClient } from "@/lib/supabase/server";
import type { SproutPlatform } from "@/lib/types";

export type SproutRunResult =
  | { ok: true; queued: number; skipped: number }
  | { ok: false; error: string };

export async function runSproutQueueScan(): Promise<SproutRunResult> {
  try {
    const result = await runSproutAgent();
    await revalidateDashboard();
    return { ok: true, ...result };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Sprout queue scan failed" };
  }
}

export async function approveSproutSchedule(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = createServerClient();
    const { data: post, error: fetchError } = await supabase
      .from("sprout_scheduled_posts")
      .select("*")
      .eq("id", id)
      .single();
    if (fetchError || !post) return { ok: false, error: fetchError?.message ?? "Post not found" };

    const slot = getBestPostingTime(post.platform as SproutPlatform);
    const scheduledAt = nextSlotDate(slot.dayOfWeek, slot.hour).toISOString();

    const { error } = await supabase
      .from("sprout_scheduled_posts")
      .update({
        status: "ready",
        schedule_approved: true,
        scheduled_at: scheduledAt,
        recommended_time_label: slot.label,
        best_time_score: slot.score,
      })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    await supabase.from("agent_activity_log").insert({
      agent_id: "sprout",
      action: "schedule_approved",
      detail: `Schedule approved: ${post.platform} — ${slot.label} (no auto-publish)`,
      metadata: { post_id: id, platform: post.platform },
    });

    await syncSproutScheduleToCalendar(id);
    await revalidateDashboard();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Approve failed" };
  }
}

export async function markSproutPublished(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = createServerClient();
    const { data: post } = await supabase.from("sprout_scheduled_posts").select("platform").eq("id", id).single();

    const { error } = await supabase
      .from("sprout_scheduled_posts")
      .update({ status: "published" })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };

    if (post) {
      await supabase.from("agent_activity_log").insert({
        agent_id: "sprout",
        action: "published",
        detail: `Marked published on ${post.platform} — manual publish confirmed`,
        metadata: { post_id: id },
      });
    }

    await syncSproutScheduleToCalendar(id, { published: true });
    await revalidateDashboard();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Update failed" };
  }
}

export async function rejectSproutSchedule(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("sprout_scheduled_posts")
      .update({ status: "waiting", schedule_approved: false, scheduled_at: null })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    await revalidateDashboard();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Update failed" };
  }
}
