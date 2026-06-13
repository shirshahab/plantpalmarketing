import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { runF5BotCronIngest } from "@/lib/intelligence/f5bot-cron-run";
import { isAuthorizedF5BotPoll } from "@/lib/intelligence/f5bot-poll-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Server-side F5Bot cron trigger. CRON_SECRET stays on the server. */
export async function POST(request: NextRequest) {
  if (!(await isAuthorizedF5BotPoll(request))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await runF5BotCronIngest();
  return NextResponse.json({
    ok: !result.error || result.inserted > 0 || result.skippedDuplicates > 0,
    fetched: result.totalFromFeed,
    inserted: result.inserted,
    duplicates: result.skippedDuplicates,
    errors: result.errors,
    runId: result.runId,
    error: result.error,
  });
}
