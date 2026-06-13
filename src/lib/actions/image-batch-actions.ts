"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import type { ActionResult } from "@/lib/actions/shared";
import {
  createCleanContentConcept,
  type CleanContentSource,
} from "@/lib/content/createCleanContentConcept";
import { enqueueImageFromCleanConcept } from "@/lib/pipeline/creative-enqueue";
import { CREATIVE_REJECTION_MESSAGE } from "@/lib/content/creative-rejection-log";
import {
  CREATIVE_CLEANUP_REJECTION,
  isBadCreativeQueueRow,
  isVisibleCreativeQueueItem,
  type CreativeQueueMetadata,
} from "@/lib/content/creative-routing-guard";

async function collectApprovedImageSources(limit: number): Promise<CleanContentSource[]> {
  const supabase = createServerClient();
  const sources: CleanContentSource[] = [];

  const [pipeline, seoKeywords, seoPosts, founderIdeas] = await Promise.all([
    supabase
      .from("content_pipeline")
      .select("id, title, body")
      .eq("destination", "bloom")
      .in("status", ["approved", "in_production"])
      .order("updated_at", { ascending: false })
      .limit(limit),
    supabase
      .from("seo_blog_keywords")
      .select("id, keyword")
      .in("status", ["queued", "drafted"])
      .order("priority_score", { ascending: false })
      .limit(limit),
    supabase
      .from("seo_blog_posts")
      .select("id, headline, keyword, intro")
      .in("status", ["draft", "gate_review", "pending_review"])
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("creative_content_ideas")
      .select("id, title, hook, body")
      .eq("status", "approved")
      .order("updated_at", { ascending: false })
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
      imageCategory: "social_graphic",
    });
  }

  for (const row of seoKeywords.data ?? []) {
    sources.push({
      sourceType: "seo",
      sourceTable: "seo_blog_keywords",
      sourceId: String(row.id),
      rawTitle: String(row.keyword),
      rawBody: `Visual explaining ${row.keyword}`,
      keyword: String(row.keyword),
      plantRelevanceScore: 85,
      imageCategory: "educational",
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
      imageCategory: "educational",
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
      imageCategory: "social_graphic",
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

async function insertCleanImageBatch(count: number): Promise<{ inserted: number; error?: string }> {
  const sources = await collectApprovedImageSources(count);
  if (sources.length === 0) {
    return {
      inserted: 0,
      error: "No approved image-ready ideas found. Send items from Bloom, SEO, or Trends first.",
    };
  }

  let inserted = 0;
  for (const source of sources) {
    const concept = createCleanContentConcept(source, "image");
    const result = await enqueueImageFromCleanConcept(concept, {
      sourceTable: source.sourceTable,
      sourceId: source.sourceId,
      title: source.rawTitle,
    });
    if (result.ok) inserted += 1;
  }

  return { inserted };
}

export async function generateImageAssetsBatchAction(count: number): Promise<ActionResult> {
  const result = await insertCleanImageBatch(count);
  revalidatePath("/images");
  revalidatePath("/system-health");
  if (result.inserted === 0) {
    return { ok: false, error: result.error ?? CREATIVE_REJECTION_MESSAGE };
  }
  return { ok: true, message: `Generated ${result.inserted} clean image concepts` };
}

export async function generateImageFromTrendsAction(): Promise<ActionResult> {
  return {
    ok: false,
    error: "Trend images must go through Bloom first. Approve a trend cluster, then generate from Bloom.",
  };
}

export async function generateImageFromSeoAction(): Promise<ActionResult> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("seo_blog_keywords")
    .select("id, keyword")
    .in("status", ["queued", "drafted"])
    .order("priority_score", { ascending: false })
    .limit(10);

  let inserted = 0;
  for (const row of data ?? []) {
    const concept = createCleanContentConcept(
      {
        sourceType: "seo",
        sourceTable: "seo_blog_keywords",
        sourceId: String(row.id),
        rawTitle: String(row.keyword),
        rawBody: `SEO visual for ${row.keyword}`,
        keyword: String(row.keyword),
        plantRelevanceScore: 85,
        imageCategory: "educational",
      },
      "image"
    );
    const result = await enqueueImageFromCleanConcept(concept, {
      sourceTable: "seo_blog_keywords",
      sourceId: String(row.id),
      title: String(row.keyword),
    });
    if (result.ok) inserted += 1;
  }

  revalidatePath("/images");
  return inserted
    ? { ok: true, message: `Generated ${inserted} SEO image concepts` }
    : { ok: false, error: "No SEO keywords ready. Queue keywords in SEO Factory first." };
}

export async function generateImageFromBloomAction(): Promise<ActionResult> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("content_pipeline")
    .select("id, title, body")
    .eq("destination", "bloom")
    .in("status", ["approved", "in_production"])
    .order("updated_at", { ascending: false })
    .limit(10);

  let inserted = 0;
  for (const row of data ?? []) {
    const concept = createCleanContentConcept(
      {
        sourceType: "bloom",
        sourceTable: "content_pipeline",
        sourceId: String(row.id),
        rawTitle: String(row.title),
        rawBody: String(row.body ?? row.title),
        plantRelevanceScore: 90,
        imageCategory: "social_graphic",
      },
      "image"
    );
    const result = await enqueueImageFromCleanConcept(concept, {
      sourceTable: "content_pipeline",
      sourceId: String(row.id),
      title: String(row.title),
    });
    if (result.ok) inserted += 1;
  }

  revalidatePath("/images");
  return inserted
    ? { ok: true, message: `Generated ${inserted} Bloom image concepts` }
    : { ok: false, error: "No Bloom packages approved. Approve ideas in Bloom pipeline first." };
}

export async function getImageStudioCounters(): Promise<{
  pendingReview: number;
  approvedToday: number;
  rejectedToday: number;
  scheduled: number;
  published: number;
}> {
  const supabase = createServerClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const since = today.toISOString();

  const [pendingRows, approved, rejected, scheduled, published] = await Promise.all([
    supabase.from("image_prompts").select("title, status, source_table, metadata").eq("status", "pending").limit(500),
    supabase.from("image_prompts").select("*", { count: "exact", head: true }).eq("status", "approved").gte("updated_at", since),
    supabase.from("image_prompts").select("*", { count: "exact", head: true }).eq("status", "rejected").gte("updated_at", since),
    supabase.from("content_calendar").select("*", { count: "exact", head: true }).eq("status", "scheduled"),
    supabase.from("content_calendar").select("*", { count: "exact", head: true }).eq("status", "published"),
  ]);

  const visiblePending = (pendingRows.data ?? []).filter((row) => {
    const r = row as Record<string, unknown>;
    const meta = (r.metadata ?? {}) as CreativeQueueMetadata;
    return isVisibleCreativeQueueItem(
      "image",
      String(r.status ?? "pending"),
      String(r.source_table ?? ""),
      String(r.title ?? ""),
      meta
    );
  }).length;

  return {
    pendingReview: visiblePending,
    approvedToday: approved.count ?? 0,
    rejectedToday: rejected.count ?? 0,
    scheduled: scheduled.count ?? 0,
    published: published.count ?? 0,
  };
}

export async function cleanupBadImagePrompts(): Promise<{ rejected: number; error?: string }> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("image_prompts")
      .select("*")
      .neq("status", "rejected")
      .limit(500);

    if (error) {
      if (isMissingTableError(error)) return { rejected: 0, error: "image_prompts missing." };
      return { rejected: 0, error: error.message };
    }

    let rejected = 0;
    for (const row of data ?? []) {
      const r = row as Record<string, unknown>;
      const title = String(r.title ?? "");
      const meta = (r.metadata ?? {}) as CreativeQueueMetadata;
      const table = String(r.source_table ?? "").toLowerCase();

      const isBad = isBadCreativeQueueRow(
        "image",
        title,
        table,
        meta
      );

      if (!isBad) continue;

      const { error: updateError } = await supabase
        .from("image_prompts")
        .update({
          status: "rejected",
          metadata: { ...meta, rejected_reason: CREATIVE_CLEANUP_REJECTION },
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

export async function cleanupBadImagePromptsAction(): Promise<ActionResult> {
  const result = await cleanupBadImagePrompts();
  revalidatePath("/images");
  revalidatePath("/system-health");
  if (result.error) return { ok: false, error: result.error };
  return { ok: true, message: `Marked ${result.rejected} bad image prompts as rejected.` };
}
