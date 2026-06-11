import {
  formatToPlatform,
  getBestPostingTime,
  nextSlotDate,
} from "@/lib/agents/sprout/posting-times";
import { createServerClient } from "@/lib/supabase/server";
import { sproutSyncXEngagement } from "@/lib/integrations/agent-integrations";
import { advanceXQueueStatus } from "@/lib/integrations/x-service";
import { syncSproutScheduleToCalendar } from "@/lib/content-calendar/sync";
import { recordHandoff } from "@/lib/collaboration/handoff";

export interface SproutRunResult {
  queued: number;
  skipped: number;
  packagesBuilt: number;
  scheduledDue: number;
}

/**
 * Phase 31 — runs every 30 minutes. Flips scheduled calendar items whose time
 * arrived to ready_to_publish and builds missing publishing packages.
 */
async function processCalendarQueue(
  supabase: ReturnType<typeof createServerClient>
): Promise<{ packagesBuilt: number; scheduledDue: number }> {
  const result = { packagesBuilt: 0, scheduledDue: 0 };
  try {
    const { data: items, error } = await supabase
      .from("content_calendar")
      .select("id, status, scheduled_for, metadata")
      .in("status", ["approved", "scheduled", "ready_to_publish"])
      .order("created_at", { ascending: false })
      .limit(50);
    if (error || !items) return result;

    const now = Date.now();
    for (const item of items) {
      if (item.status === "scheduled" && item.scheduled_for && new Date(item.scheduled_for).getTime() <= now) {
        result.scheduledDue += 1;
        await supabase.from("content_calendar").update({ status: "ready_to_publish" }).eq("id", item.id);
      }

      const meta = (item.metadata && typeof item.metadata === "object" ? item.metadata : {}) as Record<string, unknown>;
      if (!meta.publishing_package_id) {
        const { buildPublishingPackageForCalendarItem } = await import("@/lib/automation/publishing-packages");
        const packageId = await buildPublishingPackageForCalendarItem(item.id);
        if (packageId) {
          result.packagesBuilt += 1;
          await supabase
            .from("content_calendar")
            .update({ metadata: { ...meta, publishing_package_id: packageId } })
            .eq("id", item.id);
        }
      }
    }
  } catch {
    // calendar queue work is best-effort
  }
  return result;
}

export async function runSproutAgent(): Promise<SproutRunResult> {
  const supabase = createServerClient();
  await sproutSyncXEngagement().catch(() => []);

  const calendarWork = await processCalendarQueue(supabase);

  const { data: approved, error } = await supabase
    .from("bloom_content_pieces")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const { data: existing } = await supabase
    .from("sprout_scheduled_posts")
    .select("bloom_piece_id")
    .not("bloom_piece_id", "is", null);

  const scheduledIds = new Set((existing ?? []).map((r) => r.bloom_piece_id));

  let queued = 0;
  let skipped = 0;

  for (const piece of approved ?? []) {
    if (scheduledIds.has(piece.id)) {
      skipped++;
      continue;
    }

    const platform = formatToPlatform(piece.format);
    if (!platform) {
      skipped++;
      continue;
    }

    const slot = getBestPostingTime(platform);

    const { data: insertedPost, error: insertError } = await supabase
      .from("sprout_scheduled_posts")
      .insert({
        bloom_piece_id: piece.id,
        platform,
        title: piece.title,
        hook: piece.hook,
        caption: piece.caption,
        cta: piece.cta,
        recommended_time_label: slot.label,
        best_time_score: slot.score,
        status: "waiting",
        schedule_approved: false,
        notes: "Queued by Sprout — schedule approval required before publish",
      })
      .select("id")
      .single();

    if (insertError || !insertedPost) throw new Error(insertError?.message ?? "Failed to queue post");

    // Phase 28: scheduling updates the calendar + creates the publishing package
    await syncSproutScheduleToCalendar(insertedPost.id).catch(() => null);
    await recordHandoff({
      fromAgent: "gate",
      toAgent: "sprout",
      workflowName: "Gate → Sprout",
      triggerType: "approved_content",
      triggerId: insertedPost.id,
      taskType: "schedule_post",
      taskDescription: `Schedule "${piece.title}" for ${platform} — recommended slot: ${slot.label}.`,
      priority: "medium",
      messageTitle: `Approved content queued: ${piece.title}`,
      messageBody: `${platform} post queued at the recommended time (${slot.label}, score ${slot.score}). Publishing package generated on the calendar item.`,
      activityDetail: `Sprout queued "${piece.title}" for ${platform} (${slot.label})`,
      metadata: { sprout_post_id: insertedPost.id, bloom_piece_id: piece.id },
    });

    if (platform === "X") {
      const { data: xApproved } = await supabase
        .from("x_post_queue")
        .select("id, gate_approved, status")
        .eq("bloom_piece_id", piece.id)
        .eq("gate_approved", true)
        .in("status", ["ready_to_publish", "queued", "gate_approval"]);
      for (const draft of xApproved ?? []) {
        if (!["queued", "ready_to_publish"].includes(draft.status)) continue;
        await advanceXQueueStatus(draft.id, "ready_to_publish", {
          scheduledAt: nextSlotDate(slot.dayOfWeek, slot.hour).toISOString(),
        }).catch(() => undefined);
      }
    }

    queued++;
  }

  if (queued > 0) {
    await supabase.from("agent_activity_log").insert({
      agent_id: "sprout",
      action: "queue_updated",
      detail: `Added ${queued} approved posts to publish queue — awaiting schedule approval`,
      metadata: { queued, skipped },
    });
  }

  return { queued, skipped, ...calendarWork };
}

export function buildScheduledAtFromRecommendation(
  recommendedLabel: string,
  platform: string
): string | null {
  const slot = getBestPostingTime(platform as Parameters<typeof getBestPostingTime>[0]);
  if (recommendedLabel && slot.label === recommendedLabel) {
    return nextSlotDate(slot.dayOfWeek, slot.hour).toISOString();
  }
  return nextSlotDate(slot.dayOfWeek, slot.hour).toISOString();
}
