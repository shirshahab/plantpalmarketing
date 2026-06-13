import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";

export interface RedditF5BotIntelligence {
  active: boolean;
  totalRedditAlerts: number;
  highPriorityRedditAlerts: number;
  communityOpportunities: number;
  latestSubreddit: string | null;
  lastIngestedAt: string | null;
}

export async function getRedditF5BotIntelligence(): Promise<RedditF5BotIntelligence> {
  const empty: RedditF5BotIntelligence = {
    active: process.env.F5BOT_ENABLED === "true" && Boolean(process.env.F5BOT_JSON_FEED_URL?.trim()),
    totalRedditAlerts: 0,
    highPriorityRedditAlerts: 0,
    communityOpportunities: 0,
    latestSubreddit: null,
    lastIngestedAt: null,
  };

  if (!empty.active) return empty;

  try {
    const supabase = createServerClient();

    const [totalRes, highRes, communityRes, latestRes, lastRunRes] = await Promise.all([
      supabase
        .from("intelligence_alerts")
        .select("*", { count: "exact", head: true })
        .or("source.ilike.%reddit%,subreddit.neq.")
        .neq("status", "ignored"),
      supabase
        .from("intelligence_alerts")
        .select("*", { count: "exact", head: true })
        .eq("priority", "high")
        .or("source.ilike.%reddit%,subreddit.neq.")
        .neq("status", "archived"),
      supabase
        .from("intelligence_alerts")
        .select("*", { count: "exact", head: true })
        .eq("classification", "community_opportunity")
        .or("source.ilike.%reddit%,subreddit.neq."),
      supabase
        .from("intelligence_alerts")
        .select("subreddit, created_at")
        .or("source.ilike.%reddit%,subreddit.neq.")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("intelligence_runs")
        .select("completed_at, started_at")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    return {
      active: true,
      totalRedditAlerts: totalRes.count ?? 0,
      highPriorityRedditAlerts: highRes.count ?? 0,
      communityOpportunities: communityRes.count ?? 0,
      latestSubreddit: latestRes.data?.subreddit ? String(latestRes.data.subreddit) : null,
      lastIngestedAt:
        lastRunRes.data?.completed_at ??
        lastRunRes.data?.started_at ??
        (latestRes.data?.created_at ? String(latestRes.data.created_at) : null),
    };
  } catch (e) {
    if (e && typeof e === "object" && "message" in e && isMissingTableError(e as { message: string })) {
      return empty;
    }
    return empty;
  }
}
