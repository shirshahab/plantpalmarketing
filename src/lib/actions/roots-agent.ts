"use server";

import { revalidateDashboard } from "@/lib/actions/shared";
import { runRootsAgent } from "@/lib/agents/roots/run-roots-agent";
import { createServerClient } from "@/lib/supabase/server";
import type { Status } from "@/lib/types";

export type RootsRunActionResult =
  | { ok: true; mentionsFound: number; opportunitiesCreated: number; repliesDrafted: number; approvalQueueCount: number }
  | { ok: false; error: string };

export async function runRootsListening(): Promise<RootsRunActionResult> {
  try {
    const result = await runRootsAgent();
    await revalidateDashboard();
    return { ok: true, ...result };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Roots agent failed" };
  }
}

export async function updateCommunityReplyDraft(
  id: string,
  input: Partial<{ draft: string; status: Status }>
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("community_reply_drafts")
      .update({
        ...(input.draft !== undefined && { draft: input.draft }),
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

export async function approveCommunityReply(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createServerClient();

  const { data: draft } = await supabase
    .from("community_reply_drafts")
    .select("opportunity_id, draft")
    .eq("id", id)
    .single();

  await updateCommunityReplyDraft(id, { status: "approved" });
  await supabase.from("approval_queue").update({ status: "approved" }).eq("source_id", id);

  if (draft?.opportunity_id) {
    await supabase
      .from("community_opportunities")
      .update({ status: "approved", suggested_reply: draft.draft })
      .eq("id", draft.opportunity_id);
  }

  await revalidateDashboard();
  return { ok: true };
}

export async function rejectCommunityReply(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await updateCommunityReplyDraft(id, { status: "rejected" });

  const supabase = createServerClient();
  await supabase.from("approval_queue").update({ status: "rejected" }).eq("source_id", id);

  const { data: draft } = await supabase
    .from("community_reply_drafts")
    .select("opportunity_id")
    .eq("id", id)
    .single();

  if (draft?.opportunity_id) {
    await supabase.from("community_opportunities").update({ status: "rejected" }).eq("id", draft.opportunity_id);
  }

  await revalidateDashboard();
  return { ok: true };
}
