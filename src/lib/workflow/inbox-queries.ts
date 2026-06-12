import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import { getContentWorkflow } from "@/lib/workflow/engine";
import {
  STAGE_BADGE,
  type InboxItem,
  type InboxSection,
  type WorkflowStage,
} from "@/lib/workflow/types";
import { getHighPriorityF5BotInboxAlerts } from "@/lib/intelligence/queries";
import { inboxOutcome } from "@/lib/workflow/destinations";

export interface FounderInbox {
  ideas: InboxItem[];
  images: InboxItem[];
  videos: InboxItem[];
  replies: InboxItem[];
  calendar: InboxItem[];
  intelligence: InboxItem[];
  totalPending: number;
}

function item(
  partial: Omit<InboxItem, "badge" | "ifApproved" | "ifRejected" | "whyAct" | "currentOwner" | "nextOwner"> & {
    stage: WorkflowStage;
    section: InboxSection;
  }
): InboxItem {
  const approve = inboxOutcome(partial.section, "approve");
  const reject = inboxOutcome(partial.section, "reject");
  return {
    ...partial,
    badge: STAGE_BADGE[partial.stage],
    whyAct: "Founder decision required",
    currentOwner: "founder",
    nextOwner: partial.section === "ideas" ? "bloom" : partial.section === "replies" ? "sprout" : "atlas",
    ifApproved: approve.detail,
    ifRejected: reject.detail,
  };
}

async function stageFor(sourceTable: string, sourceId: string, fallback: WorkflowStage): Promise<WorkflowStage> {
  const wf = await getContentWorkflow(sourceTable, sourceId);
  return wf?.currentStage ?? fallback;
}

/**
 * Phase 39 — Founder Inbox: every item that needs founder action, grouped.
 */
