"use server";

import { revalidatePath } from "next/cache";
import { runDailyReportGeneration } from "@/lib/daily-report/engine";

export type DailyReportGenerateResult =
  | { ok: true; reportId: string; message: string }
  | { ok: false; error: string };

export async function generateDailyReport(): Promise<DailyReportGenerateResult> {
  try {
    const { reportId } = await runDailyReportGeneration();
    revalidatePath("/");
    revalidatePath("/daily-report");
    return {
      ok: true,
      reportId,
      message: "Daily report generated. Ivy logged the run — all actions still require human approval.",
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to generate daily report",
    };
  }
}
