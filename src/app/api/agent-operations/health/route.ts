import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAgentOperationsHealth } from "@/lib/agent-operations/health";
import { isAuthorizedF5BotPoll } from "@/lib/intelligence/f5bot-poll-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await isAuthorizedF5BotPoll(request))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const health = await getAgentOperationsHealth();
  return NextResponse.json({ ok: true, ...health });
}
