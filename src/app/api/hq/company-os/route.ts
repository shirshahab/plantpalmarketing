import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Phase 31A — Company OS pulse for the living HQ.
 * Drives the station-state visuals: Gate turns amber when work is blocked,
 * the Launch Gate lights up when content is ready, and the Executive Garden
 * pulses when the founder has urgent actions.
 */
export async function GET() {
  const pulse = {
    ok: true,
    blockedWorkflows: 0,
    gateBlocked: false,
    readyToPublish: 0,
    urgentFounderActions: 0,
    activeWorkflows: 0,
  };

  try {
    const supabase = createServerClient();
    const [blockedRes, activeRes, readyRes, approvalsRes, decisionsRes] = await Promise.allSettled([
      supabase.from("company_workflows").select("current_agent", { count: "exact" }).eq("status", "blocked").limit(20),
      supabase.from("company_workflows").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("content_calendar").select("*", { count: "exact", head: true }).eq("status", "ready_to_publish"),
      supabase.from("approval_queue").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase
        .from("company_outputs")
        .select("*", { count: "exact", head: true })
        .eq("approval_required", true)
        .in("status", ["created", "pending_approval"]),
    ]);

    if (blockedRes.status === "fulfilled" && !blockedRes.value.error) {
      pulse.blockedWorkflows = blockedRes.value.count ?? 0;
      pulse.gateBlocked =
        (blockedRes.value.data ?? []).some((w) => w.current_agent === "gate") || pulse.blockedWorkflows > 0;
    }
    if (activeRes.status === "fulfilled" && !activeRes.value.error) {
      pulse.activeWorkflows = activeRes.value.count ?? 0;
    }
    if (readyRes.status === "fulfilled" && !readyRes.value.error) {
      pulse.readyToPublish = readyRes.value.count ?? 0;
    }
    const approvals = approvalsRes.status === "fulfilled" && !approvalsRes.value.error ? (approvalsRes.value.count ?? 0) : 0;
    const decisions = decisionsRes.status === "fulfilled" && !decisionsRes.value.error ? (decisionsRes.value.count ?? 0) : 0;
    pulse.urgentFounderActions = approvals + decisions;
  } catch {
    // never crash the HQ — return zeros
  }

  return NextResponse.json(pulse, {
    status: 200,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
