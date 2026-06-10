import { NextRequest } from "next/server";
import { handleRunAgentsCron } from "@/lib/cron/run-agents-handler";

/**
 * Phase 24 Vercel Cron entrypoint — runs due agents on schedule.
 * Requires Authorization: Bearer <CRON_SECRET>
 * No auto-posting or outreach — outputs go to approval_queue.
 */
export async function GET(request: NextRequest) {
  return handleRunAgentsCron(request);
}

export async function POST(request: NextRequest) {
  return handleRunAgentsCron(request);
}

export const dynamic = "force-dynamic";
export const maxDuration = 300;
