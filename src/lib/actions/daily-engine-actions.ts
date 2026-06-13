"use server";

import { revalidatePath } from "next/cache";
import { runDailyEngine } from "@/lib/hq/daily-engine";
import type { DailyEngineResult } from "@/lib/hq/daily-engine";

export async function runDailyEngineFromDashboard(): Promise<
  { ok: true; result: DailyEngineResult } | { ok: false; error: string }
> {
  try {
    const result = await runDailyEngine();
    revalidatePath("/system-health");
    revalidatePath("/agent-operations");
    revalidatePath("/intelligence");
    revalidatePath("/seo");
    revalidatePath("/blog-pipeline");
    revalidatePath("/social");
    revalidatePath("/images");
    revalidatePath("/video");
    revalidatePath("/inbox");
    revalidatePath("/approvals");
    revalidatePath("/daily-report");
    revalidatePath("/");
    return { ok: true, result };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Daily engine failed" };
  }
}
