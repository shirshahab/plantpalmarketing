import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import { buildPublishingPackageForCalendarItem } from "@/lib/automation/publishing-packages";
import type { Json } from "@/lib/supabase/database.types";
import type { CalendarApprovalStatus, CalendarPlatform, CalendarStatus } from "@/lib/types";

export const PLATFORM_LABELS: Record<CalendarPlatform, string> = {
  x: "X",
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube_shorts: "YouTube Shorts",
  reddit: "Reddit",
  blog: "Blog",
  email: "Email",
  pinterest: "Pinterest",
};

/** Platforms that may auto-publish via API. Everything else is manual copy/upload only. */
export const API_PUBLISH_ALLOWED: CalendarPlatform[] = ["x"];

export function mapToCalendarPlatform(platform: string, format = ""): CalendarPlatform {
  const p = `${platform} ${format}`.toLowerCase();
  if (p.includes("tiktok")) return "tiktok";
  if (p.includes("short") || p.includes("youtube")) return "youtube_shorts";
  if (p.includes("reel") || p.includes("instagram") || p.includes("carousel")) return "instagram";
  if (p.includes("reddit")) return "reddit";
  if (p.includes("blog") || p.includes("article") || p.includes("seo")) return "blog";
  if (p.includes("email") || p.includes("newsletter")) return "email";
  if (p.includes("pinterest") || p.includes("pin")) return "pinterest";
  return "x";
}

