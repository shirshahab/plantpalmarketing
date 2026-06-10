import { createServerClient } from "@/lib/supabase";
import { getCalendarHQStats, getCalendarTodayItems } from "@/lib/db/calendar-queries";
import { mapAgentActivityLog, mapSproutScheduledPost } from "@/lib/supabase/mappers";
import type { SproutPostStatus } from "@/lib/types";

export async function getSproutScheduledPosts(status?: SproutPostStatus) {
  const supabase = createServerClient();
  let query = supabase.from("sprout_scheduled_posts").select("*").order("scheduled_at", { ascending: true, nullsFirst: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapSproutScheduledPost);
}

export async function getSproutCalendarPosts() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("sprout_scheduled_posts")
    .select("*")
    .in("status", ["ready", "published", "scheduling"])
    .not("scheduled_at", "is", null)
    .order("scheduled_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapSproutScheduledPost);
}

export async function getSproutQueue() {
  return getSproutScheduledPosts("waiting");
}

export async function getSproutActivity(limit = 10) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("agent_activity_log")
    .select("*")
    .eq("agent_id", "sprout")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAgentActivityLog);
}

export async function getSproutStats() {
  const supabase = createServerClient();
  const [waiting, scheduling, ready, published] = await Promise.all([
    supabase.from("sprout_scheduled_posts").select("*", { count: "exact", head: true }).eq("status", "waiting"),
    supabase.from("sprout_scheduled_posts").select("*", { count: "exact", head: true }).eq("status", "scheduling"),
    supabase.from("sprout_scheduled_posts").select("*", { count: "exact", head: true }).eq("status", "ready"),
    supabase.from("sprout_scheduled_posts").select("*", { count: "exact", head: true }).eq("status", "published"),
  ]);
  const approvedBloom = await supabase
    .from("bloom_content_pieces")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");

  return {
    waiting: waiting.count ?? 0,
    scheduling: scheduling.count ?? 0,
    ready: ready.count ?? 0,
    published: published.count ?? 0,
    approvedAwaitingQueue: approvedBloom.count ?? 0,
    total: (waiting.count ?? 0) + (scheduling.count ?? 0) + (ready.count ?? 0) + (published.count ?? 0),
  };
}

export async function getSproutHQData() {
  const [sproutStats, sproutActivity, queue, readyPosts, calendarPosts, calendarStats, calendarToday] =
    await Promise.all([
      getSproutStats(),
      getSproutActivity(8),
      getSproutQueue().then((q) => q.slice(0, 5)),
      getSproutScheduledPosts("ready").then((p) => p.slice(0, 4)),
      getSproutCalendarPosts().then((p) => p.slice(0, 6)),
      getCalendarHQStats(),
      getCalendarTodayItems(6),
    ]);
  return { sproutStats, sproutActivity, queue, readyPosts, calendarPosts, calendarStats, calendarToday };
}
