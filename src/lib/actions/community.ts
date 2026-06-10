"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidateDashboard } from "@/lib/actions/shared";
import type { ActionResult } from "@/lib/actions/shared";
import type { Platform, Status } from "@/lib/types";

export async function createCommunityOpportunity(input: {
  platform: Platform;
  author: string;
  post: string;
  topic: string;
  urgencyScore: number;
  suggestedReply: string;
  status?: Status;
}): Promise<ActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("community_opportunities").insert({
      platform: input.platform,
      author: input.author,
      post: input.post,
      topic: input.topic,
      urgency_score: input.urgencyScore,
      suggested_reply: input.suggestedReply,
      status: input.status ?? "pending",
    });
    if (error) return { ok: false, error: error.message };
    await revalidateDashboard();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateCommunityOpportunity(
  id: string,
  input: Partial<{
    suggestedReply: string;
    status: Status;
  }>
): Promise<ActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("community_opportunities")
      .update({
        ...(input.suggestedReply !== undefined && { suggested_reply: input.suggestedReply }),
        ...(input.status !== undefined && { status: input.status }),
      })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    await revalidateDashboard();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
