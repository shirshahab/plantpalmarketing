import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedF5BotPoll } from "@/lib/intelligence/f5bot-poll-auth";
import { runDailyEngine } from "@/lib/hq/daily-engine";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  if (!(await isAuthorizedF5BotPoll(request))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await runDailyEngine();
  return NextResponse.json({ ok: result.success, ...result });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
