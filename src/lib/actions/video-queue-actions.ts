"use server";

import { revalidatePath } from "next/cache";
import { cleanupBadVideoQueueItems, populateVideoQueue, materializeVideoScriptsFromQueue } from "@/lib/pipeline/video-queue";
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
  const isDev = process.env.NODE_ENV === "development";
  if (!isDev && process.env.NEXT_PUBLIC_SHOW_DEMO_DATA !== "true") {
    return { ok: false, error: "Cleanup only available in development or admin mode." };
  }

  const result = await cleanupBadVideoQueueItems();
  revalidatePath("/video");

  if (result.error) return { ok: false, error: result.error };
  return { ok: true, message: `Marked ${result.rejected} polluted items as rejected.` };
}
