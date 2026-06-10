import { createServerClient } from "@/lib/supabase";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import {
  mapContentAsset,
  mapContentCalendarItem,
  mapContentPublishLog,
} from "@/lib/supabase/mappers";
import type { CalendarDayStats, ContentCalendarItem } from "@/lib/types";

export async function getCalendarItems(limit = 500): Promise<ContentCalendarItem[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("content_calendar")
    .select("*")
    .order("scheduled_for", { ascending: true, nullsFirst: false })
    .limit(limit);
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map(mapContentCalendarItem);
}

export async function getCalendarItemById(id: string): Promise<ContentCalendarItem | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("content_calendar")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    if (isMissingTableError(error)) return null;
    throw new Error(error.message);
  }
  return data ? mapContentCalendarItem(data) : null;
}

export async function getContentAssets(limit = 500) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("content_assets")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map(mapContentAsset);
}

export async function getPublishLogs(limit = 200) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("content_publish_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map(mapContentPublishLog);
}

function isSameLocalDay(iso: string | null, ref: Date): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

export function itemNeedsAsset(item: ContentCalendarItem): boolean {
  if (item.status === "needs_asset") return true;
  if (item.status === "published" || item.status === "rejected") return false;
  return item.assetType !== "none" && item.assetType !== "" && !item.assetUrl;
}

export function computeCalendarStats(items: ContentCalendarItem[], now = new Date()): CalendarDayStats {
  return {
    scheduledToday: items.filter(
      (i) => isSameLocalDay(i.scheduledFor, now) && i.status !== "rejected"
    ).length,
    readyToPublish: items.filter((i) => i.status === "ready_to_publish").length,
    missingAssets: items.filter(itemNeedsAsset).length,
    postedToday: items.filter((i) => i.status === "published" && isSameLocalDay(i.publishedAt, now)).length,
    approved: items.filter((i) => i.approvalStatus === "approved" && i.status !== "published" && i.status !== "rejected").length,
    overdue: items.filter(
      (i) =>
        i.scheduledFor !== null &&
        new Date(i.scheduledFor).getTime() < now.getTime() &&
        !isSameLocalDay(i.scheduledFor, now) &&
        i.status !== "published" &&
        i.status !== "rejected"
    ).length,
  };
}

export async function getCalendarPageData() {
  const [items, assets, publishLogs] = await Promise.all([
    getCalendarItems(),
    getContentAssets(),
    getPublishLogs(),
  ]);
  return {
    items,
    assets,
    publishLogs,
    stats: computeCalendarStats(items),
  };
}

/** Missing-table-safe summary for HQ + daily report. */
export async function getCalendarHQStats(): Promise<CalendarDayStats & { connected: boolean }> {
  try {
    const items = await getCalendarItems();
    return { ...computeCalendarStats(items), connected: true };
  } catch {
    return {
      scheduledToday: 0,
      readyToPublish: 0,
      missingAssets: 0,
      postedToday: 0,
      approved: 0,
      overdue: 0,
      connected: false,
    };
  }
}

/** Items scheduled or published today plus ready/overdue items — used by HQ + daily report. */
export async function getCalendarTodayItems(limit = 20): Promise<ContentCalendarItem[]> {
  try {
    const items = await getCalendarItems();
    const now = new Date();
    return items
      .filter(
        (i) =>
          isSameLocalDay(i.scheduledFor, now) ||
          isSameLocalDay(i.publishedAt, now) ||
          i.status === "ready_to_publish"
      )
      .slice(0, limit);
  } catch {
    return [];
  }
}
