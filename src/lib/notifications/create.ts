import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import type { Json } from "@/lib/supabase/database.types";
import type { CreateNotificationInput, NotificationRow } from "@/lib/notifications/types";

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

/** Phase 40 — create a clickable notification. Gracefully no-ops if table missing. */
export async function createNotification(
  input: CreateNotificationInput
): Promise<NotificationRow | null> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        type: input.type,
        title: input.title,
        message: input.message ?? "",
        target_route: input.targetRoute ?? "/",
        target_table: input.targetTable ?? null,
        target_id: input.targetId ?? null,
        priority: input.priority ?? "medium",
        metadata: (input.metadata ?? {}) as Json,
      })
      .select("*")
      .single();

    if (error) {
      if (isMissingTableError(error)) return null;
      throw new Error(error.message);
    }
    return mapRow(data as Record<string, unknown>);
  } catch {
    return null;
  }
}
