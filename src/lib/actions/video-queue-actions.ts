"use server";

import { revalidatePath } from "next/cache";
import { materializeVideoScriptsFromQueue, populateVideoQueue } from "@/lib/pipeline/video-queue";
import type { ActionResult } from "@/lib/actions/shared";

export async function generateVideoQueueBatchAction(count = 10): Promise<ActionResult> {
  const queued = await populateVideoQueue(count);
  if (queued.error && queued.inserted === 0) return { ok: false, error: queued.error };

  const scripts = await materializeVideoScriptsFromQueue(count);
  revalidatePath("/video");
  revalidatePath("/system-health");

  if (scripts.created === 0 && queued.inserted === 0) {
    return { ok: false, error: scripts.error ?? queued.error ?? "Nothing generated" };
  }

  return {
    ok: true,
    message: `Queued ${queued.inserted} concepts · ${scripts.created} video scripts created`,
  };
}
