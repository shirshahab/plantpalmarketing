"use server";

import { revalidatePath } from "next/cache";
import { runF5BotCronIngest } from "@/lib/intelligence/f5bot-cron-run";

export async function runF5BotCronFromDashboard(): Promise<
  | { ok: true; fetched: number; inserted: number; duplicates: number; runId: string | null }
  | { ok: false; error: string }
> {
  try {
    const result = await runF5BotCronIngest();
    revalidatePath("/agent-operations");
    revalidatePath("/intelligence");
    revalidatePath("/");

    if (result.error && result.inserted === 0 && result.skippedDuplicates === 0) {
      return { ok: false, error: result.error };
    }

    return {
      ok: true,
      fetched: result.totalFromFeed,
      inserted: result.inserted,
      duplicates: result.skippedDuplicates,
      runId: result.runId,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Cron run failed" };
  }
}
