import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import { runF5BotCronIngest } from "@/lib/intelligence/f5bot-cron-run";
import { computeTrendClusters } from "@/lib/intelligence/trend-clusters";
import { getSavedIntelligenceAlerts } from "@/lib/intelligence/saved-alerts-queries";
import { discoverGardeningTrends } from "@/lib/integrations/providers/serpapi-provider";
import { fetchHQWeather } from "@/lib/hq/hq-weather-service";
import { createPlantAngleFromTrend } from "@/lib/content/trendPlantAngle";
import { writeBlogDraft } from "@/lib/actions/seo-blog";
import { populateVideoQueue, materializeVideoScriptsFromQueue } from "@/lib/pipeline/video-queue";
import { generateDailyIntelligenceBrief } from "@/lib/intelligence/daily-intelligence-brief";
import { enqueueApprovalItem, logAutomationRun } from "@/lib/hq/approval-queue-hub";
import type { Json } from "@/lib/supabase/database.types";

export interface DailyEngineResult {
  success: boolean;
  startedAt: string;
  completedAt: string;
  f5bot: { fetched: number; inserted: number; rejected: number; duplicates: number };
  trends: { count: number; serpTopics: string[] };
  blogDraftsCreated: number;
  socialDraftsCreated: number;
  memeIdeasCreated: number;
  videoIdeasCreated: number;
  imageIdeasCreated: number;
  approvalItemsCreated: number;
  errors: string[];
}

