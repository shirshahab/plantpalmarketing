import { NextRequest, NextResponse } from "next/server";
import { runF5BotCronIngest } from "@/lib/intelligence/f5bot-cron-run";
import { isAuthorizedF5BotPoll } from "@/lib/intelligence/f5bot-poll-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Phase 4 — scheduled F5Bot ingestion (every 30 min via Vercel cron).
 * Fetch → classify → save → dedupe → log run history.
 */
export async function GET(request: NextRequest) {
  if (!(await isAuthorizedF5BotPoll(request))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await runF5BotCronIngest();

  return NextResponse.json(
    {
      ok: !result.error || result.inserted > 0 || result.skippedDuplicates > 0,
      fetched: result.totalFromFeed,
      inserted: result.inserted,
      duplicates: result.skippedDuplicates,
      errors: result.errors,
      runId: result.runId,
      error: result.error,
    },
    { status: result.error && result.inserted === 0 && result.skippedDuplicates === 0 ? 502 : 200 }
  );
}

export async function POST(request: NextRequest) {
  return GET(request);
}
