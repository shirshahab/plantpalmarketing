"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidateDashboard } from "@/lib/actions/shared";
import type { ActionResult } from "@/lib/actions/shared";
import type { ApprovalItemType, Status } from "@/lib/types";

export async function createApprovalItem(input: {
  type: ApprovalItemType;
  channel: string;
  draft: string;
  status?: Status;
}): Promise<ActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("approval_queue").insert({
      type: input.type,
      channel: input.channel,
      draft: input.draft,
      status: input.status ?? "pending",
    });
    if (error) return { ok: false, error: error.message };
    await revalidateDashboard();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateApprovalItem(
  id: string,
  input: Partial<{ channel: string; draft: string; status: Status }>
): Promise<ActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("approval_queue").update(input).eq("id", id);
    if (error) return { ok: false, error: error.message };
    await revalidateDashboard();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
