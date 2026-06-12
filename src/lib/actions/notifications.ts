"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import {
  getNotifications,
  getUnreadNotificationCount,
  getUnreadNotifications,
} from "@/lib/notifications/queries";
import type { NotificationFilter, NotificationRow } from "@/lib/notifications/types";

export async function fetchNotifications(
  filter: NotificationFilter = "all"
): Promise<NotificationRow[]> {
  return getNotifications(filter);
}

export async function fetchUnreadNotifications(): Promise<NotificationRow[]> {
  return getUnreadNotifications();
}

export async function fetchUnreadCount(): Promise<number> {
  return getUnreadNotificationCount();
}

export async function markNotificationRead(id: string): Promise<{ ok: boolean }> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    if (error && !isMissingTableError(error)) return { ok: false };
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null);
    if (error && !isMissingTableError(error)) return { ok: false };
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
