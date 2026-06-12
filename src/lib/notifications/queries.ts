import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import type { NotificationFilter, NotificationRow } from "@/lib/notifications/types";

function mapRow(row: Record<string, unknown>): NotificationRow {
  return {
    id: String(row.id),
    type: row.type as NotificationRow["type"],
    title: String(row.title),
    message: String(row.message ?? ""),
    targetRoute: String(row.target_route ?? "/"),
    targetTable: row.target_table ? String(row.target_table) : null,
    targetId: row.target_id ? String(row.target_id) : null,
    priority: (row.priority as NotificationRow["priority"]) ?? "medium",
    readAt: row.read_at ? String(row.read_at) : null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
  };
}

const FILTER_TYPES: Record<NotificationFilter, string[] | null> = {
  all: null,
  founder_action: ["founder_action", "approval_needed", "revision_ready"],
  agent_updates: ["agent_completed", "planty_suggestion"],
  failures: ["api_failure", "storage_failure", "brand_voice_failed", "workflow_blocked"],
  calendar: ["calendar_ready", "publish_ready"],
  content: ["asset_ready", "video_ready", "approval_needed", "revision_ready"],
};

export async function getNotifications(
  filter: NotificationFilter = "all",
  limit = 50
): Promise<NotificationRow[]> {
  try {
    const supabase = createServerClient();
    let q = supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(limit);
    const types = FILTER_TYPES[filter];
    if (types) q = q.in("type", types);
    const { data, error } = await q;
    if (error) {
      if (isMissingTableError(error)) return [];
      throw new Error(error.message);
    }
    return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function getUnreadNotifications(limit = 30): Promise<NotificationRow[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      if (isMissingTableError(error)) return [];
      throw new Error(error.message);
    }
    return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const supabase = createServerClient();
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .is("read_at", null);
    if (error) {
      if (isMissingTableError(error)) return 0;
      return 0;
    }
    return count ?? 0;
  } catch {
    return 0;
  }
}
