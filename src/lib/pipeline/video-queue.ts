import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import type { Json } from "@/lib/supabase/database.types";

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
  createdAt: string;
}

function mapRow(row: Record<string, unknown>): VideoQueueItem {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    concept: String(row.concept ?? ""),
    hook: String(row.hook ?? ""),
    platform: String(row.platform ?? "tiktok"),
    status: String(row.status ?? "pending"),
    priority: Number(row.priority ?? 50),
    sourceTable: String(row.source_table ?? ""),
    sourceId: row.source_id ? String(row.source_id) : null,
    createdAt: String(row.created_at),
  };
}

export async function getVideoQueueItems(limit = 30, status?: string | string[]): Promise<VideoQueueItem[]> {
  try {
    const supabase = createServerClient();
    let query = supabase.from("video_generation_queue").select("*");
    if (status) {
      query = Array.isArray(status) ? query.in("status", status) : query.eq("status", status);
    } else {
      query = query.in("status", ["pending", "script_generated", "in_production", "review", "approved", "scheduled"]);
    }
    const { data, error } = await query
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      if (isMissingTableError(error)) return [];
      return [];
    }
    return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
  } catch {
    return [];
  }
}

interface ConceptSeed {
  title: string;
  concept: string;
  hook: string;
  platform: string;
  priority: number;
  sourceTable: string;
  sourceId?: string;
}

async function collectConceptSeeds(limit: number): Promise<ConceptSeed[]> {
  const supabase = createServerClient();
  const seeds: ConceptSeed[] = [];

  const [bloom, trends, reddit, seo, ideas] = await Promise.all([
    supabase
      .from("content_pipeline")
      .select("id, title, body")
      .eq("destination", "bloom")
      .eq("status", "approved")
      .order("updated_at", { ascending: false })
      .limit(limit),
    supabase
      .from("intelligence_alerts")
      .select("id, title, body, priority")
      .eq("status", "new")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("reddit_opportunities")
      .select("id, title, question")
      .in("status", ["found", "drafted"])
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("seo_blog_keywords")
      .select("id, keyword")
      .in("status", ["new", "queued", "drafted"])
      .order("priority_score", { ascending: false })
      .limit(limit),
    supabase
      .from("creative_content_ideas")
      .select("id, title, hook")
      .eq("status", "approved")
      .order("updated_at", { ascending: false })
      .limit(limit),
  ]);

  for (const row of bloom.data ?? []) {
    seeds.push({
      title: String(row.title),
      concept: String(row.body ?? row.title).slice(0, 400),
      hook: String(row.title).slice(0, 120),
      platform: "tiktok",
      priority: 80,
      sourceTable: "content_pipeline",
      sourceId: String(row.id),
    });
  }
  for (const row of trends.data ?? []) {
    seeds.push({
      title: String(row.title).slice(0, 100),
      concept: String(row.body ?? row.title).slice(0, 400),
      hook: `Trending: ${String(row.title).slice(0, 80)}`,
      platform: "reels",
      priority: row.priority === "high" ? 75 : 60,
      sourceTable: "intelligence_alerts",
      sourceId: String(row.id),
    });
  }
  for (const row of reddit.data ?? []) {
    seeds.push({
      title: String(row.title).slice(0, 100),
      concept: String(row.question ?? row.title).slice(0, 400),
      hook: `Answer this plant question: ${String(row.title).slice(0, 70)}`,
      platform: "tiktok",
      priority: 70,
      sourceTable: "reddit_opportunities",
      sourceId: String(row.id),
    });
  }
  for (const row of seo.data ?? []) {
    seeds.push({
      title: `SEO: ${row.keyword}`,
      concept: `Educational short answering "${row.keyword}" for PlantPal audience.`,
      hook: `Stop guessing about ${row.keyword}`,
      platform: "youtube_shorts",
      priority: 65,
      sourceTable: "seo_blog_keywords",
      sourceId: String(row.id),
    });
  }
  for (const row of ideas.data ?? []) {
    seeds.push({
      title: String(row.title),
      concept: String(row.hook ?? row.title),
      hook: String(row.hook ?? row.title).slice(0, 120),
      platform: "tiktok",
      priority: 85,
      sourceTable: "creative_content_ideas",
      sourceId: String(row.id),
    });
  }

  const seen = new Set<string>();
  return seeds
    .filter((s) => {
      const key = `${s.sourceTable}:${s.sourceId ?? s.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

/** Pull concepts from approved Bloom items, trends, Reddit, SEO, and founder ideas. */
export async function populateVideoQueue(count: number): Promise<{ inserted: number; error?: string }> {
  const batchSize = Math.min(25, Math.max(1, count));
  try {
    const supabase = createServerClient();
    const seeds = await collectConceptSeeds(batchSize);
    if (seeds.length === 0) {
      return { inserted: 0, error: "No source content found. Approve ideas, run F5Bot, or add SEO keywords first." };
    }

    const rows = seeds.map((s) => ({
      title: s.title,
      concept: s.concept,
      hook: s.hook,
      platform: s.platform,
      status: "pending",
      priority: s.priority,
      source_table: s.sourceTable,
      source_id: s.sourceId ?? null,
      metadata: { autoQueued: true } as Json,
    }));

    const { data, error } = await supabase.from("video_generation_queue").insert(rows).select("id");
    if (error) {
      if (isMissingTableError(error)) return { inserted: 0, error: "video_generation_queue missing. Run migration 064." };
      return { inserted: 0, error: error.message };
    }
    return { inserted: data?.length ?? 0 };
  } catch (e) {
    return { inserted: 0, error: e instanceof Error ? e.message : "Queue failed" };
  }
}

/** Create video_scripts from queue items so Video Studio has content to work with. */
export async function materializeVideoScriptsFromQueue(limit = 10): Promise<{ created: number; error?: string }> {
  try {
    const supabase = createServerClient();
    const { data: queue, error } = await supabase
      .from("video_generation_queue")
      .select("*")
      .eq("status", "pending")
      .order("priority", { ascending: false })
      .limit(limit);
    if (error) {
      if (isMissingTableError(error)) return { created: 0, error: "video_generation_queue missing." };
      return { created: 0, error: error.message };
    }
    if (!queue?.length) return { created: 0, error: "Queue is empty. Run Generate 10 Videos first." };

    let created = 0;
    for (const item of queue) {
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

const MIN_VIDEO_QUEUE = 20;

export async function countPendingVideoQueue(): Promise<number> {
  try {
    const supabase = createServerClient();
    const { count, error } = await supabase
      .from("video_generation_queue")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending", "script_generated", "in_production"]);
    if (error) {
      if (isMissingTableError(error)) return 0;
      return 0;
    }
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** Auto-refill video queue when below minimum pending count. */
export async function ensureMinimumVideoQueue(min = MIN_VIDEO_QUEUE): Promise<{ refilled: number }> {
  const pending = await countPendingVideoQueue();
  if (pending >= min) return { refilled: 0 };
  const need = min - pending;
  const batch = Math.min(25, Math.max(10, need));
  const result = await populateVideoQueue(batch);
  if (result.inserted > 0) {
    await materializeVideoScriptsFromQueue(Math.min(result.inserted, 10));
  }
  return { refilled: result.inserted };
}
