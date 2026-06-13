import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import { getSystemPipelineHealth } from "@/lib/pipeline/system-health";

export interface DailyTargets {
  seoDrafts: number;
  socialPosts: number;
  videoConcepts: number;
  imagePrompts: number;
  redditOpportunities: number;
  trendOpportunities: number;
}

export const CONTENT_FACTORY_TARGETS: DailyTargets = {
  seoDrafts: 10,
  socialPosts: 20,
  videoConcepts: 10,
  imagePrompts: 20,
  redditOpportunities: 5,
  trendOpportunities: 5,
};

export interface ContentFactoryStats {
  targets: DailyTargets;
  today: DailyTargets;
  week: DailyTargets;
  pipelineHealth: Awaited<ReturnType<typeof getSystemPipelineHealth>>;
}

async function countSince(table: string, since: string, filters: Array<{ col: string; val: string | string[]; op?: "eq" | "in" }> = []): Promise<number> {
  try {
    const supabase = createServerClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabase.from(table).select("*", { count: "exact", head: true }).gte("created_at", since);
    for (const f of filters) {
      if (f.op === "in" && Array.isArray(f.val)) q = q.in(f.col, f.val);
      else q = q.eq(f.col, f.val);
    }
    const { count, error } = await q;
    if (error) {
      if (isMissingTableError(error)) return 0;
      return 0;
    }
    return count ?? 0;
  } catch {
    return 0;
  }
}

function rangeStarts() {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const week = new Date(now);
  week.setDate(week.getDate() - 7);
  return { today: today.toISOString(), week: week.toISOString() };
}

async function productionFor(since: string): Promise<DailyTargets> {
  const [seoDrafts, socialPosts, videoConcepts, imagePrompts, redditOpportunities, trendOpportunities] =
    await Promise.all([
      countSince("seo_blog_posts", since),
      countSince("social_content_posts", since),
      countSince("video_generation_queue", since),
      countSince("image_prompts", since),
      countSince("reddit_opportunities", since),
      countSince("intelligence_alerts", since, [
        { col: "classification", val: ["trend", "content_idea", "seo_topic"], op: "in" },
      ]),
    ]);

  return { seoDrafts, socialPosts, videoConcepts, imagePrompts, redditOpportunities, trendOpportunities };
}

export async function getContentFactoryStats(): Promise<ContentFactoryStats> {
  const { today, week } = rangeStarts();
  const [todayStats, weekStats, pipelineHealth] = await Promise.all([
    productionFor(today),
    productionFor(week),
    getSystemPipelineHealth(),
  ]);

  return {
    targets: CONTENT_FACTORY_TARGETS,
    today: todayStats,
    week: weekStats,
    pipelineHealth,
  };
}
