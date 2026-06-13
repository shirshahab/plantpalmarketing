import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import type { Json } from "@/lib/supabase/database.types";
import {
  createCleanContentConcept,
  type CleanContentSource,
} from "@/lib/content/createCleanContentConcept";
import { enqueueVideoFromCleanConcept } from "@/lib/pipeline/creative-enqueue";
import {
  isPollutedCreativeTitle,
  isVisibleCreativeQueueItem,
  creativeSourceLabel,
  type CreativeQueueMetadata,
} from "@/lib/content/creative-routing-guard";
import { CREATIVE_REJECTION_MESSAGE } from "@/lib/content/creative-rejection-log";

export interface VideoQueueItem {
  id: string;
  title: string;
  concept: string;
  hook: string;
  platform: string;
  status: string;
  priority: number;
  sourceTable: string;
  sourceId: string | null;
  sourceLabel: string;
  metadata: CreativeQueueMetadata;
  createdAt: string;
}

function parseMetadata(raw: unknown): CreativeQueueMetadata {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as CreativeQueueMetadata;
  }
  return {};
}

function mapRow(row: Record<string, unknown>): VideoQueueItem {
  const metadata = parseMetadata(row.metadata);
  const sourceTable = String(row.source_table ?? "");
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    concept: String(row.concept ?? ""),
    hook: String(row.hook ?? ""),
    platform: String(row.platform ?? "tiktok"),
    status: String(row.status ?? "pending"),
    priority: Number(row.priority ?? 50),
    sourceTable,
    sourceId: row.source_id ? String(row.source_id) : null,
    sourceLabel: creativeSourceLabel(sourceTable, metadata),
    metadata,
    createdAt: String(row.created_at),
  };
}

/** Central insert — rejects raw intelligence/F5Bot/Reddit without Bloom transformation. */
export async function enqueueVideoConcept(
  concept: ReturnType<typeof createCleanContentConcept>
): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!concept) {
    return { ok: false, error: CREATIVE_REJECTION_MESSAGE };
  }
  return enqueueVideoFromCleanConcept(concept);
}

export async function getVideoQueueItems(
  limit = 50,
  opts?: { includeHidden?: boolean; status?: string | string[] }
): Promise<VideoQueueItem[]> {
  try {
    const supabase = createServerClient();
    let query = supabase.from("video_generation_queue").select("*");

    if (opts?.status) {
      query = Array.isArray(opts.status)
        ? query.in("status", opts.status)
        : query.eq("status", opts.status);
    } else {
      query = query.in("status", ["pending", "script_generated", "in_production", "review", "approved", "scheduled"]);
    }

    const { data, error } = await query
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit * 2);

    if (error) {
      if (isMissingTableError(error)) return [];
      return [];
    }

    const items = (data ?? []).map((r) => mapRow(r as Record<string, unknown>));

    if (opts?.includeHidden) return items.slice(0, limit);

    return items
      .filter((item) => isVisibleCreativeQueueItem("video", item.status, item.sourceTable, item.title, item.metadata))
      .slice(0, limit);
  } catch {
    return [];
  }
}

