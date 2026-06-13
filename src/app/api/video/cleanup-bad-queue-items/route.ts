import { NextRequest, NextResponse } from "next/server";
import { cleanupBadVideoQueueItems } from "@/lib/pipeline/video-queue";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  if (process.env.NODE_ENV === "development") return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await cleanupBadVideoQueueItems();
  return NextResponse.json({ ok: !result.error, ...result });
}
