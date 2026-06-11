import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import {
  syncApprovalQueueItemToCalendar,
  syncBloomPieceToCalendar,
  syncXQueueItemToCalendar,
  mapToCalendarPlatform,
} from "@/lib/content-calendar/sync";
import { advanceXQueueStatus } from "@/lib/integrations/x-service";
import type { Json } from "@/lib/supabase/database.types";
import type {
  AutomationAction,
  AutomationRiskLevel,
  BatchApprovalItemType,
} from "@/lib/types";

export interface DefaultRule {
  ruleKey: string;
  label: string;
  description: string;
  agentId: string;
  category: string;
  riskLevel: AutomationRiskLevel;
  action: AutomationAction;
}

/** Mirrors the migration 044 seed — used as fallback before the table exists. */
export const DEFAULT_AUTOMATION_RULES: DefaultRule[] = [
  { ruleKey: "internal_reports", label: "Internal reports & briefs", description: "Daily reports and executive briefs generate automatically — no approval needed.", agentId: "ivy", category: "reporting", riskLevel: "low", action: "auto_approve" },
  { ruleKey: "content_ideas", label: "Content ideas & discovery", description: "Scout/Roots/Sentinel/Weather opportunities flow into Bloom automatically.", agentId: "bloom", category: "discovery", riskLevel: "low", action: "auto_approve" },
  { ruleKey: "calendar_scheduling", label: "Calendar scheduling", description: "Approved content is auto-assigned the best posting time slot.", agentId: "sprout", category: "scheduling", riskLevel: "low", action: "auto_approve" },
  { ruleKey: "content_drafts", label: "Content drafts", description: "Bloom drafts are auto-created on the content calendar for review.", agentId: "bloom", category: "production", riskLevel: "low", action: "auto_approve" },
  { ruleKey: "asset_prompts", label: "Asset prompts", description: "Asset/thumbnail prompts are auto-generated inside publishing packages.", agentId: "bloom", category: "production", riskLevel: "low", action: "auto_approve" },
  { ruleKey: "task_creation", label: "Agent task creation", description: "Phase 28 — agents automatically create the next agent's task when work enters their area (Scout→Oak, Roots→Bloom, Bloom→Sage, Sage→Gate, Gate→Sprout, Sentinel→Atlas, Echo/Fern→Atlas/Ivy).", agentId: "ivy", category: "pipeline", riskLevel: "low", action: "auto_approve" },
  { ruleKey: "tiktok_captions", label: "TikTok captions & scripts", description: "TikTok packages wait in the daily batch approval inbox.", agentId: "bloom", category: "publishing", riskLevel: "medium", action: "batch_approval" },
  { ruleKey: "instagram_captions", label: "Instagram captions & carousels", description: "Instagram packages wait in the daily batch approval inbox.", agentId: "bloom", category: "publishing", riskLevel: "medium", action: "batch_approval" },
  { ruleKey: "youtube_titles", label: "YouTube Shorts titles", description: "YouTube Shorts packages wait in the daily batch approval inbox.", agentId: "bloom", category: "publishing", riskLevel: "medium", action: "batch_approval" },
  { ruleKey: "blog_drafts", label: "Blog drafts", description: "Blog drafts wait in the daily batch approval inbox.", agentId: "bloom", category: "publishing", riskLevel: "medium", action: "batch_approval" },
  { ruleKey: "public_replies", label: "Public replies", description: "Replies to public posts always require explicit human approval.", agentId: "roots", category: "community", riskLevel: "high", action: "human_approval" },
  { ruleKey: "reddit_comments", label: "Reddit comments", description: "Reddit replies always require explicit human approval. No auto-posting.", agentId: "roots", category: "community", riskLevel: "high", action: "human_approval" },
  { ruleKey: "creator_outreach", label: "Creator outreach", description: "Outreach messages to creators always require explicit human approval.", agentId: "scout", category: "outreach", riskLevel: "high", action: "human_approval" },
  { ruleKey: "x_publishing", label: "X publishing", description: "X posts publish only after Sage + Gate approval and a final human click.", agentId: "gate", category: "publishing", riskLevel: "high", action: "human_approval" },
  { ruleKey: "brand_sensitive", label: "Brand-sensitive content", description: "Anything controversial or brand-sensitive requires founder approval.", agentId: "gate", category: "publishing", riskLevel: "high", action: "human_approval" },
];

