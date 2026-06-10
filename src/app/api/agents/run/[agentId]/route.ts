import { NextRequest, NextResponse } from "next/server";
import { runAgentManually } from "@/lib/agent-worker/worker";
import { SCHEDULABLE_AGENTS, type SchedulableAgent } from "@/lib/agent-worker/types";

/**
 * Manual agent run — requires authenticated session (middleware).
 * Outputs still route to approval_queue; no auto-posting or outreach.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;

  if (!SCHEDULABLE_AGENTS.includes(agentId as SchedulableAgent)) {
    return NextResponse.json(
      { ok: false, error: `Unknown or non-schedulable agent: ${agentId}` },
      { status: 400 }
    );
  }

  try {
    const result = await runAgentManually(agentId as SchedulableAgent);
    return NextResponse.json({
      ok: result.status !== "failed",
      agent: result.agentId,
      runId: result.runId,
      status: result.status,
      itemsProcessed: result.itemsProcessed,
      durationMs: result.durationMs,
      error: result.error ?? null,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Manual run failed" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
export const maxDuration = 300;