function extractHashtags(text: string): string[] {
  return Array.from(new Set(text.match(/#[\p{L}\p{N}_]+/gu) ?? []));
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

interface SourceContent {
  title: string;
  hook: string;
  caption: string;
  cta: string;
}

/**
 * Part 4 — platform-specific instructions stored in metadata so the calendar
 * drawer can show scripts, checklists, and copy blocks per channel.
 */
export function buildPlatformInstructions(
  platform: CalendarPlatform,
  content: SourceContent
): Record<string, unknown> {
  const hashtags = extractHashtags(`${content.caption} ${content.cta}`);
  switch (platform) {
    case "tiktok":
      return {
        script: [content.hook, content.caption, content.cta].filter(Boolean).join("\n\n"),
        caption: content.caption,
        hashtags,
        assetInstructions: "Record or generate a vertical 9:16 video matching the hook. Add on-screen text for the first 3 seconds.",
        uploadChecklist: [
          "Open TikTok and tap upload",
          "Attach the prepared video asset",
          "Paste the caption (copy button below)",
          "Add hashtags",
          "Verify the hook appears in the first 3 seconds",
          "Post, then mark as posted on the calendar",
        ],
        autoPosting: false,
      };
    case "reddit":
      return {
        subreddit: "r/houseplants (adjust to fit the topic)",
        postTitle: content.title || content.hook,
        postBody: [content.caption, content.cta].filter(Boolean).join("\n\n"),
        commentReplyDraft:
          "Thanks for the responses! We built PlantPal to help with exactly this — happy to answer any plant care questions.",
        autoPosting: false,
      };
    case "blog":
      return {
        title: content.title || content.hook,
        slug: slugify(content.title || content.hook),
        outline: [content.hook, content.caption, content.cta].filter(Boolean).join("\n\n"),
        metaDescription: content.caption.slice(0, 155),
        autoPosting: false,
      };
    case "instagram":
      return {
        caption: [content.caption, content.cta].filter(Boolean).join("\n\n"),
        carouselFrames: [
          `Frame 1 — Hook: ${content.hook}`,
          `Frame 2 — Value: ${content.caption.slice(0, 120)}`,
          `Frame 3 — CTA: ${content.cta}`,
        ],
        imagePrompts: [
          `Clean botanical illustration for: ${content.hook || content.title}`,
        ],
        hashtags,
        autoPosting: false,
      };
    case "youtube_shorts":
      return {
        title: (content.title || content.hook).slice(0, 100),
        description: [content.caption, content.cta].filter(Boolean).join("\n\n"),
        caption: content.caption,
        script: [content.hook, content.caption, content.cta].filter(Boolean).join("\n\n"),
        uploadChecklist: [
          "Open YouTube Studio → Create → Upload Shorts",
          "Attach the prepared vertical video",
          "Paste title and description (copy buttons below)",
          "Set visibility to Public",
          "Publish, then mark as posted on the calendar",
        ],
        autoPosting: false,
      };
    case "x":
      return {
        tweetText: [content.hook, content.caption, content.cta].filter(Boolean).join(" ").slice(0, 280),
        hashtags,
        flow: "Sage → Gate → Sprout queue → human clicks Publish to X",
        autoPosting: "human-confirmed only",
      };
    default:
      return { hashtags, autoPosting: false };
  }
}

function buildCopyText(platform: CalendarPlatform, content: SourceContent): string {
  return [content.hook, content.caption, content.cta].filter(Boolean).join("\n\n");
}

export interface CalendarUpsertInput {
  title: string;
  platform: CalendarPlatform;
  channel?: string;
  contentType?: string;
  caption?: string;
  hook?: string;
  cta?: string;
  assetUrl?: string;
  assetType?: string;
  assetPrompt?: string;
  scheduledFor?: string | null;
  publishedAt?: string | null;
  status: CalendarStatus;
  approvalStatus: CalendarApprovalStatus;
  sourceAgent?: string;
  sourceTable: string;
  sourceId: string | null;
  copyText?: string;
  platformUrl?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create-or-update a calendar item keyed on (source_table, source_id).
 * Never throws — calendar sync must not break the underlying approval flow.
 */
export async function upsertCalendarItem(input: CalendarUpsertInput): Promise<string | null> {
  try {
    const supabase = createServerClient();
    const row = {
      title: input.title,
      platform: input.platform,
      channel: input.channel ?? PLATFORM_LABELS[input.platform],
      content_type: input.contentType ?? "post",
      caption: input.caption ?? "",
      hook: input.hook ?? "",
      cta: input.cta ?? "",
      asset_url: input.assetUrl ?? "",
      asset_type: input.assetType ?? "none",
      asset_prompt: input.assetPrompt ?? "",
      scheduled_for: input.scheduledFor ?? null,
      published_at: input.publishedAt ?? null,
      status: input.status,
      approval_status: input.approvalStatus,
      source_agent: input.sourceAgent ?? "bloom",
      source_table: input.sourceTable,
      source_id: input.sourceId,
      copy_text: input.copyText ?? "",
      platform_url: input.platformUrl ?? "",
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      metadata: (input.metadata ?? {}) as Json,
    };

    if (input.sourceId) {
      const { data: existing } = await supabase
        .from("content_calendar")
        .select("id, notes, platform_url, published_at, scheduled_for")
        .eq("source_table", input.sourceTable)
        .eq("source_id", input.sourceId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("content_calendar")
          .update({
            ...row,
            // Preserve human-entered fields and existing dates unless explicitly overwritten
            platform_url: input.platformUrl || existing.platform_url,
            published_at: input.publishedAt ?? existing.published_at,
            scheduled_for: input.scheduledFor ?? existing.scheduled_for,
          })
          .eq("id", existing.id);
        if (error) throw error;
        return existing.id;
      }
    }

    const { data, error } = await supabase
      .from("content_calendar")
      .insert(row)
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  } catch (e) {
    const err = e as { message?: string; code?: string };
    if (isMissingTableError(err)) {
      console.error(
        "[content_calendar] table not found — run supabase/migrations/043_phase25_content_calendar.sql"
      );
    } else {
      console.error("[content_calendar] sync failed:", err.message ?? e);
    }
    return null;
  }
}

export async function logCalendarPublish(
  calendarItemId: string,
  entry: {
    platform: string;
    status: "logged" | "queued" | "published" | "manual_published" | "failed" | "status_change";
    publishedUrl?: string;
    errorMessage?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    const supabase = createServerClient();
    await supabase.from("content_publish_logs").insert({
      calendar_item_id: calendarItemId,
      platform: entry.platform,
      status: entry.status,
      published_url: entry.publishedUrl ?? "",
      error_message: entry.errorMessage ?? "",
      metadata: (entry.metadata ?? {}) as Json,
    });
  } catch {
    // non-blocking
  }
}

async function logActivity(agentId: string, action: string, detail: string, metadata: Record<string, unknown>) {
  try {
    const supabase = createServerClient();
    await supabase.from("agent_activity_log").insert({
      agent_id: agentId,
      action,
      detail,
      metadata: metadata as Json,
    });
  } catch {
    // non-blocking
  }
}

function weekdayLabel(iso: string | null): string {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

/**
 * Bloom piece → calendar item.
 * stage "draft": Bloom just created it — calendar item lands as a draft (auto, low risk).
 * stage "gate" (default): Gate decision — X stays "approved" (must flow through
 * Sprout + human publish); every other platform becomes ready_to_publish
 * (manual copy/upload, no auto-posting), or needs_asset when an asset is missing.
 */
export async function syncBloomPieceToCalendar(
  pieceId: string,
  opts: { approved?: boolean; stage?: "draft" | "gate"; sourceAgent?: string } = {}
): Promise<string | null> {
  const stage = opts.stage ?? "gate";
  const approved = opts.approved ?? true;
  const supabase = createServerClient();
  const { data: piece, error } = await supabase
    .from("bloom_content_pieces")
    .select("*")
    .eq("id", pieceId)
    .maybeSingle();
  if (error || !piece) return null;

  const platform = mapToCalendarPlatform(piece.platform, piece.format);
  const content: SourceContent = {
    title: piece.title,
    hook: piece.hook,
    caption: piece.caption,
    cta: piece.cta,
  };

  const needsVideoAsset = ["tiktok", "youtube_shorts", "instagram", "pinterest"].includes(platform);
  const assetType = needsVideoAsset
    ? platform === "instagram" || platform === "pinterest"
      ? "image"
      : "video"
    : "none";

  let status: CalendarStatus;
  let approvalStatus: CalendarApprovalStatus;
  if (stage === "draft") {
    status = "draft";
    approvalStatus = "pending";
  } else if (!approved) {
    status = "rejected";
    approvalStatus = "rejected";
  } else if (platform === "x") {
    status = "approved"; // X flows through Sprout queue + human Publish click
    approvalStatus = "approved";
  } else if (needsVideoAsset) {
    status = "needs_asset";
    approvalStatus = "approved";
  } else {
    status = "ready_to_publish"; // manual copy/upload workflow
    approvalStatus = "approved";
  }

  const metadata = {
    ...buildPlatformInstructions(platform, content),
    approvalHistory:
      stage === "draft"
        ? [{ stage: "bloom", status: "created", at: new Date().toISOString() }]
        : [
            { stage: "sage", status: "approved", at: new Date().toISOString() },
            { stage: "gate", status: approved ? "approved" : "rejected", at: new Date().toISOString() },
          ],
    viralScore: piece.viral_score,
    sourceFormat: piece.format,
  };

  const calendarId = await upsertCalendarItem({
    title: piece.title || piece.hook.slice(0, 80),
    platform,
    contentType: piece.format,
    caption: piece.caption,
    hook: piece.hook,
    cta: piece.cta,
    assetType,
    assetPrompt: needsVideoAsset ? `Vertical asset for: ${piece.hook || piece.title}` : "",
    scheduledFor: piece.scheduled_date,
    status,
    approvalStatus,
    sourceAgent: opts.sourceAgent ?? "bloom",
    sourceTable: "bloom_content_pieces",
    sourceId: piece.id,
    copyText: buildCopyText(platform, content),
    metadata,
  });

  if (calendarId && stage === "gate" && approved) {
    await buildPublishingPackageForCalendarItem(calendarId);
    const label = PLATFORM_LABELS[platform];
    const detail =
      platform === "blog"
        ? "Blog draft ready for manual publishing."
        : `Gate approved ${label} post. Added to ${weekdayLabel(piece.scheduled_date)} calendar.`;
    await logActivity("gate", "calendar_item_added", detail, {
      calendar_item_id: calendarId,
      platform,
      status,
    });
    await logCalendarPublish(calendarId, {
      platform,
      status: "status_change",
      metadata: { to: status, by: "gate" },
    });
  }

  return calendarId;
}

/**
 * Phase 26 — Sage approved/rejected a piece: attach the creative score to the
 * calendar item (creating it as a draft first if Bloom's hook was missed).
 */
export async function attachSageScoreToCalendar(
  pieceId: string,
  scores: { aggregateScore: number; recommendation: string; hookSuggestion?: string; ctaSuggestion?: string }
): Promise<void> {
  try {
    const supabase = createServerClient();
    let { data: existing } = await supabase
      .from("content_calendar")
      .select("id, metadata")
      .eq("source_table", "bloom_content_pieces")
      .eq("source_id", pieceId)
      .maybeSingle();

    if (!existing) {
      const createdId = await syncBloomPieceToCalendar(pieceId, { stage: "draft" });
      if (!createdId) return;
      const { data: created } = await supabase
        .from("content_calendar")
        .select("id, metadata")
        .eq("id", createdId)
        .maybeSingle();
      existing = created;
      if (!existing) return;
    }

    const approved = scores.recommendation === "approve";
    const meta = (existing.metadata as Record<string, unknown>) ?? {};
    const history = Array.isArray(meta.approvalHistory) ? meta.approvalHistory : [];
    await supabase
      .from("content_calendar")
      .update({
        status: approved ? "gate_review" : "rejected",
        approval_status: approved ? "sage_approved" : "rejected",
        metadata: {
          ...meta,
          creativeScore: scores.aggregateScore,
          sageRecommendation: scores.recommendation,
          sageHookSuggestion: scores.hookSuggestion ?? "",
          sageCtaSuggestion: scores.ctaSuggestion ?? "",
          approvalHistory: [
            ...history,
            {
              stage: "sage",
              status: approved ? "approved" : "rejected",
              score: scores.aggregateScore,
              at: new Date().toISOString(),
            },
          ],
        } as Json,
      })
      .eq("id", existing.id);
  } catch {
    // non-blocking
  }
}

/** Gate approval coming from the generic approval queue. */
export async function syncApprovalQueueItemToCalendar(
  approvalId: string,
  approved: boolean
): Promise<string | null> {
  const supabase = createServerClient();
  const { data: item, error } = await supabase
    .from("approval_queue")
    .select("*")
    .eq("id", approvalId)
    .maybeSingle();
  if (error || !item) return null;

  // Prefer the richer Bloom source record when linked
  if (item.source_id) {
    const { data: piece } = await supabase
      .from("bloom_content_pieces")
      .select("id")
      .eq("id", item.source_id)
      .maybeSingle();
    if (piece) return syncBloomPieceToCalendar(piece.id, { approved });
  }

  const platform = mapToCalendarPlatform(item.channel, item.type);
  const content: SourceContent = { title: item.draft.slice(0, 80), hook: "", caption: item.draft, cta: "" };
  const status: CalendarStatus = !approved
    ? "rejected"
    : platform === "x"
      ? "approved"
      : "ready_to_publish";

  const calendarId = await upsertCalendarItem({
    title: item.draft.slice(0, 80),
    platform,
    contentType: item.type,
    caption: item.draft,
    status,
    approvalStatus: approved ? "approved" : "rejected",
    sourceAgent: "gate",
    sourceTable: "approval_queue",
    sourceId: item.id,
    copyText: item.draft,
    metadata: {
      ...buildPlatformInstructions(platform, content),
      approvalHistory: [
        { stage: "gate", status: approved ? "approved" : "rejected", at: new Date().toISOString() },
      ],
    },
  });

  if (calendarId && approved) {
    await buildPublishingPackageForCalendarItem(calendarId);
    await logActivity(
      "gate",
      "calendar_item_added",
      `Gate approved ${PLATFORM_LABELS[platform]} post. Added to ${weekdayLabel(null)} calendar.`,
      { calendar_item_id: calendarId, platform, status }
    );
  }
  return calendarId;
}

/** X queue lifecycle → calendar. Called from Gate approve / queue / publish / reject. */
export async function syncXQueueItemToCalendar(
  queueId: string,
  status: CalendarStatus,
  opts: { publishedUrl?: string } = {}
): Promise<string | null> {
  const supabase = createServerClient();
  const { data: item, error } = await supabase
    .from("x_post_queue")
    .select("*")
    .eq("id", queueId)
    .maybeSingle();
  if (error || !item) return null;

  const approvalStatus: CalendarApprovalStatus =
    status === "rejected"
      ? "rejected"
      : item.gate_approved
        ? "approved"
        : item.sage_approved
          ? "sage_approved"
          : "pending";

  const calendarId = await upsertCalendarItem({
    title: item.text.slice(0, 80),
    platform: "x",
    contentType: "tweet",
    caption: item.text,
    scheduledFor: item.scheduled_at,
    publishedAt: status === "published" ? item.published_at ?? new Date().toISOString() : null,
    status,
    approvalStatus,
    sourceAgent: item.created_by_agent || "bloom",
    sourceTable: "x_post_queue",
    sourceId: item.id,
    copyText: item.text,
    platformUrl:
      opts.publishedUrl ??
      (item.published_tweet_id ? `https://x.com/PlantPalApp/status/${item.published_tweet_id}` : ""),
    metadata: {
      sageApproved: item.sage_approved,
      gateApproved: item.gate_approved,
      approvalHistory: [
        ...(item.sage_approved ? [{ stage: "sage", status: "approved" }] : []),
        ...(item.gate_approved ? [{ stage: "gate", status: "approved" }] : []),
        ...(status === "published" ? [{ stage: "publish", status: "published" }] : []),
      ],
      flow: "Sage → Gate → Sprout queue → human Publish to X",
    },
  });

  if (calendarId) {
    if (status === "ready_to_publish" || status === "published") {
      await buildPublishingPackageForCalendarItem(calendarId);
    }
    await logCalendarPublish(calendarId, {
      platform: "x",
      status: status === "published" ? "published" : "status_change",
      publishedUrl: opts.publishedUrl,
      metadata: { to: status, queue_id: queueId },
    });
  }
  return calendarId;
}

/**
 * Phase 28 — legacy pipeline_content rows sync into content_calendar so the
 * calendar stays the source of truth for everything publishable.
 */
export async function syncPipelineContentToCalendar(
  pipelineId: string,
  approved: boolean
): Promise<string | null> {
  try {
    const supabase = createServerClient();
    const { data: row, error } = await supabase
      .from("pipeline_content")
      .select("*")
      .eq("id", pipelineId)
      .maybeSingle();
    if (error || !row) return null;

    const platform = mapToCalendarPlatform(row.platform, row.format);
    const content: SourceContent = {
      title: row.hook.slice(0, 80) || `${row.platform} ${row.format}`,
      hook: row.hook,
      caption: row.caption,
      cta: row.cta,
    };
    const status: CalendarStatus = !approved
      ? "rejected"
      : platform === "x"
        ? "approved"
        : "ready_to_publish";

    const calendarId = await upsertCalendarItem({
      title: content.title,
      platform,
      contentType: row.format,
      caption: row.caption,
      hook: row.hook,
      cta: row.cta,
      status,
      approvalStatus: approved ? "approved" : "rejected",
      sourceAgent: "sage",
      sourceTable: "pipeline_content",
      sourceId: row.id,
      copyText: [row.hook, row.caption, row.cta].filter(Boolean).join("\n\n"),
      metadata: {
        ...buildPlatformInstructions(platform, content),
        aggregateScore: row.aggregate_score,
        directorNotes: row.director_notes,
        approvalHistory: [
          { stage: "creative_director", status: approved ? "approved" : "rejected", at: new Date().toISOString() },
        ],
      },
    });

    if (calendarId && approved) {
      await buildPublishingPackageForCalendarItem(calendarId);
      await logActivity(
        "gate",
        "calendar_item_added",
        `Pipeline content approved — ${PLATFORM_LABELS[platform]} post added to the calendar.`,
        { calendar_item_id: calendarId, pipeline_id: row.id }
      );
    }
    return calendarId;
  } catch {
    return null;
  }
}

/** Sprout queued/scheduled a post → mark the linked calendar item scheduled. */
export async function syncSproutScheduleToCalendar(
  sproutPostId: string,
  opts: { published?: boolean } = {}
): Promise<string | null> {
  const supabase = createServerClient();
  const { data: post, error } = await supabase
    .from("sprout_scheduled_posts")
    .select("*")
    .eq("id", sproutPostId)
    .maybeSingle();
  if (error || !post) return null;

  // Ensure a calendar item exists for the underlying Bloom piece
  let calendarId: string | null = null;
  if (post.bloom_piece_id) {
    calendarId = await syncBloomPieceToCalendar(post.bloom_piece_id, { approved: true, sourceAgent: "sprout" });
  }

  const platform = mapToCalendarPlatform(post.platform);
  if (!calendarId) {
    calendarId = await upsertCalendarItem({
      title: post.title || post.hook.slice(0, 80),
      platform,
      contentType: "post",
      caption: post.caption,
      hook: post.hook,
      cta: post.cta,
      scheduledFor: post.scheduled_at,
      status: opts.published ? "published" : "scheduled",
      approvalStatus: "approved",
      sourceAgent: "sprout",
      sourceTable: "sprout_scheduled_posts",
      sourceId: post.id,
      copyText: [post.hook, post.caption, post.cta].filter(Boolean).join("\n\n"),
      metadata: { recommendedTime: post.recommended_time_label },
    });
  } else {
    try {
      const sb = createServerClient();
      await sb
        .from("content_calendar")
        .update({
          scheduled_for: post.scheduled_at,
          status: opts.published ? "published" : "scheduled",
          ...(opts.published ? { published_at: new Date().toISOString() } : {}),
        })
        .eq("id", calendarId);
    } catch {
      // non-blocking
    }
  }

  if (calendarId) {
    await buildPublishingPackageForCalendarItem(calendarId);
    const when = post.scheduled_at
      ? new Date(post.scheduled_at).toLocaleString("en-US", {
          weekday: "long",
          hour: "numeric",
          minute: "2-digit",
        })
      : post.recommended_time_label || "the next best slot";
    await logActivity(
      "sprout",
      opts.published ? "calendar_published" : "calendar_scheduled",
      opts.published
        ? `Sprout marked ${PLATFORM_LABELS[platform]} post as published.`
        : `Sprout queued ${PLATFORM_LABELS[platform]} post for ${when}.`,
      { calendar_item_id: calendarId, sprout_post_id: post.id }
    );
  }
  return calendarId;
}
