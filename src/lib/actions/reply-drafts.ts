"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import type { ActionResult } from "@/lib/actions/shared";

export interface SaveReplyDraftInput {
  sourceType: string;
  sourceId: string;
  sourceUrl: string;
  sourceTitle: string;
  sourceBody: string;
  platform?: string;
  subreddit?: string;
  suggestedReply: string;
  editedReply: string;
  draftId?: string;
}

export async function saveReplyDraftAction(input: SaveReplyDraftInput): Promise<ActionResult & { draftId?: string }> {
  try {
    const supabase = createServerClient();
    const now = new Date().toISOString();
    const row = {
      platform: input.platform ?? "reddit",
      original_post: input.sourceBody.slice(0, 4000),
      draft: input.editedReply.trim() || input.suggestedReply,
      suggested_reply: input.suggestedReply,
      edited_reply: input.editedReply.trim() || input.suggestedReply,
      source_type: input.sourceType,
      source_id: input.sourceId,
      source_url: input.sourceUrl,
      source_title: input.sourceTitle,
      source_platform: input.platform ?? "reddit",
      source_subreddit: input.subreddit ?? "",
      subreddit: input.subreddit ?? "",
      data_source: "f5bot",
      status: "draft",
      updated_at: now,
    };

    if (input.draftId) {
      const { error } = await supabase.from("reply_drafts").update(row).eq("id", input.draftId);
      if (error) return { ok: false, error: error.message };
      revalidatePaths();
      return { ok: true, message: "Reply draft saved.", draftId: input.draftId };
    }

    const { data: existing } = await supabase
      .from("reply_drafts")
      .select("id")
      .eq("source_type", input.sourceType)
      .eq("source_id", input.sourceId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from("reply_drafts").update(row).eq("id", existing.id);
      if (error) return { ok: false, error: error.message };
      revalidatePaths();
      return { ok: true, message: "Reply draft saved.", draftId: String(existing.id) };
    }

    const { data: inserted, error: insertError } = await supabase
      .from("reply_drafts")
      .insert(row)
      .select("id")
      .single();

    if (insertError) {
      if (isMissingTableError(insertError)) return { ok: false, error: "reply_drafts table missing. Run migration 067." };
      return { ok: false, error: insertError.message };
    }

    revalidatePaths();
    return { ok: true, message: "Reply draft saved.", draftId: String(inserted.id) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Save failed" };
  }
}

export async function sendReplyDraftToApprovalAction(draftId: string): Promise<ActionResult> {
  try {
    const supabase = createServerClient();
    const { data: draft, error: fetchError } = await supabase
      .from("reply_drafts")
      .select("*")
      .eq("id", draftId)
      .maybeSingle();
    if (fetchError || !draft) return { ok: false, error: fetchError?.message ?? "Draft not found" };

    const { error } = await supabase
      .from("reply_drafts")
      .update({ status: "pending", updated_at: new Date().toISOString() })
      .eq("id", draftId);
    if (error) return { ok: false, error: error.message };

    await supabase.from("approval_queue").insert({
      type: "community_reply",
      channel: String(draft.platform ?? "reddit"),
      draft: `Reply draft for ${draft.source_title || "community post"}\n\n${draft.edited_reply || draft.draft}`,
      status: "pending",
      source_id: draftId,
    });

    revalidatePaths();
    return { ok: true, message: "Sent to approval queue." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function archiveReplyDraftSourceAction(
  sourceType: string,
  sourceId: string
): Promise<ActionResult> {
  if (sourceType === "intelligence_alerts") {
    const { archiveIntelligenceAlertAction } = await import("@/lib/actions/intelligence-alerts");
    return archiveIntelligenceAlertAction(sourceId);
  }
  return { ok: true, message: "Archived." };
}

function revalidatePaths() {
  revalidatePath("/inbox");
  revalidatePath("/replies");
  revalidatePath("/");
}
