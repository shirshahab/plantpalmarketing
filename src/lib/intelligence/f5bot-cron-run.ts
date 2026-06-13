import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import { logIntegrationCall } from "@/lib/integrations/log";
import { ingestF5BotAlerts, type F5BotIngestResult } from "@/lib/intelligence/f5bot-ingest";

export interface F5BotCronResult extends F5BotIngestResult {
  runId: string | null;
}

async function startRun(): Promise<string | null> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("intelligence_runs")
      .insert({ status: "running" })
      .select("id")
      .single();
    if (error) {
      if (isMissingTableError(error)) return null;
      throw error;
    }
    return String(data.id);
  } catch {
    return null;
  }
}

async function finishRun(
  runId: string | null,
  result: F5BotIngestResult,
  status: "success" | "partial" | "failed"
): Promise<void> {
  if (!runId) return;
  try {
    const supabase = createServerClient();
    await supabase
      .from("intelligence_runs")
      .update({
        completed_at: new Date().toISOString(),
        fetched_count: result.totalFromFeed,
        inserted_count: result.inserted,
        duplicate_count: result.skippedDuplicates,
        error_count: result.errors.length,
        status,
        error_message: result.error ?? result.errors[0] ?? "",
        metadata: {
          latest_alert_ids: result.latestAlerts.map((a) => a.id),
        },
      })
      .eq("id", runId);
  } catch {
    // best-effort
  }
}

/** Phase 4 — scheduled F5Bot ingest with run history logging. */
export async function runF5BotCronIngest(): Promise<F5BotCronResult> {
  const runId = await startRun();
  const result = await ingestF5BotAlerts();

  const status: "success" | "partial" | "failed" =
    result.error && result.inserted === 0 && result.skippedDuplicates === 0
      ? "failed"
      : result.errors.length > 0
        ? "partial"
        : "success";

  await finishRun(runId, result, status);

  if (result.inserted > 0) {
    void import("@/lib/intelligence/daily-intelligence-brief").then((m) => m.generateDailyIntelligenceBrief());
  }

  await logIntegrationCall({
    provider: "f5bot",
    action: "f5bot_cron",
    status: status === "failed" ? "error" : "success",
    responseSummary: `fetched=${result.totalFromFeed} inserted=${result.inserted} duplicates=${result.skippedDuplicates}`,
    errorMessage: result.error ?? result.errors[0],
  });

  return { ...result, runId };
}
