"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import type { ActionResult } from "@/lib/actions/shared";
import type { ImagePromptCategory } from "@/lib/types";

import { shouldShowDemoData } from "@/lib/demo/shouldShowDemoData";

const DEFAULT_KEYWORDS = shouldShowDemoData()
  ? [
      "monstera yellow leaves",
      "pothos propagation",
      "overwatering signs",
      "grow light setup",
      "root rot rescue",
      "humidity for ferns",
      "succulent watering",
      "spring repotting",
      "spider mites treatment",
      "compost for houseplants",
    ]
  : [];

interface PromptSeed {
  title: string;
  prompt: string;
  category: ImagePromptCategory;
  style: string;
}

async function seedsFromTrends(limit: number): Promise<PromptSeed[]> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("intelligence_alerts")
    .select("title, body")
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((row) => ({
    title: String(row.title).slice(0, 80),
    prompt: `Educational plant care graphic about "${String(row.title)}". Clean PlantPal brand style, warm greens, friendly typography, no clutter.`,
    category: "educational" as ImagePromptCategory,
    style: "PlantPal editorial",
  }));
}

async function seedsFromSeo(limit: number): Promise<PromptSeed[]> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("seo_blog_keywords")
    .select("keyword")
    .in("status", ["new", "queued", "drafted"])
    .order("priority_score", { ascending: false })
    .limit(limit);
  return (data ?? []).map((row) => ({
    title: `SEO visual: ${row.keyword}`,
    prompt: `Instagram carousel slide explaining "${row.keyword}" for beginner plant parents. PlantPal colors, icon-led layout.`,
    category: "social_graphic" as ImagePromptCategory,
    style: "SEO carousel",
  }));
}

async function seedsFromBloom(limit: number): Promise<PromptSeed[]> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("content_pipeline")
    .select("title, body")
    .eq("destination", "bloom")
    .in("status", ["approved", "in_production"])
    .order("updated_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      title: String(r.title).slice(0, 80),
      prompt: `Social asset for Bloom content: ${String(r.body ?? r.title).slice(0, 200)}. Planty mascot optional, premium plant brand aesthetic.`,
      category: "social_graphic" as ImagePromptCategory,
      style: "Bloom production",
    };
  });
}

async function seedsFromF5Bot(limit: number): Promise<PromptSeed[]> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("intelligence_alerts")
    .select("title, subreddit")
    .eq("status", "new")
    .not("subreddit", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((row) => ({
    title: `Community: ${String(row.title).slice(0, 60)}`,
    prompt: `Reply-card graphic for r/${row.subreddit} question: "${row.title}". Helpful tone, PlantPal branding.`,
    category: "social_graphic" as ImagePromptCategory,
    style: "Community response",
  }));
}

function fallbackSeeds(count: number): PromptSeed[] {
  return DEFAULT_KEYWORDS.slice(0, count).map((kw) => ({
    title: kw,
    prompt: `Plant care educational graphic: ${kw}. Minimal, warm, PlantPal brand palette.`,
    category: "educational" as ImagePromptCategory,
    style: "Seasonal default",
  }));
}

async function insertPrompts(seeds: PromptSeed[]): Promise<{ inserted: number; error?: string }> {
  if (seeds.length === 0) return { inserted: 0, error: "No source content found" };
  try {
    const supabase = createServerClient();
    const rows = seeds.map((s) => ({
      title: s.title,
      category: s.category,
      prompt: s.prompt,
      style: s.style,
      status: "pending",
    }));
    const { data, error } = await supabase.from("image_prompts").insert(rows).select("id");
    if (error) {
      if (isMissingTableError(error)) return { inserted: 0, error: "image_prompts table missing" };
      return { inserted: 0, error: error.message };
    }
    return { inserted: data?.length ?? 0 };
  } catch (e) {
    return { inserted: 0, error: e instanceof Error ? e.message : "Insert failed" };
  }
}

export async function generateImageAssetsBatchAction(count: number): Promise<ActionResult> {
  const seeds = [...(await seedsFromF5Bot(count)), ...fallbackSeeds(count)].slice(0, count);
  if (seeds.length === 0) {
    return { ok: false, error: "No live content sources. Run Daily Engine or F5Bot ingest first." };
  }
  const result = await insertPrompts(seeds);
  revalidatePath("/images");
  revalidatePath("/system-health");
  if (result.inserted === 0) return { ok: false, error: result.error ?? "Nothing generated" };
  return { ok: true, message: `Generated ${result.inserted} image prompts` };
}

export async function generateImageFromTrendsAction(): Promise<ActionResult> {
  const seeds = await seedsFromTrends(10);
  const result = await insertPrompts(seeds.length ? seeds : fallbackSeeds(5));
  revalidatePath("/images");
  return result.inserted
    ? { ok: true, message: `Generated ${result.inserted} prompts from trends` }
    : { ok: false, error: result.error ?? "Failed" };
}

export async function generateImageFromSeoAction(): Promise<ActionResult> {
  const seeds = await seedsFromSeo(10);
  const result = await insertPrompts(seeds.length ? seeds : fallbackSeeds(5));
  revalidatePath("/images");
  return result.inserted
    ? { ok: true, message: `Generated ${result.inserted} prompts from SEO keywords` }
    : { ok: false, error: result.error ?? "Failed" };
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

  const [pending, approved, rejected, scheduled, published] = await Promise.all([
    supabase.from("image_prompts").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("image_prompts").select("*", { count: "exact", head: true }).eq("status", "approved").gte("updated_at", since),
    supabase.from("image_prompts").select("*", { count: "exact", head: true }).eq("status", "rejected").gte("updated_at", since),
    supabase.from("content_calendar").select("*", { count: "exact", head: true }).eq("status", "scheduled"),
    supabase.from("content_calendar").select("*", { count: "exact", head: true }).eq("status", "published"),
  ]);

  return {
    pendingReview: pending.count ?? 0,
    approvedToday: approved.count ?? 0,
    rejectedToday: rejected.count ?? 0,
    scheduled: scheduled.count ?? 0,
    published: published.count ?? 0,
  };
}

const MIN_IMAGE_QUEUE = 50;

export async function countPendingImagePrompts(): Promise<number> {
  const supabase = createServerClient();
  const { count } = await supabase
    .from("image_prompts")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");
  return count ?? 0;
}

export async function ensureMinimumImageQueue(min = MIN_IMAGE_QUEUE): Promise<{ refilled: number }> {
  const pending = await countPendingImagePrompts();
  if (pending >= min) return { refilled: 0 };
  const need = Math.min(25, min - pending);
  const result = await generateImageAssetsBatchAction(need);
  return { refilled: result.ok ? need : 0 };
}

export async function generateImageFromBloomAction(): Promise<ActionResult> {
  const seeds = await seedsFromBloom(10);
  const result = await insertPrompts(seeds.length ? seeds : fallbackSeeds(5));
  revalidatePath("/images");
  return result.inserted
    ? { ok: true, message: `Generated ${result.inserted} prompts from Bloom pipeline` }
    : { ok: false, error: result.error ?? "Failed" };
}
