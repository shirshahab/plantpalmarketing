import type { CalendarPlatform, CalendarStatus, ContentCalendarItem } from "@/lib/types";

export const PLATFORM_META: Record<
  CalendarPlatform,
  { label: string; color: string; bg: string; url: string }
> = {
  x: { label: "X", color: "#0f1419", bg: "#e7e9ea", url: "https://x.com/compose/post" },
  tiktok: { label: "TikTok", color: "#fe2c55", bg: "#ffe5eb", url: "https://www.tiktok.com/upload" },
  instagram: { label: "Instagram", color: "#c13584", bg: "#fce7f3", url: "https://www.instagram.com" },
  youtube_shorts: { label: "YouTube Shorts", color: "#ff0000", bg: "#fee2e2", url: "https://studio.youtube.com" },
  reddit: { label: "Reddit", color: "#ff4500", bg: "#ffedd5", url: "https://www.reddit.com/submit" },
  blog: { label: "Blog", color: "#2d6a4f", bg: "#dcefe2", url: "" },
  email: { label: "Email", color: "#6366f1", bg: "#e0e7ff", url: "" },
  pinterest: { label: "Pinterest", color: "#bd081c", bg: "#fee2e2", url: "https://www.pinterest.com/pin-builder/" },
};

export const ALL_PLATFORMS = Object.keys(PLATFORM_META) as CalendarPlatform[];

export const STATUS_META: Record<
  CalendarStatus,
  { label: string; badge: "default" | "success" | "warning" | "danger" | "info" | "muted" }
> = {
  draft: { label: "Draft", badge: "muted" },
  sage_review: { label: "Sage Review", badge: "info" },
  gate_review: { label: "Gate Review", badge: "warning" },
  approved: { label: "Approved", badge: "success" },
  scheduled: { label: "Scheduled", badge: "info" },
  ready_to_publish: { label: "Ready to Publish", badge: "success" },
  published: { label: "Published", badge: "default" },
  rejected: { label: "Rejected", badge: "danger" },
  needs_asset: { label: "Needs Asset", badge: "warning" },
};

export const ALL_STATUSES = Object.keys(STATUS_META) as CalendarStatus[];

// DB values are not guaranteed to match the TS unions — never crash on unknowns.
export function getPlatformMeta(platform: string | null | undefined) {
  return (
    (platform ? PLATFORM_META[platform as CalendarPlatform] : undefined) ?? {
      label: platform ? String(platform) : "Unknown",
      color: "#5b6b63",
      bg: "#e8ece9",
      url: "",
    }
  );
}

export function getStatusMeta(status: string | null | undefined) {
  return (
    (status ? STATUS_META[status as CalendarStatus] : undefined) ?? {
      label: status ? String(status) : "Unknown",
      badge: "muted" as const,
    }
  );
}

export function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

export function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

/** Monday-based start of week. */
export function startOfWeek(d: Date): Date {
  const out = startOfDay(d);
  const day = out.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(out, diff);
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function itemDate(item: ContentCalendarItem): Date | null {
  const iso = item.scheduledFor ?? item.publishedAt ?? item.createdAt;
  return iso ? new Date(iso) : null;
}

export function itemsOnDay(items: ContentCalendarItem[], day: Date): ContentCalendarItem[] {
  return items.filter((item) => {
    const d = itemDate(item);
    return d !== null && isSameDay(d, day);
  });
}

export function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function formatDay(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function formatFullDate(iso: string | null): string {
  if (!iso) return "Unscheduled";
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function extractHashtags(item: ContentCalendarItem): string[] {
  const fromMeta = item.metadata?.hashtags;
  if (Array.isArray(fromMeta) && fromMeta.length > 0) return fromMeta.map(String);
  return Array.from(new Set(`${item.caption} ${item.cta}`.match(/#[\p{L}\p{N}_]+/gu) ?? []));
}

export function itemNeedsAsset(item: ContentCalendarItem): boolean {
  if (item.status === "needs_asset") return true;
  if (item.status === "published" || item.status === "rejected") return false;
  return item.assetType !== "none" && item.assetType !== "" && !item.assetUrl;
}

export function buildCopyAll(item: ContentCalendarItem): string {
  const hashtags = extractHashtags(item);
  return [
    item.title && `Title: ${item.title}`,
    item.hook && `Hook: ${item.hook}`,
    item.caption && `Caption:\n${item.caption}`,
    item.cta && `CTA: ${item.cta}`,
    hashtags.length > 0 && `Hashtags: ${hashtags.join(" ")}`,
    item.assetPrompt && `Asset prompt: ${item.assetPrompt}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}