async function generateSocialFromAngles(
  angles: ReturnType<typeof createPlantAngleFromTrend>[],
  weatherLabel: string
): Promise<number> {
  const supabase = createServerClient();
  let created = 0;
  const usable = angles.filter((a) => a.shouldUse).slice(0, 6);

  const platforms: Array<{ platform: string; format: string; field: keyof Pick<ReturnType<typeof createPlantAngleFromTrend>, "suggestedPost" | "memeAngle" | "plantAngle" | "suggestedVideoHook"> }> = [
    { platform: "instagram", format: "post", field: "suggestedPost" },
    { platform: "instagram", format: "post", field: "memeAngle" },
    { platform: "x", format: "post", field: "suggestedPost" },
    { platform: "x", format: "post", field: "plantAngle" },
    { platform: "threads", format: "post", field: "suggestedPost" },
    { platform: "tiktok", format: "script", field: "suggestedVideoHook" },
  ];

  for (let i = 0; i < platforms.length; i++) {
    const spec = platforms[i];
    const angle = usable[i % Math.max(usable.length, 1)];
    if (!angle?.shouldUse) continue;

    const copy = angle[spec.field] || angle.plantAngle;
    if (!copy) continue;

    const sourceTrace = {
      source: "daily_engine",
      originalTrend: angle.originalTrend,
      weather: weatherLabel,
      generatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("social_content_posts")
      .insert({
        platform: spec.platform,
        format: spec.format,
        title: angle.originalTrend.slice(0, 80),
        copy,
        hook: copy.split(".")[0] ?? copy.slice(0, 80),
        caption: copy,
        hashtags: ["#plantparent", "#houseplants", "#plantpal"],
        source_trace: sourceTrace as Json,
        status: "pending_review",
        assigned_agent: "bloom",
        brand_score: 75,
      })
      .select("id")
      .single();

    if (error) {
      if (isMissingTableError(error)) break;
      continue;
    }

    const approvalId = await enqueueApprovalItem({
      type: "social_post",
      title: `${spec.platform} post: ${angle.originalTrend.slice(0, 60)}`,
      summary: copy.slice(0, 200),
      payload: { socialPostId: data?.id, platform: spec.platform },
      sourceTrace,
      assignedAgent: "bloom",
      destination: "/social",
      channel: spec.platform,
      draft: copy,
    });
    if (approvalId) created += 1;
  }

  return created;
}

async function generateMemesFromAngles(angles: ReturnType<typeof createPlantAngleFromTrend>[]): Promise<number> {
  const supabase = createServerClient();
  let created = 0;

  for (const angle of angles.filter((a) => a.shouldUse && a.memeAngle).slice(0, 3)) {
    const sourceTrace = {
      source: "daily_engine",
      originalTrend: angle.originalTrend,
      riskLevel: angle.riskLevel,
    };

    const { data, error } = await supabase
      .from("meme_ideas")
      .insert({
        title: angle.originalTrend.slice(0, 80),
        caption: angle.memeAngle,
        visual_prompt: `PlantPal meme graphic: ${angle.memeAngle}. Friendly green mascot optional, bold text, social-native layout.`,
        platform: "instagram",
        source_trace: sourceTrace as Json,
        risk_level: angle.riskLevel,
        status: "pending_review",
      })
      .select("id")
      .single();

    if (error) {
      if (isMissingTableError(error)) break;
      continue;
    }

    const approvalId = await enqueueApprovalItem({
      type: "meme_idea",
      title: `Meme: ${angle.originalTrend.slice(0, 50)}`,
      summary: angle.memeAngle,
      payload: { memeId: data?.id },
      sourceTrace,
      assignedAgent: "bloom",
      destination: "/images",
      draft: angle.memeAngle,
    });
    if (approvalId) created += 1;
  }

  return created;
}

async function generateImageIdeasFromTrends(trendTitles: string[]): Promise<number> {
  let created = 0;

  for (const title of trendTitles.slice(0, 3)) {
    const angle = createPlantAngleFromTrend({
      title,
      source: "daily_engine",
      summary: title,
    });
    if (!angle.shouldUse) continue;

    const approvalId = await enqueueApprovalItem({
      type: "image_asset",
      title: `Bloom image: ${title.slice(0, 60)}`,
      summary: angle.plantAngle.slice(0, 200),
      payload: { trend: title, route: "bloom_first" },
      sourceTrace: { source: "daily_engine", trend: title, bloomGate: true },
      assignedAgent: "bloom",
      destination: "/bloom",
      draft: angle.plantAngle,
    });
    if (approvalId) created += 1;
  }

  return created;
}

async function createDailyBlogDraft(
  keyword: string,
  sourceTrace: Record<string, unknown>
): Promise<boolean> {
  try {
    const supabase = createServerClient();
    const cleaned = keyword.trim().toLowerCase().slice(0, 120);
    if (cleaned.length < 5) return false;

    const { data: kw, error: kwError } = await supabase
      .from("seo_blog_keywords")
      .insert({
        keyword: cleaned,
        topic_cluster: "daily engine",
        source: "daily_engine",
        priority_score: 85,
        status: "queued",
        search_demand_notes: String(sourceTrace.reason ?? "Daily engine opportunity"),
      })
      .select("id")
      .single();

    if (kwError) {
      const { data: existing } = await supabase
        .from("seo_blog_keywords")
        .select("id")
        .eq("keyword", cleaned)
        .maybeSingle();
      if (!existing) return false;
      const result = await writeBlogDraft(String(existing.id));
      if (result.ok && existing.id) {
        await supabase
          .from("seo_blog_posts")
          .update({ source_trace: sourceTrace as Json, status: "pending_review" })
          .eq("keyword_id", existing.id);
      }
      return result.ok;
    }

    const result = await writeBlogDraft(String(kw!.id));
    if (result.ok) {
      await supabase
        .from("seo_blog_posts")
        .update({ source_trace: sourceTrace as Json, status: "pending_review" })
        .eq("keyword_id", kw!.id);
      await enqueueApprovalItem({
        type: "blog_post",
        title: `Blog draft: ${cleaned}`,
        summary: `Daily blog draft for "${cleaned}"`,
        payload: { keywordId: kw!.id },
        sourceTrace,
        assignedAgent: "bloom",
        destination: "/blog-pipeline",
        channel: "blog",
      });
    }
    return result.ok;
  } catch {
    return false;
  }
}

/** Master daily workflow — real data only. */
export async function runDailyEngine(): Promise<DailyEngineResult> {
  const startedAt = new Date().toISOString();
  const errors: string[] = [];
  let approvalItemsCreated = 0;

  const f5Result = await runF5BotCronIngest().catch((e) => {
    errors.push(e instanceof Error ? e.message : "F5Bot ingest failed");
    return null;
  });

  const { alerts } = await getSavedIntelligenceAlerts({}, 200).catch(() => ({ alerts: [], total: 0 }));
  const liveAlerts = alerts.filter(
    (a) => a.status !== "archived" && a.status !== "needs_review" && a.status !== "ignored"
  );
  const clusters = computeTrendClusters(liveAlerts);

  let serpTopics: string[] = [];
  try {
    serpTopics = await discoverGardeningTrends("ivy");
  } catch (e) {
    errors.push(e instanceof Error ? e.message : "SerpAPI trends failed");
  }

  const weather = await fetchHQWeather().catch(() => null);
  const weatherLabel = weather?.label ?? weather?.condition ?? "Pasadena";

  const trendInputs = [
    ...clusters.slice(0, 3).map((c) => ({
      title: c.label,
      source: "trend_cluster",
      summary: `${c.totalMentions} mentions, ${c.growthPercent}% growth`,
      weatherContext: weatherLabel,
    })),
    ...serpTopics.slice(0, 2).map((t) => ({
      title: t,
      source: "serpapi",
      summary: t,
      weatherContext: weatherLabel,
    })),
  ];

  const angles = trendInputs.map((t) => createPlantAngleFromTrend(t));

  let blogDraftsCreated = 0;
  const blogKeyword =
    angles.find((a) => a.shouldUse)?.suggestedBlogIdea ??
    clusters[0]?.label ??
    serpTopics[0] ??
    "why houseplants get yellow leaves";
  const blogOk = await createDailyBlogDraft(blogKeyword, {
    source: "daily_engine",
    clusters: clusters.map((c) => c.label),
    serpTopics,
    reason: "Top trend + SerpAPI opportunity",
  });
  if (blogOk) blogDraftsCreated = 1;
  else errors.push("Blog draft not created. Check SEO keywords and OpenAI config.");

  const socialDraftsCreated = await generateSocialFromAngles(angles, weatherLabel);
  const memeIdeasCreated = await generateMemesFromAngles(angles);

  await populateVideoQueue(3);
  const videoScripts = await materializeVideoScriptsFromQueue(3);
  const videoIdeasCreated = videoScripts.created;

  const imageIdeasCreated = await generateImageIdeasFromTrends(
    trendInputs.map((t) => t.title)
  );

  approvalItemsCreated = socialDraftsCreated + memeIdeasCreated + imageIdeasCreated + (blogOk ? 1 : 0);

  try {
    await generateDailyIntelligenceBrief();
  } catch (e) {
    errors.push(e instanceof Error ? e.message : "Ivy brief failed");
  }

  const completedAt = new Date().toISOString();
  const result: DailyEngineResult = {
    success: errors.length === 0 || approvalItemsCreated > 0 || (f5Result?.inserted ?? 0) > 0,
    startedAt,
    completedAt,
    f5bot: {
      fetched: f5Result?.totalFromFeed ?? 0,
      inserted: f5Result?.inserted ?? 0,
      rejected: f5Result?.rejectedOffTopic ?? 0,
      duplicates: f5Result?.skippedDuplicates ?? 0,
    },
    trends: { count: clusters.length, serpTopics },
    blogDraftsCreated,
    socialDraftsCreated,
    memeIdeasCreated,
    videoIdeasCreated,
    imageIdeasCreated,
    approvalItemsCreated,
    errors,
  };

  await logAutomationRun({
    runType: "daily_engine",
    status: result.success ? "completed" : "failed",
    summary: result as unknown as Record<string, unknown>,
    errors,
    agentId: "ivy",
  });

  return result;
}
