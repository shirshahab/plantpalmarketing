import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import { getBestPostingTime, type SproutPlatform } from "@/lib/agents/sprout/posting-times";
import type { Json } from "@/lib/supabase/database.types";
import type { CalendarPlatform } from "@/lib/types";

const SPROUT_PLATFORM_MAP: Partial<Record<CalendarPlatform, SproutPlatform>> = {
  x: "X",
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube_shorts: "YouTube",
  pinterest: "Pinterest",
};

const PLATFORM_NOTES: Record<CalendarPlatform, string> = {
  x: "Publishes via API only after Sage + Gate approval and a final human click. No scheduling on the X side needed.",
  tiktok: "No auto-posting. Upload the vertical video manually, paste the caption, confirm the hook lands in the first 3 seconds.",
  instagram: "No auto-posting. Post the carousel/reel manually. First comment can carry overflow hashtags.",
  youtube_shorts: "No auto-posting. Upload via YouTube Studio, set visibility Public, then mark as posted.",
  reddit: "No auto-posting. Post manually from the brand account. Match subreddit tone — no marketing language in the title.",
  blog: "No auto-posting until a CMS is connected. Paste title, slug, body, and meta description into the blog editor.",
  email: "No auto-sending. Paste into the email tool and send a test before the real campaign.",
  pinterest: "No auto-posting. Create the pin manually with the image asset and paste the description.",
};

const DEFAULT_CHECKLISTS: Partial<Record<CalendarPlatform, string[]>> = {
  reddit: [
    "Pick the best-fit subreddit and re-read its rules",
    "Paste the post title and body (copy buttons)",
    "Post, then monitor for the first hour",
    "Use the prepared comment reply draft when questions come in",
    "Mark as posted on the calendar",
  ],
  blog: [
    "Paste title, slug, and body into the CMS",
    "Add the meta description",
    "Insert images from the asset prompts",
    "Publish and paste the live URL into the calendar",
  ],
  email: [
    "Paste subject and body into the email tool",
    "Send a test email",
    "Schedule or send the campaign",
    "Mark as posted with the campaign link",
  ],
  pinterest: [
    "Upload the image asset to the pin builder",
    "Paste the description and link",
    "Publish the pin and mark as posted",
  ],
  x: [
    "Confirm Sage + Gate approval badges",
    "Click Publish to X (final human approval)",
    "Verify the live tweet URL was saved",
  ],
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Builds (or refreshes) the complete publishing package for a calendar item:
 * caption, script, hashtags, asset prompt, upload checklist, recommended post
 * time, and platform notes — so manual publishing is one copy/paste away.
 * Never throws.
 */
export async function buildPublishingPackageForCalendarItem(
  calendarItemId: string
): Promise<string | null> {
  try {
    const supabase = createServerClient();
    const { data: item, error } = await supabase
      .from("content_calendar")
      .select("*")
      .eq("id", calendarItemId)
      .maybeSingle();
    if (error || !item) return null;

    const platform = item.platform as CalendarPlatform;
    const meta = (item.metadata as Record<string, unknown>) ?? {};

    const script =
      asString(meta.script) || asString(meta.postBody) || asString(meta.outline) ||
      [item.hook, item.caption, item.cta].filter(Boolean).join("\n\n");
    const hashtags = asStringArray(meta.hashtags);
    const checklist =
      asStringArray(meta.uploadChecklist).length > 0
        ? asStringArray(meta.uploadChecklist)
        : DEFAULT_CHECKLISTS[platform] ?? [];

    const sproutPlatform = SPROUT_PLATFORM_MAP[platform];
    const slot = sproutPlatform ? getBestPostingTime(sproutPlatform) : null;
    const recommendedPostTime = item.scheduled_for
      ? new Date(item.scheduled_for).toLocaleString("en-US", {
          weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
        })
      : slot?.label ?? "Weekday 10:00 AM local";

    const needsAsset =
      item.status === "needs_asset" ||
      (item.asset_type !== "none" && item.asset_type !== "" && !item.asset_url);

    const row = {
      calendar_item_id: item.id,
      platform,
      caption: item.caption,
      script,
      hashtags: hashtags as unknown as Json,
      asset_prompt: item.asset_prompt,
      asset_url: item.asset_url,
      thumbnail_url: asString(meta.thumbnailUrl),
      upload_checklist: checklist as unknown as Json,
      recommended_post_time: recommendedPostTime,
      recommended_post_at: item.scheduled_for,
      platform_notes: PLATFORM_NOTES[platform] ?? "",
      copy_text: item.copy_text || [item.hook, item.caption, item.cta].filter(Boolean).join("\n\n"),
      status: (item.status === "published"
        ? "published"
        : needsAsset
          ? "needs_asset"
          : "ready") as "ready" | "needs_asset" | "published",
      metadata: {
        slotRationale: slot?.rationale ?? "",
        sourceTable: item.source_table,
        sourceId: item.source_id,
      } as unknown as Json,
    };

    const { data: existing } = await supabase
      .from("publishing_packages")
      .select("id")
      .eq("calendar_item_id", item.id)
      .maybeSingle();

    if (existing) {
      const { error: updateError } = await supabase
        .from("publishing_packages")
        .update(row)
        .eq("id", existing.id);
      if (updateError) throw updateError;
      return existing.id;
    }

    const { data: created, error: insertError } = await supabase
      .from("publishing_packages")
      .insert(row)
      .select("id")
      .single();
    if (insertError) throw insertError;
    return created.id;
  } catch (e) {
    const err = e as { message?: string; code?: string };
    if (isMissingTableError(err)) {
      console.error(
        "System setup is still finishing. This section will populate once the backend is ready."
      );
    } else {
      console.error("[publishing_packages] build failed:", err.message ?? e);
    }
    return null;
  }
}
