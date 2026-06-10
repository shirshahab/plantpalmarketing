import { NextRequest, NextResponse } from "next/server";
import { runScheduledAgentBatch } from "@/lib/agent-worker/worker";
import { isAuthorizedCron } from "@/lib/cron/auth";

export async function handleRunAgentsCron(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  if (!isAuthorizedCron(request, secret)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const batch = await runScheduledAgentBatch("cron");
    const itemsCreated = batch.triggered
      .filter((t) => t.status === "success")
      .reduce((sum, t) => sum + t.itemsProcessed, 0);

    return NextResponse.json({
      ok: true,
      summary: {
        ran: batch.triggered.length,
        skipped: batch.skipped.length,
        succeeded: batch.triggered.filter((t) => t.status === "success").length,
        failed: batch.triggered.filter((t) => t.status === "failed").length,
        itemsCreated,
      },
      triggered: batch.triggered.map((t) => ({
        agent: t.agentId,
        status: t.status,
        itemsCreated: t.itemsProcessed,
        durationMs: t.durationMs,
        error: t.error,
      })),
      skipped: batch.skipped,
      errors: batch.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Cron batch failed" },
      { status: 500 }
    );
  }
}
