import { getFounderInbox } from "@/lib/workflow/inbox-queries";
import { getUnreadNotificationCount } from "@/lib/notifications/queries";
import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";

export interface NavBadgeCounts {
  inbox: number;
  calendar: number;
  content: number;
  agents: number;
  system: number;
  notifications: number;
}

/** Phase 40 — red badges on main nav so founder knows where to go. */
export async function getNavBadgeCounts(): Promise<NavBadgeCounts> {
  const defaults: NavBadgeCounts = {
    inbox: 0,
    calendar: 0,
    content: 0,
    agents: 0,
    system: 0,
    notifications: 0,
  };

  try {
    const [inbox, notifications] = await Promise.all([
      getFounderInbox().catch(() => ({ totalPending: 0 })),
      getUnreadNotificationCount(),
    ]);
    defaults.inbox = inbox.totalPending ?? 0;
    defaults.notifications = notifications;

    const supabase = createServerClient();

    const [{ count: calCount }, { count: ideaCount }, { count: taskCount }] = await Promise.all([
      supabase
        .from("content_calendar")
        .select("*", { count: "exact", head: true })
        .in("status", ["approved", "ready_to_publish"]),
      supabase
        .from("creative_content_ideas")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("agent_tasks")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "blocked"]),
    ]);

    defaults.calendar = calCount ?? 0;
    defaults.content = ideaCount ?? 0;
    defaults.agents = taskCount ?? 0;
  } catch (e) {
    if (!isMissingTableError(e instanceof Error ? e : { message: String(e) })) {
      // silent — badges are optional
    }
  }

  return defaults;
}
