"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import {
  syncApprovalQueueItemToCalendar,
  syncBloomPieceToCalendar,
} from "@/lib/content-calendar/sync";
import type { MarketingTable, Status } from "@/lib/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function revalidateDashboard() {
  revalidatePath("/", "layout");
}

async function updateStatusOnTable(
  table: MarketingTable,
  id: string,
  status: Status
): Promise<{ error: { message: string } | null }> {
  const supabase = createServerClient();

  switch (table) {
    case "content_ideas":
      return supabase.from("content_ideas").update({ status }).eq("id", id);
    case "creative_content_ideas":
      return supabase.from("creative_content_ideas").update({ status }).eq("id", id);
    case "social_posts":
      return supabase.from("social_posts").update({ status }).eq("id", id);
    case "image_prompts":
      return supabase.from("image_prompts").update({ status }).eq("id", id);
    case "video_scripts":
      return supabase.from("video_scripts").update({ status }).eq("id", id);
    case "community_opportunities":
      return supabase.from("community_opportunities").update({ status }).eq("id", id);
    case "reply_drafts":
      return supabase.from("reply_drafts").update({ status }).eq("id", id);
    case "approval_queue":
      return supabase.from("approval_queue").update({ status }).eq("id", id);
    case "creators":
      return supabase.from("creators").update({ status }).eq("id", id);
    case "partnerships":
      return supabase.from("partnerships").update({ status }).eq("id", id);
    case "competitor_alerts":
      return { error: { message: "Competitor alerts do not support status updates" } };
    case "pipeline_content":
      return { error: { message: "Use updatePipelineStatus for pipeline content" } };
    case "creator_leads":
      return supabase.from("creator_leads").update({ status }).eq("id", id);
    case "community_reply_drafts":
      return supabase.from("community_reply_drafts").update({ status }).eq("id", id);
    case "creator_partnerships":
      return supabase.from("creator_partnerships").update({ status }).eq("id", id);
    case "competitor_intel_alerts":
      return supabase.from("competitor_intel_alerts").update({ status }).eq("id", id);
    case "competitor_scoreboard":
      return { error: { message: "Scoreboard entries are not status-updated" } };
    case "bloom_content_pieces":
      return supabase.from("bloom_content_pieces").update({ status }).eq("id", id);
    case "bloom_production_runs":
      return { error: { message: "Production runs are not status-updated via this action" } };
    case "oak_partnership_pipeline":
      return { error: { message: "Use updateOakDealStage for pipeline deals" } };
    default:
      return { error: { message: "Unknown table" } };
  }
}

async function deleteFromTable(
  table: MarketingTable,
  id: string
): Promise<{ error: { message: string } | null }> {
  const supabase = createServerClient();

  switch (table) {
    case "content_ideas":
      return supabase.from("content_ideas").delete().eq("id", id);
    case "creative_content_ideas":
      return supabase.from("creative_content_ideas").delete().eq("id", id);
    case "social_posts":
      return supabase.from("social_posts").delete().eq("id", id);
    case "image_prompts":
      return supabase.from("image_prompts").delete().eq("id", id);
    case "video_scripts":
      return supabase.from("video_scripts").delete().eq("id", id);
    case "community_opportunities":
      return supabase.from("community_opportunities").delete().eq("id", id);
    case "reply_drafts":
      return supabase.from("reply_drafts").delete().eq("id", id);
    case "creators":
      return supabase.from("creators").delete().eq("id", id);
    case "partnerships":
      return supabase.from("partnerships").delete().eq("id", id);
    case "competitor_alerts":
      return supabase.from("competitor_alerts").delete().eq("id", id);
    case "approval_queue":
      return supabase.from("approval_queue").delete().eq("id", id);
    case "pipeline_content":
      return supabase.from("pipeline_content").delete().eq("id", id);
    case "creator_leads":
      return supabase.from("creator_leads").delete().eq("id", id);
    case "creator_partnerships":
      return supabase.from("creator_partnerships").delete().eq("id", id);
    case "community_reply_drafts":
      return supabase.from("community_reply_drafts").delete().eq("id", id);
    case "competitor_intel_alerts":
      return supabase.from("competitor_intel_alerts").delete().eq("id", id);
    case "competitor_scoreboard":
      return { error: { message: "Cannot delete scoreboard entries" } };
    default:
      return { error: { message: "Unknown table" } };
  }
}

export async function updateStatus(
  table: MarketingTable,
  id: string,
  status: Status
): Promise<ActionResult> {
  try {
    const { error } = await updateStatusOnTable(table, id, status);
    if (error) return { ok: false, error: error.message };

    // Phase 25: Gate approvals/rejections flow onto the content calendar
    if (status === "approved" || status === "rejected") {
      const approved = status === "approved";
      if (table === "approval_queue") {
        await syncApprovalQueueItemToCalendar(id, approved);
      } else if (table === "bloom_content_pieces") {
        await syncBloomPieceToCalendar(id, { approved });
      }
    }

    await revalidateDashboard();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteRecord(
  table: MarketingTable,
  id: string
): Promise<ActionResult> {
  try {
    const { error } = await deleteFromTable(table, id);
    if (error) return { ok: false, error: error.message };
    await revalidateDashboard();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function approveRecord(table: MarketingTable, id: string) {
  return updateStatus(table, id, "approved");
}

export async function rejectRecord(table: MarketingTable, id: string) {
  return updateStatus(table, id, "rejected");
}