export async function getVideoQueueItemById(id: string): Promise<VideoQueueItem | null> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("video_generation_queue")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return mapRow(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

async function collectApprovedVideoSources(limit: number): Promise<CleanContentSource[]> {
  const supabase = createServerClient();
  const sources: CleanContentSource[] = [];

  const [pipeline, seoPosts, seoKeywords, founderIdeas, redditDrafted] = await Promise.all([
    supabase
      .from("content_pipeline")
      .select("id, title, body, metadata")
      .eq("destination", "bloom")
      .eq("status", "approved")
      .order("updated_at", { ascending: false })
      .limit(limit),
    supabase
      .from("seo_blog_posts")
      .select("id, headline, keyword, intro")
      .in("status", ["draft", "gate_review", "pending_review"])
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("seo_blog_keywords")
      .select("id, keyword")
      .in("status", ["queued", "drafted"])
      .order("priority_score", { ascending: false })
      .limit(limit),
    supabase
      .from("creative_content_ideas")
      .select("id, title, hook, body")
      .eq("status", "approved")
      .order("updated_at", { ascending: false })
      .limit(limit),
    supabase
      .from("reddit_opportunities")
      .select("id, title, question, permalink, status")
      .in("status", ["drafted", "answered"])
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  for (const row of pipeline.data ?? []) {
    sources.push({
      sourceType: "bloom",
      sourceTable: "content_pipeline",
      sourceId: String(row.id),
      rawTitle: String(row.title),
      rawBody: String(row.body ?? row.title),
      plantRelevanceScore: 90,
      priority: 82,
    });
  }

  for (const row of founderIdeas.data ?? []) {
    sources.push({
      sourceType: "founder_idea",
      sourceTable: "creative_content_ideas",
      sourceId: String(row.id),
      rawTitle: String(row.title),
      rawBody: String(row.body ?? row.hook ?? row.title),
      plantRelevanceScore: 88,
      priority: 85,
    });
  }

  for (const row of seoPosts.data ?? []) {
    sources.push({
      sourceType: "seo",
      sourceTable: "seo_blog_posts",
      sourceId: String(row.id),
      rawTitle: String(row.headline),
      rawBody: String(row.intro ?? row.headline),
      keyword: String(row.keyword),
      plantRelevanceScore: 85,
      priority: 68,
    });
  }

  for (const row of seoKeywords.data ?? []) {
    sources.push({
      sourceType: "seo",
      sourceTable: "seo_blog_keywords",
      sourceId: String(row.id),
      rawTitle: String(row.keyword),
      rawBody: `Educational short about ${row.keyword}`,
      keyword: String(row.keyword),
      plantRelevanceScore: 82,
      priority: 65,
    });
  }

  for (const row of redditDrafted.data ?? []) {
    sources.push({
      sourceType: "reddit_opportunity",
      sourceTable: "reddit_opportunities",
      sourceId: String(row.id),
      rawTitle: String(row.title),
      rawBody: String(row.question ?? row.title),
      originalUrl: row.permalink?.startsWith("http")
        ? String(row.permalink)
        : row.permalink
          ? `https://reddit.com${row.permalink}`
          : undefined,
      plantRelevanceScore: 85,
      priority: 72,
    });
  }

  const seen = new Set<string>();
  return sources.filter((s) => {
    const key = `${s.sourceTable}:${s.sourceId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);
}

/** Pull only approved, transformed video concepts — never raw intelligence_alerts. */
export async function populateVideoQueue(count: number): Promise<{ inserted: number; error?: string }> {
  const batchSize = Math.min(25, Math.max(1, count));
  try {
    const sources = await collectApprovedVideoSources(batchSize);
    if (sources.length === 0) {
      return {
        inserted: 0,
        error: "No approved video-ready ideas found. Send items from Bloom, Trends, SEO, or Reddit first.",
      };
    }

    let inserted = 0;
    for (const source of sources) {
      const concept = createCleanContentConcept(source, "video");
      const result = await enqueueVideoFromCleanConcept(concept, {
        sourceTable: source.sourceTable,
        sourceId: source.sourceId,
        title: source.rawTitle,
      });
      if (result.ok) inserted += 1;
    }

    return { inserted };
  } catch (e) {
    return { inserted: 0, error: e instanceof Error ? e.message : "Queue failed" };
  }
}

/** Create video_scripts only from video-ready queue items. */
export async function materializeVideoScriptsFromQueue(limit = 10): Promise<{ created: number; error?: string }> {
  try {
    const supabase = createServerClient();
    const { data: queue, error } = await supabase
      .from("video_generation_queue")
      .select("*")
      .eq("status", "pending")
      .order("priority", { ascending: false })
      .limit(limit * 3);

    if (error) {
      if (isMissingTableError(error)) return { created: 0, error: "video_generation_queue missing." };
      return { created: 0, error: error.message };
    }

    const ready = (queue ?? [])
      .map((r) => mapRow(r as Record<string, unknown>))
      .filter((item) => isVisibleCreativeQueueItem("video", item.status, item.sourceTable, item.title, item.metadata))
      .slice(0, limit);

    if (!ready.length) {
      return { created: 0, error: "No video-ready concepts in queue." };
    }

    let created = 0;
    for (const item of ready) {
      const hook = String(item.hook ?? item.title);
      const concept = String(item.concept ?? "");
      const scenes = [
        { label: "Hook", description: hook },
        { label: "Problem", description: concept.slice(0, 200) || "Plant parent struggle moment" },
        { label: "Solution", description: "PlantPal scan + care tip in under 15 seconds" },
        { label: "CTA", description: "Download PlantPal — your plant coach in your pocket" },
      ];
      const { data: script, error: scriptError } = await supabase
        .from("video_scripts")
        .insert({
          title: String(item.title),
          platform: String(item.platform ?? "tiktok"),
          hook,
          scenes: scenes as unknown as Json,
          on_screen_text: [hook.slice(0, 40), "PlantPal fix", "Link in bio"],
          voiceover: `${hook} ${concept.slice(0, 300)}`.trim(),
          cta: "Download PlantPal",
          status: "pending",
        })
        .select("id")
        .single();
      if (scriptError || !script) continue;

      await supabase
        .from("video_generation_queue")
        .update({ status: "script_generated", updated_at: new Date().toISOString() })
        .eq("id", item.id);
      created += 1;
    }
    return { created };
  } catch (e) {
    return { created: 0, error: e instanceof Error ? e.message : "Script creation failed" };
  }
}

export async function countPendingVideoQueue(): Promise<number> {
  const items = await getVideoQueueItems(100, { status: "pending" });
  return items.length;
}

/** Mark polluted raw-intelligence rows as rejected (does not delete). */
export async function cleanupBadVideoQueueItems(): Promise<{ rejected: number; error?: string }> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("video_generation_queue")
      .select("*")
      .neq("status", "rejected")
      .limit(500);

    if (error) {
      if (isMissingTableError(error)) return { rejected: 0, error: "video_generation_queue missing." };
      return { rejected: 0, error: error.message };
    }

    const RAW = new Set(["intelligence_alerts", "f5bot_alerts", "reddit_comments", "reddit_posts"]);
    let rejected = 0;

    for (const row of data ?? []) {
      const r = row as Record<string, unknown>;
      const title = String(r.title ?? "");
      const sourceTable = String(r.source_table ?? "").toLowerCase();
      const metadata = parseMetadata(r.metadata);

      const isBad =
        isPollutedCreativeTitle(title) ||
        RAW.has(sourceTable) ||
        sourceTable === "trend_cluster" ||
        (sourceTable === "intelligence_alerts" && !metadata.video_ready && !metadata.approved_for_creative);

      if (!isBad) continue;

      const nextMeta: CreativeQueueMetadata = {
        ...metadata,
        rejected_reason: "Raw intelligence item entered video queue without transformation",
      };

      const { error: updateError } = await supabase
        .from("video_generation_queue")
        .update({
          status: "rejected",
          metadata: nextMeta as Json,
          updated_at: new Date().toISOString(),
        })
        .eq("id", String(r.id));

      if (!updateError) rejected += 1;
    }

    return { rejected };
  } catch (e) {
    return { rejected: 0, error: e instanceof Error ? e.message : "Cleanup failed" };
  }
}

/** Enqueue a trend cluster as an approved trend concept (transformed). */
export async function enqueueTrendClusterVideoConcept(input: {
  clusterId: string;
  label: string;
  body: string;
  plantRelevanceScore?: number;
}): Promise<{ ok: boolean; error?: string }> {
  const concept = createCleanContentConcept(
    {
      sourceType: "trend",
      sourceTable: "approved_trend_concepts",
      sourceId: input.clusterId,
      rawTitle: input.label,
      rawBody: input.body,
      trendLabel: input.label,
      plantRelevanceScore: input.plantRelevanceScore ?? 85,
      priority: 78,
    },
    "video"
  );
  const result = await enqueueVideoFromCleanConcept(concept, {
    sourceTable: "approved_trend_concepts",
    sourceId: input.clusterId,
    title: input.label,
  });
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}
