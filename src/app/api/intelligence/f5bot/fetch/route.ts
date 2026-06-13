import { NextRequest, NextResponse } from "next/server";
import { fetchF5BotAlerts } from "@/lib/intelligence/f5bot";
import { isAuthorizedF5BotPoll } from "@/lib/intelligence/f5bot-poll-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Fetch F5Bot JSON feed → intelligence_alerts.
 * Auth: CRON_SECRET bearer OR authenticated session.
 */
export async function GET(request: NextRequest) {
  if (!(await isAuthorizedF5BotPoll(request))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await fetchF5BotAlerts();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Fetch failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
