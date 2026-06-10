import { NextRequest, NextResponse } from "next/server";
import { runScheduledAgentBatch } from "@/lib/agent-worker/worker";

/**
 * Vercel Cron entrypoint — runs hourly, executes agents whose next_run_at has passed.
 *
 * Deploy:
 * 1. Set CRON_SECRET in Vercel env (and .env.local for local testing)
 * 2. vercel.json schedules this route at "0 * * * *" (every hour)
 *
 * Supabase Edge Functions alternative:
 * - Create a scheduled Edge Function that POSTs to this URL with Authorization header
 * - Or port runScheduledAgentBatch() into Deno with @supabase/supabase-js
 *
 * Security: requires Authorization: Bearer <CRON_SECRET>
 * No autonomous posting or outreach — agents only scan, draft, and queue for human approval.
 */
function isAuthorizedCron(request: NextRequest, secret: string): boolean {
  const auth = request.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (bearer === secret) return true;
  // Vercel Cron also sends CRON_SECRET when configured in project env
  const cronHeader = request.headers.get("x-vercel-cron-secret");
  if (cronHeader === secret) return true;
  return false;
}

async function handleCron(request: NextRequest) {
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

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

export const dynamic = "force-dynamic";
export const maxDuration = 300;