export async function getFounderInbox(): Promise<FounderInbox> {
  const supabase = createServerClient();
  const ideas: InboxItem[] = [];
  const images: InboxItem[] = [];
  const videos: InboxItem[] = [];
  const replies: InboxItem[] = [];
  const calendar: InboxItem[] = [];
  const intelligence: InboxItem[] = [];

  // Ideas awaiting approval — creative_content_ideas + approval_queue content types
  const [{ data: ideaRows }, { data: queueRows }] = await Promise.all([
    supabase
      .from("creative_content_ideas")
      .select("id, title, hook, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("approval_queue")
      .select("id, type, channel, draft, status, created_at")
      .eq("status", "pending")
      .in("type", ["content", "social_post"])
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  for (const row of ideaRows ?? []) {
    const stage = await stageFor("creative_content_ideas", row.id, "PENDING_FOUNDER_IDEA_APPROVAL");
    ideas.push(
      item({
        id: row.id,
        section: "ideas",
        sourceTable: "creative_content_ideas",
        sourceId: row.id,
        title: row.title || row.hook?.slice(0, 80) || "Content idea",
        summary: row.hook ?? "",
        stage,
        href: `/content?highlight=${row.id}`,
        createdAt: row.created_at,
      })
    );
  }

  for (const row of queueRows ?? []) {
    const stage = await stageFor("approval_queue", row.id, "PENDING_FOUNDER_IDEA_APPROVAL");
    ideas.push(
      item({
        id: row.id,
        section: "ideas",
        sourceTable: "approval_queue",
        sourceId: row.id,
        title: `${row.type} — ${row.channel}`,
        summary: (row.draft ?? "").slice(0, 200),
        stage,
        href: `/approvals?item=${row.id}`,
        channel: row.channel,
        createdAt: row.created_at,
      })
    );
  }

  // Images awaiting approval
  const { data: assetRows } = await supabase
    .from("generated_assets")
    .select("id, platform, prompt, status, metadata, created_at")
    .in("status", ["generated", "package_ready"])
    .order("created_at", { ascending: false })
    .limit(30);

  for (const row of assetRows ?? []) {
    const meta = (row.metadata as Record<string, unknown>) ?? {};
    const stage = await stageFor("generated_assets", row.id, "PENDING_FOUNDER_ASSET_APPROVAL");
    images.push(
      item({
        id: row.id,
        section: "images",
        sourceTable: "generated_assets",
        sourceId: row.id,
        title: String(meta.title ?? "Image asset"),
        summary: row.prompt?.slice(0, 160) ?? "",
        stage,
        href: `/images?asset=${row.id}`,
        channel: row.platform,
        createdAt: row.created_at,
      })
    );
  }

  // Videos awaiting approval
  const { data: videoRows } = await supabase
    .from("generated_videos")
    .select("id, platform, hook, status, metadata, created_at")
    .in("status", ["generated", "generated_not_uploaded", "package_ready"])
    .order("created_at", { ascending: false })
    .limit(30);

  for (const row of videoRows ?? []) {
    const meta = (row.metadata as Record<string, unknown>) ?? {};
    const stage = await stageFor("generated_videos", row.id, "PENDING_FOUNDER_ASSET_APPROVAL");
    videos.push(
      item({
        id: row.id,
        section: "videos",
        sourceTable: "generated_videos",
        sourceId: row.id,
        title: String(meta.title ?? row.hook?.slice(0, 80) ?? "Video package"),
        summary: row.hook ?? "",
        stage,
        href: `/video?video=${row.id}`,
        channel: row.platform,
        createdAt: row.created_at,
      })
    );
  }

  // Community + Reddit replies
  const [{ data: communityReplies }, { data: redditReplies }] = await Promise.all([
    supabase
      .from("community_reply_drafts")
      .select("id, platform, author, draft, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("reddit_reply_drafts")
      .select("id, subreddit, draft_reply, created_at")
      .eq("status", "pending_approval")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  for (const row of communityReplies ?? []) {
    replies.push(
      item({
        id: row.id,
        section: "replies",
        sourceTable: "community_reply_drafts",
        sourceId: row.id,
        title: `Reply to ${row.author}`,
        summary: row.draft?.slice(0, 200) ?? "",
        stage: "PENDING_FOUNDER_IDEA_APPROVAL",
        href: `/replies?draft=${row.id}`,
        channel: row.platform,
        createdAt: row.created_at,
      })
    );
  }

  for (const row of redditReplies ?? []) {
    replies.push(
      item({
        id: row.id,
        section: "replies",
        sourceTable: "reddit_reply_drafts",
        sourceId: row.id,
        title: `Reddit reply — r/${row.subreddit}`,
        summary: row.draft_reply?.slice(0, 200) ?? "",
        stage: "PENDING_FOUNDER_IDEA_APPROVAL",
        href: `/reddit?draft=${row.id}`,
        channel: "Reddit",
        createdAt: row.created_at,
      })
    );
  }

  // Calendar items awaiting scheduling
  try {
    const { data: calRows } = await supabase
      .from("content_calendar")
      .select("id, title, platform, status, caption, created_at")
      .in("status", ["approved", "ready_to_publish"])
      .order("created_at", { ascending: false })
      .limit(30);

    for (const row of calRows ?? []) {
      const stage = await stageFor("content_calendar", row.id, "CALENDAR_READY");
      calendar.push(
        item({
          id: row.id,
          section: "calendar",
          sourceTable: "content_calendar",
          sourceId: row.id,
          title: row.title ?? "Calendar item",
          summary: row.caption?.slice(0, 160) ?? "",
          stage,
          href: `/calendar?item=${row.id}`,
          channel: row.platform,
          createdAt: row.created_at,
        })
      );
    }
  } catch (e) {
    if (!isMissingTableError(e instanceof Error ? e : { message: String(e) })) throw e;
  }

  const f5botAlerts = await getHighPriorityF5BotInboxAlerts();
  for (const alert of f5botAlerts) {
    if (alert.status !== "new") continue;
    intelligence.push(
      item({
        id: alert.id,
        section: "intelligence",
        sourceTable: "f5bot_alerts",
        sourceId: alert.id,
        title: alert.title.slice(0, 100) || `${alert.source}: ${alert.matchedKeyword}`,
        summary: alert.body.slice(0, 200),
        stage: "PENDING_FOUNDER_REPLY_APPROVAL",
        href: `/intelligence?alert=${alert.id}`,
        channel: alert.source,
        createdAt: alert.receivedAt,
      })
    );
  }

  const totalPending =
    ideas.length + images.length + videos.length + replies.length + calendar.length + intelligence.length;
  return { ideas, images, videos, replies, calendar, intelligence, totalPending };
}
