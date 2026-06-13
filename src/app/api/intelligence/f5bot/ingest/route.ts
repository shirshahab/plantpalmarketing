import { NextRequest, NextResponse } from "next/server";
import { ingestF5BotAlerts } from "@/lib/intelligence/f5bot-ingest";
import { isAuthorizedF5BotPoll } from "@/lib/intelligence/f5bot-poll-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Phase 2 — fetch F5Bot JSON feed and save new alerts to intelligence_alerts.
 * Dedupe by URL. Does not delete existing rows.
 */
export async function GET(request: NextRequest) {
  if (!(await isAuthorizedF5BotPoll(request))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await ingestF5BotAlerts();
  const status = result.error && result.inserted === 0 && result.skippedDuplicates === 0 ? 502 : 200;
  return NextResponse.json(result, { status });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
