"use server";

import { revalidatePath } from "next/cache";
import { populateVideoQueue, materializeVideoScriptsFromQueue } from "@/lib/pipeline/video-queue";
import type { ActionResult } from "@/lib/actions/shared";

export async function generateVideoQueueBatchAction(count = 10): Promise<ActionResult> {
  const queued = await populateVideoQueue(count);
  if (queued.inserted === 0) {
    return { ok: false, error: queued.error ?? "No approved video-ready ideas found. Send items from Bloom, Trends, SEO, or Reddit first." };
  }

  const scripts = await materializeVideoScriptsFromQueue(count);
  revalidatePath("/video");
  revalidatePath("/system-health");

  return {
    ok: true,
    message: `Queued ${queued.inserted} clean concepts · ${scripts.created} video scripts created`,
  };
}

export async function cleanupBadVideoQueueItemsAction(): Promise<ActionResult> {
  const { rejectBadVideoRows } = await import("@/lib/pipeline/hq-cleanup");
  const result = await rejectBadVideoRows();
  revalidatePath("/video");
  revalidatePath("/system-health");

  if (result.error) return { ok: false, error: result.error };
  return { ok: true, message: `Marked ${result.rejected} polluted items as rejected.` };
}
