"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import {
  syncApprovalQueueItemToCalendar,
  syncBloomPieceToCalendar,
} from "@/lib/content-calendar/sync";
import { recordHandoff } from "@/lib/collaboration/handoff";
import { createNotification } from "@/lib/notifications/create";
import { transitionContentWorkflow } from "@/lib/workflow/engine";
import { destinationForIdeaApprove, destinationForReject } from "@/lib/workflow/destinations";
import { founderSafeError } from "@/lib/integrations/founder-safe-error";
import type { MarketingTable, Status } from "@/lib/types";

export type ActionResult =
  | { ok: true; message?: string; destination?: string; nextOwner?: string; nextStep?: string }
  | { ok: false; error: string };

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

      // Phase 28: approved work actively moves to Sprout for scheduling
      if (approved && (table === "approval_queue" || table === "bloom_content_pieces")) {
        await recordHandoff({
          fromAgent: "gate",
          toAgent: "sprout",
          workflowName: "Gate → Sprout",
          triggerType: "gate_approval",
          triggerId: id,
          taskType: "schedule_post",
          taskDescription: "Gate approved a content item — schedule it and build the publishing package.",
          priority: "medium",
          messageTitle: "Approved content ready for scheduling",
          messageBody: "A content item cleared Gate review. Run Sprout to slot it at the best posting time.",
          activityDetail: "Gate approved content and handed it to Sprout",
          metadata: { source_table: table, source_id: id },
        }).catch(() => undefined);
      }
    }

    await revalidateDashboard();

    if (status === "approved") {
      const dest = table === "creative_content_ideas" ? destinationForIdeaApprove() : null;
      if (dest) {
        await transitionContentWorkflow({
          sourceTable: table,
          sourceId: id,
          toStage: dest.stage,
          event: dest.toast,
          actor: "founder",
          agent: dest.nextOwner,
          destinationLabel: dest.strip,
          currentOwner: dest.nextOwner,
        }).catch(() => undefined);
        await createNotification({
          type: "agent_completed",
          title: "Idea approved",
          message: dest.toast,
          targetRoute: "/content",
          targetTable: table,
          targetId: id,
        });
        return {
          ok: true,
          message: dest.toast,
          destination: dest.destination,
          nextOwner: dest.nextOwner,
          nextStep: dest.nextStep,
        };
      }
      if (table === "approval_queue") {
        await createNotification({
          type: "calendar_ready",
          title: "Content approved",
          message: "Approved. Moved to Calendar as Ready to Publish.",
          targetRoute: "/calendar",
          targetTable: table,
          targetId: id,
        });
        return {
          ok: true,
          message: "Approved. Moved to Calendar as Ready to Publish.",
          destination: "Calendar",
          nextOwner: "Sprout",
          nextStep: "Schedule publish slot",
        };
      }
    }

    if (status === "rejected") {
      const dest = destinationForReject("sage", "content");
      await createNotification({
        type: "revision_ready",
        title: "Revision requested",
        message: dest.toast,
        targetRoute: "/inbox",
        targetTable: table,
        targetId: id,
      });
      return {
        ok: true,
        message: dest.toast,
        destination: dest.destination,
        nextOwner: dest.nextOwner,
      };
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: founderSafeError(e instanceof Error ? e.message : "Unknown error") };
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
