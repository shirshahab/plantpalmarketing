import { NextRequest } from "next/server";
import { handleRunAgentsCron } from "@/lib/cron/run-agents-handler";

/** Legacy alias — prefer /api/cron/run-agents for new deployments. */
export async function GET(request: NextRequest) {
  return handleRunAgentsCron(request);
}

export async function POST(request: NextRequest) {
  return handleRunAgentsCron(request);
}

export const dynamic = "force-dynamic";
export const maxDuration = 300;
