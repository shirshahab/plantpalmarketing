import { NextResponse } from "next/server";
import { runF5BotFeedTest } from "@/lib/intelligence/f5bot-test";

export const dynamic = "force-dynamic";

/**
 * Phase 1 — read-only F5Bot JSON feed connectivity test.
 * Checks F5BOT_ENABLED + F5BOT_JSON_FEED_URL, fetches feed, returns sample alerts.
 * Does not write to Supabase.
 */
export async function GET() {
  const result = await runF5BotFeedTest();
  const status = result.ok ? 200 : result.connectionStatus === "disabled" ? 503 : 502;
  return NextResponse.json(result, { status });
}

export async function POST() {
  return GET();
}
