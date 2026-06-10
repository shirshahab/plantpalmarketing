import {
  formatToPlatform,
  getBestPostingTime,
  nextSlotDate,
} from "@/lib/agents/sprout/posting-times";
import { createServerClient } from "@/lib/supabase/server";
import { sproutSyncXEngagement } from "@/lib/integrations/agent-integrations";
import { advanceXQueueStatus } from "@/lib/integrations/x-service";

export interface SproutRunResult {
  queued: number;
  skipped: number;
}

export async function runSproutAgent(): Promise<SproutRunResult> {
  const supabase = createServerClient();
  await sproutSyncXEngagement().catch(() => []);

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

    const { error: insertError } = await supabase.from("sprout_scheduled_posts").insert({
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
    });

    if (insertError) throw new Error(insertError.message);

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

  return { queued, skipped };
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
