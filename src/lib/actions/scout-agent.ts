"use server";

import { revalidateDashboard } from "@/lib/actions/shared";
import { runScoutAgent } from "@/lib/agents/scout/run-scout-agent";
import { createServerClient } from "@/lib/supabase/server";
import type { CreatorPartnershipStatus, Status } from "@/lib/types";

export type ScoutRunActionResult =
  | { ok: true; creatorsFound: number; highPriority: number; partnershipsRecommended: number; approvalQueueCount: number }
  | { ok: false; error: string };

export async function runScoutDiscovery(): Promise<ScoutRunActionResult> {
  try {
    const result = await runScoutAgent();
    await revalidateDashboard();
    return { ok: true, ...result };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Scout agent failed" };
  }
}

export async function updateCreatorLead(
  id: string,
  input: Partial<{
    partnershipStatus: CreatorPartnershipStatus;
    notes: string;
    status: Status;
  }>
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("creator_leads")
      .update({
        ...(input.partnershipStatus && { partnership_status: input.partnershipStatus }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.status && { status: input.status }),
      })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    await revalidateDashboard();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Update failed" };
  }
}

export async function approveCreatorLead(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await updateCreatorLead(id, { status: "approved", partnershipStatus: "outreach_pending" });
  if (!result.ok) return result;

  const supabase = createServerClient();
  await supabase.from("approval_queue").update({ status: "approved" }).eq("source_id", id);
  await revalidateDashboard();
  return { ok: true };
}

export async function rejectCreatorLead(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await updateCreatorLead(id, { status: "rejected", partnershipStatus: "declined" });
  if (!result.ok) return result;

  const supabase = createServerClient();
  await supabase.from("approval_queue").update({ status: "rejected" }).eq("source_id", id);
  await revalidateDashboard();
  return { ok: true };
}