const ITEM_TYPE_RULE: Record<BatchApprovalItemType, string> = {
  x_post: "x_publishing",
  tiktok_package: "tiktok_captions",
  instagram_package: "instagram_captions",
  youtube_package: "youtube_titles",
  blog_draft: "blog_drafts",
  reddit_reply: "reddit_comments",
  creator_outreach: "creator_outreach",
  other: "brand_sensitive",
};

export async function getAutomationRuleMap(): Promise<
  Record<string, { riskLevel: AutomationRiskLevel; action: AutomationAction; enabled: boolean }>
> {
  const fallback = Object.fromEntries(
    DEFAULT_AUTOMATION_RULES.map((r) => [
      r.ruleKey,
      { riskLevel: r.riskLevel, action: r.action, enabled: true },
    ])
  );
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase.from("automation_rules").select("*");
    if (error || !data?.length) return fallback;
    for (const row of data) {
      fallback[row.rule_key] = {
        riskLevel: row.risk_level as AutomationRiskLevel,
        action: row.action as AutomationAction,
        enabled: row.enabled,
      };
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export async function recordAutomationRun(entry: {
  ruleKey: string;
  agentId: string;
  action: string;
  status?: "running" | "completed" | "failed" | "skipped";
  itemsProcessed?: number;
  itemsCreated?: number;
  detail?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = createServerClient();
    await supabase.from("automation_runs").insert({
      rule_key: entry.ruleKey,
      agent_id: entry.agentId,
      action: entry.action,
      status: entry.status ?? "completed",
      items_processed: entry.itemsProcessed ?? 0,
      items_created: entry.itemsCreated ?? 0,
      detail: entry.detail ?? "",
      error_message: entry.errorMessage ?? "",
      metadata: (entry.metadata ?? {}) as Json,
      completed_at: entry.status === "running" ? null : new Date().toISOString(),
    });
  } catch {
    // non-blocking
  }
}

function classifyApprovalQueueItem(
  draft: string,
  channel: string
): { itemType: BatchApprovalItemType; riskLevel: AutomationRiskLevel } {
  const d = draft.toLowerCase();
  if (d.startsWith("partnership:") || d.includes("creator lead") || d.includes("outreach")) {
    return { itemType: "creator_outreach", riskLevel: "high" };
  }
  const platform = mapToCalendarPlatform(channel, draft.slice(0, 60));
  switch (platform) {
    case "tiktok":
      return { itemType: "tiktok_package", riskLevel: "medium" };
    case "instagram":
      return { itemType: "instagram_package", riskLevel: "medium" };
    case "youtube_shorts":
      return { itemType: "youtube_package", riskLevel: "medium" };
    case "blog":
      return { itemType: "blog_draft", riskLevel: "medium" };
    case "reddit":
      return { itemType: "reddit_reply", riskLevel: "high" };
    case "x":
      return { itemType: "x_post", riskLevel: "high" };
    default:
      return { itemType: "other", riskLevel: "medium" };
  }
}

const TYPE_LIMITS: Record<BatchApprovalItemType, number> = {
  x_post: 10,
  tiktok_package: 5,
  instagram_package: 5,
  youtube_package: 5,
  reddit_reply: 3,
  blog_draft: 3,
  creator_outreach: 5,
  other: 5,
};

interface InboxRow {
  item_type: BatchApprovalItemType;
  risk_level: AutomationRiskLevel;
  platform: string;
  title: string;
  content: string;
  source_table: string;
  source_id: string;
  metadata: Json;
}

/**
 * Builds today's "Review Today's Work" inbox from everything agents prepared:
 * X queue items, Sage-approved content awaiting Gate, Reddit reply drafts, and
 * creator outreach drafts. Idempotent — re-running adds only new items.
 */
export async function buildDailyApprovalInbox(): Promise<{
  added: number;
  byType: Record<string, number>;
}> {
  const supabase = createServerClient();
  const rules = await getAutomationRuleMap();
  const rows: InboxRow[] = [];
  const counts: Record<string, number> = {};

  const push = (row: InboxRow) => {
    const rule = rules[ITEM_TYPE_RULE[row.item_type]];
    if (rule && !rule.enabled) return;
    if ((counts[row.item_type] ?? 0) >= TYPE_LIMITS[row.item_type]) return;
    counts[row.item_type] = (counts[row.item_type] ?? 0) + 1;
    rows.push(row);
  };

  // 1. X posts awaiting Sage/Gate review (high risk — final human approval)
  const { data: xItems } = await supabase
    .from("x_post_queue")
    .select("id, text, status")
    .in("status", ["sage_review", "gate_approval"])
    .order("created_at", { ascending: false })
    .limit(10);
  for (const x of xItems ?? []) {
    push({
      item_type: "x_post",
      risk_level: "high",
      platform: "x",
      title: x.text.slice(0, 80),
      content: x.text,
      source_table: "x_post_queue",
      source_id: x.id,
      metadata: { queue_status: x.status } as unknown as Json,
    });
  }

  // 2. Sage-approved content awaiting Gate (TikTok/IG/YT/blog packages + outreach)
  const { data: approvals } = await supabase
    .from("approval_queue")
    .select("id, type, channel, draft, source_id")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(60);
  for (const a of approvals ?? []) {
    const { itemType, riskLevel } = classifyApprovalQueueItem(a.draft, a.channel);
    push({
      item_type: itemType,
      risk_level: riskLevel,
      platform: mapToCalendarPlatform(a.channel, a.draft.slice(0, 60)),
      title: a.draft.split("\n")[0]?.slice(0, 80) ?? "Pending approval",
      content: a.draft,
      source_table: "approval_queue",
      source_id: a.id,
      metadata: { approval_type: a.type, bloom_piece_id: a.source_id } as unknown as Json,
    });
  }

  // 3. Reddit / community reply drafts (high risk)
  const { data: replies } = await supabase
    .from("community_reply_drafts")
    .select("id, platform, draft, original_content, author")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(3);
  for (const r of replies ?? []) {
    push({
      item_type: "reddit_reply",
      risk_level: "high",
      platform: (r.platform || "reddit").toLowerCase(),
      title: `Reply to ${r.author || "community post"}`,
      content: r.draft,
      source_table: "community_reply_drafts",
      source_id: r.id,
      metadata: { original: r.original_content?.slice(0, 200) ?? "" } as unknown as Json,
    });
  }

  if (rows.length === 0) return { added: 0, byType: counts };

  const { data: inserted, error } = await supabase
    .from("batch_approvals")
    .upsert(
      rows.map((r) => ({ ...r, batch_date: new Date().toISOString().slice(0, 10) })),
      { onConflict: "batch_date,source_table,source_id", ignoreDuplicates: true }
    )
    .select("id");

  if (error) {
    if (isMissingTableError(error)) {
      throw new Error(
        "System setup is still finishing. The batch approval inbox will populate once the backend is ready."
      );
    }
    throw new Error(error.message);
  }

  return { added: inserted?.length ?? 0, byType: counts };
}

/**
 * Applies an approve/reject decision from the batch inbox to the underlying
 * record, which in turn drives the content calendar + publishing packages.
 */
export async function applyApprovalToSource(
  sourceTable: string,
  sourceId: string,
  approved: boolean
): Promise<void> {
  const supabase = createServerClient();

  switch (sourceTable) {
    case "x_post_queue": {
      // Batch approval acts as the Gate decision; publishing still needs the final human click.
      await advanceXQueueStatus(sourceId, approved ? "ready_to_publish" : "rejected", {
        gateApproved: approved,
        sageApproved: true,
        ...(approved ? { scheduledAt: new Date().toISOString() } : {}),
      });
      await syncXQueueItemToCalendar(sourceId, approved ? "ready_to_publish" : "rejected");
      break;
    }
    case "approval_queue": {
      await supabase
        .from("approval_queue")
        .update({ status: approved ? "approved" : "rejected" })
        .eq("id", sourceId);
      const { data: approval } = await supabase
        .from("approval_queue")
        .select("source_id")
        .eq("id", sourceId)
        .maybeSingle();
      if (approval?.source_id) {
        await supabase
          .from("bloom_content_pieces")
          .update({ status: approved ? "approved" : "rejected" })
          .eq("id", approval.source_id);
      }
      await syncApprovalQueueItemToCalendar(sourceId, approved);
      break;
    }
    case "bloom_content_pieces": {
      await supabase
        .from("bloom_content_pieces")
        .update({ status: approved ? "approved" : "rejected" })
        .eq("id", sourceId);
      await supabase
        .from("approval_queue")
        .update({ status: approved ? "approved" : "rejected" })
        .eq("source_id", sourceId);
      await syncBloomPieceToCalendar(sourceId, { approved });
      break;
    }
    case "community_reply_drafts": {
      await supabase
        .from("community_reply_drafts")
        .update({ status: approved ? "approved" : "rejected" })
        .eq("id", sourceId);
      break;
    }
    default:
      break;
  }
}
