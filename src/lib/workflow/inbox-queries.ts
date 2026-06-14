import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import { getContentWorkflow } from "@/lib/workflow/engine";
import {
  STAGE_BADGE,
  type FounderAttentionItem,
  type InboxItem,
  type InboxSection,
  type InboxTab,
  type WorkflowStage,
} from "@/lib/workflow/types";
import { getLiveIntelligenceAlerts } from "@/lib/intelligence/saved-alerts-queries";
import { inboxOutcome } from "@/lib/workflow/destinations";

export interface FounderInbox {
  ideas: InboxItem[];
  images: InboxItem[];
  videos: InboxItem[];
  replies: InboxItem[];
  calendar: InboxItem[];
  intelligence: InboxItem[];
  seo: InboxItem[];
  creators: InboxItem[];
  totalPending: number;
  tabCounts: Record<InboxTab, number>;
  attentionItems: FounderAttentionItem[];
}

function item(
  partial: Omit<InboxItem, "badge" | "ifApproved" | "ifRejected" | "currentOwner" | "nextOwner"> & {
    stage: WorkflowStage;
    section: InboxSection;
    whyAct?: string;
    currentOwner?: string;
    nextOwner?: string;
  }
): InboxItem {
  const approve = inboxOutcome(partial.section, "approve");
  const reject = inboxOutcome(partial.section, "reject");
  return {
    ...partial,
    badge: STAGE_BADGE[partial.stage],
    whyAct: partial.whyAct ?? "Founder decision required",
    currentOwner: partial.currentOwner ?? "founder",
    nextOwner:
      partial.nextOwner ??
      (partial.section === "ideas" ? "bloom" : partial.section === "replies" ? "sprout" : "atlas"),
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
        recommendedAction: "Review Image",
        nextAction: "Approve or reject",
        priority: "medium",
      })
    );
  }

  const { data: imagePromptRows } = await supabase
    .from("image_prompts")
    .select("id, title, prompt, status, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(20);

  for (const row of imagePromptRows ?? []) {
    images.push(
      item({
        id: row.id,
        section: "images",
        sourceTable: "image_prompts",
        sourceId: row.id,
        title: row.title || "Image concept",
        summary: row.prompt?.slice(0, 160) ?? "",
        stage: "PENDING_FOUNDER_ASSET_APPROVAL",
        href: `/images?tab=pending`,
        createdAt: row.created_at,
        recommendedAction: "Review Image",
        nextAction: "Approve or reject",
        priority: "medium",
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
        recommendedAction: "Review Video",
        nextAction: "Approve or send to Calendar",
        priority: "medium",
      })
    );
  }

  const { data: videoQueueRows } = await supabase
    .from("video_generation_queue")
    .select("id, title, concept, status, created_at")
    .in("status", ["pending", "review", "pending_review"])
    .order("created_at", { ascending: false })
    .limit(20);

  for (const row of videoQueueRows ?? []) {
    videos.push(
      item({
        id: row.id,
        section: "videos",
        sourceTable: "video_generation_queue",
        sourceId: row.id,
        title: row.title || "Video concept",
        summary: row.concept?.slice(0, 160) ?? "",
        stage: "PENDING_FOUNDER_ASSET_APPROVAL",
        href: `/video/item/${row.id}`,
        createdAt: row.created_at,
        recommendedAction: "Review Video",
        nextAction: "Approve concept",
        priority: "medium",
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
        stage: "PENDING_FOUNDER_REPLY_APPROVAL",
        href: `/replies`,
        channel: row.platform,
        createdAt: row.created_at,
        recommendedAction: "Draft Reply",
        nextAction: "Approve before posting",
        priority: "high",
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
        stage: "PENDING_FOUNDER_REPLY_APPROVAL",
        href: `/reddit`,
        channel: "Reddit",
        subreddit: row.subreddit,
        createdAt: row.created_at,
        recommendedAction: "Draft Reply",
        nextAction: "Approve before posting",
        priority: "high",
      })
    );
  }

  // SEO drafts awaiting founder review
  const seo: InboxItem[] = [];
  try {
    const { data: seoRows } = await supabase
      .from("seo_blog_posts")
      .select("id, headline, keyword, status, created_at")
      .in("status", ["gate_review", "voice_check_failed", "needs_revision", "draft", "pending_review"])
      .order("created_at", { ascending: false })
      .limit(30);

    for (const row of seoRows ?? []) {
      seo.push(
        item({
          id: row.id,
          section: "seo",
          sourceTable: "seo_blog_posts",
          sourceId: row.id,
          title: row.headline || row.keyword || "Blog draft",
          summary: `Keyword: ${row.keyword} · ${row.status}`,
          stage: row.status === "gate_review" ? "PENDING_FOUNDER_IDEA_APPROVAL" : "REVISION_REQUESTED",
          href: `/blog-pipeline`,
          channel: "SEO",
          createdAt: row.created_at,
          recommendedAction: "Review Draft",
          nextAction: "Approve for publish pipeline",
          priority: "medium",
        })
      );
    }
  } catch (e) {
    if (!isMissingTableError(e instanceof Error ? e : { message: String(e) })) throw e;
  }

  // Creator leads awaiting founder review
  const creators: InboxItem[] = [];
  try {
    const { data: leadRows } = await supabase
      .from("creator_leads")
      .select("id, name, handle, platform, priority, partnership_status, notes, created_at")
      .eq("status", "pending")
      .order("partnership_score", { ascending: false })
      .limit(20);

    for (const row of leadRows ?? []) {
      creators.push(
        item({
          id: row.id,
          section: "creators",
          sourceTable: "creator_leads",
          sourceId: row.id,
          title: row.name || row.handle,
          summary: row.notes?.slice(0, 160) ?? `${row.platform} creator lead`,
          stage: "PENDING_FOUNDER_IDEA_APPROVAL",
          href: `/creators`,
          channel: row.platform,
          createdAt: row.created_at,
          recommendedAction: "View Creator",
          nextAction: "Approve outreach draft",
          priority: row.priority ?? "medium",
        })
      );
    }
  } catch (e) {
    if (!isMissingTableError(e instanceof Error ? e : { message: String(e) })) throw e;
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

  const liveAlerts = await getLiveIntelligenceAlerts();
  for (const alert of liveAlerts) {
    intelligence.push(
      item({
        id: alert.id,
        section: "intelligence",
        sourceTable: "intelligence_alerts",
        sourceId: alert.id,
        title: alert.title.slice(0, 100) || alert.source,
        summary: alert.body.slice(0, 200),
        stage: "PENDING_FOUNDER_REPLY_APPROVAL",
        href: `/inbox?tab=intelligence`,
        channel: alert.subreddit ? `r/${alert.subreddit}` : alert.source,
        createdAt: alert.createdAt,
        sourceUrl: alert.url || undefined,
        sourceBody: alert.body,
        sourcePlatform: alert.source,
        subreddit: alert.subreddit || undefined,
        recommendedAction: alert.recommendedAction,
        matchedKeywords: alert.detectedKeywords,
        priority: alert.priority ?? "high",
        classification: alert.classification ?? undefined,
        whyAct: alert.relevanceReason || alert.classificationReason || "High-priority signal",
        nextAction: alert.classification === "seo_topic" ? "Send to SEO" : "Send to Bloom",
      })
    );
  }

  const tabCounts = computeTabCounts({ ideas, images, videos, replies, calendar, intelligence, seo, creators });
  const attentionItems = buildAttentionItems({ ideas, images, videos, replies, calendar, intelligence, seo, creators });
  const totalPending = attentionItems.length;

  return { ideas, images, videos, replies, calendar, intelligence, seo, creators, totalPending, tabCounts, attentionItems };
}

const ATTENTION_META: Record<InboxSection, { type: string; owner: string; defaultAction: string }> = {
  replies: { type: "Community Reply", owner: "Roots", defaultAction: "Draft Reply" },
  ideas: { type: "Content Idea", owner: "Bloom", defaultAction: "Review Idea" },
  images: { type: "Image Review", owner: "Moss", defaultAction: "Review Image" },
  videos: { type: "Video Review", owner: "Fern", defaultAction: "Review Video" },
  seo: { type: "SEO Draft", owner: "Bloom", defaultAction: "Review Draft" },
  creators: { type: "Creator Lead", owner: "Scout", defaultAction: "View Creator" },
  intelligence: { type: "Intelligence", owner: "Roots", defaultAction: "Review Signal" },
  calendar: { type: "Calendar", owner: "Atlas", defaultAction: "Schedule" },
};

export function buildAttentionItems(
  inbox: Pick<FounderInbox, "ideas" | "images" | "videos" | "replies" | "calendar" | "intelligence" | "seo" | "creators">
): FounderAttentionItem[] {
  const groups: InboxItem[][] = [
    inbox.replies,
    inbox.ideas,
    inbox.videos,
    inbox.images,
    inbox.seo,
    inbox.creators,
    inbox.intelligence,
    inbox.calendar,
  ];
  const items: FounderAttentionItem[] = [];
  for (const group of groups) {
    for (const row of group) {
      const meta = ATTENTION_META[row.section];
      items.push({
        id: `${row.section}-${row.id}`,
        title: row.title,
        type: meta.type,
        priority: row.priority ?? "medium",
        owner: row.currentOwner ?? meta.owner,
        nextAction: row.nextAction ?? row.recommendedAction ?? meta.defaultAction,
        href: row.href,
        section: row.section,
      });
    }
  }
  return items.sort((a, b) => {
    const pri = (p: string) => (p === "high" ? 0 : p === "medium" ? 1 : 2);
    return pri(a.priority) - pri(b.priority);
  });
}

function computeTabCounts(
  inbox: Pick<FounderInbox, "ideas" | "images" | "videos" | "replies" | "calendar" | "intelligence" | "seo" | "creators">
): Record<InboxTab, number> {
  const replyIntel = inbox.intelligence.filter(
    (i) => i.classification === "community_opportunity" || i.recommendedAction?.toLowerCase().includes("reply")
  );
  const pureIntel = inbox.intelligence.filter((i) => !replyIntel.some((r) => r.id === i.id));
  const allCount =
    inbox.ideas.length +
    inbox.images.length +
    inbox.videos.length +
    inbox.replies.length +
    inbox.seo.length +
    inbox.creators.length +
    inbox.intelligence.length +
    inbox.calendar.length;

  return {
    all: allCount,
    replies: inbox.replies.length + replyIntel.length,
    ideas: inbox.ideas.length,
    videos: inbox.videos.length,
    images: inbox.images.length,
    seo: inbox.seo.length,
    creators: inbox.creators.length,
    intelligence: pureIntel.length,
  };
}

export function filterInboxByTab(tab: InboxTab, inbox: FounderInbox): InboxItem[] {
  const replyIntel = inbox.intelligence.filter(
    (i) => i.classification === "community_opportunity" || i.recommendedAction?.toLowerCase().includes("reply")
  );
  const pureIntel = inbox.intelligence.filter((i) => !replyIntel.some((r) => r.id === i.id));

  switch (tab) {
    case "replies":
      return [...inbox.replies, ...replyIntel];
    case "ideas":
      return inbox.ideas;
    case "videos":
      return inbox.videos;
    case "images":
      return inbox.images;
    case "seo":
      return inbox.seo;
    case "creators":
      return inbox.creators;
    case "intelligence":
      return pureIntel;
    case "all":
    default:
      return [
        ...inbox.replies,
        ...inbox.ideas,
        ...inbox.videos,
        ...inbox.images,
        ...inbox.seo,
        ...inbox.creators,
        ...inbox.intelligence,
        ...inbox.calendar,
      ];
  }
}
