import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron/auth";
import { generateDailyIntelligenceBrief } from "@/lib/intelligence/daily-intelligence-brief";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

async function handle(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret || !isAuthorizedCron(request, cronSecret)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const brief = await generateDailyIntelligenceBrief();
  return NextResponse.json({ ok: Boolean(brief), brief });
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
