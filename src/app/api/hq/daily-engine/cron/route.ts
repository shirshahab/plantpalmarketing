import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron/auth";
import { runDailyEngine } from "@/lib/hq/daily-engine";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function handle(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret || !isAuthorizedCron(request, cronSecret)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await runDailyEngine();
  return NextResponse.json({ ok: result.success, ...result });
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
