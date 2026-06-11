import { createServerClient } from "@/lib/supabase";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import type { Json } from "@/lib/supabase/database.types";
import type { VoiceCheckResult } from "@/lib/seo/voice-checker";

export interface SeoKeyword {
  id: string;
  keyword: string;
  topicCluster: string;
  source: string;
  searchVolumeEstimate: number;
  difficulty: number;
  priorityScore: number;
  searchDemandNotes: string;
  status: string;
  createdAt: string;
}

export interface SeoBlogPost {
  id: string;
  keywordId: string | null;
  keyword: string;
  headline: string;
  seoTitle: string;
  metaDescription: string;
  slug: string;
  intro: string;
  sections: { subhead: string; body: string }[];
  faq: { question: string; answer: string }[];
  cta: string;
  internalLinks: { anchor: string; url: string }[];
  html: string;
  schemaMarkup: Record<string, unknown>;
  wordCount: number;
  status: string;
  riskLevel: string;
  voiceCheck: VoiceCheckResult | null;
  voiceCheckPassed: boolean;
  reviewFeedback: string;
  publishedUrl: string;
  publishedAt: string | null;
  backlinks: { url: string; anchor: string }[];
  createdAt: string;
}

export interface SeoPublishLog {
  id: string;
  postId: string | null;
  action: string;
  status: string;
  publishedUrl: string;
  errorMessage: string;
  createdAt: string;
}

function asArray<T>(value: Json, map: (o: Record<string, unknown>) => T): T[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => map((v && typeof v === "object" ? v : {}) as Record<string, unknown>));
}

function mapPost(row: {
  id: string;
  keyword_id: string | null;
  keyword: string;
  headline: string;
  seo_title: string;
  meta_description: string;
  slug: string;
  intro: string;
  sections: Json;
  faq: Json;
  cta: string;
  internal_links: Json;
  html: string;
  schema_markup: Json;
  word_count: number;
  status: string;
  risk_level: string;
  voice_check: Json;
  voice_check_passed: boolean;
  review_feedback: string;
  published_url: string;
  published_at: string | null;
  backlinks: Json;
  created_at: string;
}): SeoBlogPost {
  const vc = row.voice_check;
  return {
    id: row.id,
    keywordId: row.keyword_id,
    keyword: row.keyword,
    headline: row.headline,
    seoTitle: row.seo_title,
    metaDescription: row.meta_description,
    slug: row.slug,
    intro: row.intro,
    sections: asArray(row.sections, (o) => ({ subhead: String(o.subhead ?? ""), body: String(o.body ?? "") })),
    faq: asArray(row.faq, (o) => ({ question: String(o.question ?? ""), answer: String(o.answer ?? "") })),
    cta: row.cta,
    internalLinks: asArray(row.internal_links, (o) => ({ anchor: String(o.anchor ?? ""), url: String(o.url ?? "") })),
    html: row.html,
    schemaMarkup:
      row.schema_markup && typeof row.schema_markup === "object" && !Array.isArray(row.schema_markup)
        ? (row.schema_markup as Record<string, unknown>)
        : {},
    wordCount: row.word_count,
    status: row.status,
    riskLevel: row.risk_level,
    voiceCheck:
      vc && typeof vc === "object" && !Array.isArray(vc) && "violations" in (vc as object)
        ? (vc as unknown as VoiceCheckResult)
        : null,
    voiceCheckPassed: row.voice_check_passed,
    reviewFeedback: row.review_feedback,
    publishedUrl: row.published_url,
    publishedAt: row.published_at,
    backlinks: asArray(row.backlinks, (o) => ({ url: String(o.url ?? ""), anchor: String(o.anchor ?? "") })),
    createdAt: row.created_at,
  };
}

export async function getSeoKeywords(): Promise<SeoKeyword[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("seo_blog_keywords")
    .select("*")
    .order("priority_score", { ascending: false })
    .limit(100);
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    keyword: row.keyword,
    topicCluster: row.topic_cluster,
    source: row.source,
    searchVolumeEstimate: row.search_volume_estimate,
    difficulty: row.difficulty,
    priorityScore: row.priority_score,
    searchDemandNotes: row.search_demand_notes,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export async function getSeoBlogPosts(): Promise<SeoBlogPost[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("seo_blog_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map(mapPost);
}

export async function getSeoPublishLogs(limit = 20): Promise<SeoPublishLog[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("seo_blog_publish_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    postId: row.post_id,
    action: row.action,
    status: row.status,
    publishedUrl: row.published_url,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  }));
}

export interface SeoTopic {
  id: string;
  topic: string;
  question: string;
  clusterName: string;
  source: string;
  status: string;
}

export interface SeoCluster {
  id: string;
  name: string;
  description: string;
  targetPosts: number;
}

export interface SeoRankRow {
  id: string;
  keyword: string;
  position: number | null;
  url: string;
  checkedAt: string;
}

export async function getSeoTopics(): Promise<SeoTopic[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("seo_topics")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map((t) => ({
    id: t.id,
    topic: t.topic,
    question: t.question,
    clusterName: t.cluster_name,
    source: t.source,
    status: t.status,
  }));
}

export async function getSeoClusters(): Promise<SeoCluster[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("seo_clusters").select("*").order("name");
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    targetPosts: c.target_posts,
  }));
}

export async function getSeoRankTracking(): Promise<SeoRankRow[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("seo_rank_tracking")
    .select("*")
    .order("checked_at", { ascending: false })
    .limit(30);
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map((r) => ({
    id: r.id,
    keyword: r.keyword,
    position: r.position,
    url: r.url,
    checkedAt: r.checked_at,
  }));
}

export async function getSeoPageData() {
  const [keywords, posts, logs, topics, clusters, rankRows] = await Promise.all([
    getSeoKeywords(),
    getSeoBlogPosts(),
    getSeoPublishLogs(),
    getSeoTopics(),
    getSeoClusters(),
    getSeoRankTracking(),
  ]);
  const published = posts.filter((p) => p.status === "published");
  return {
    keywords,
    posts,
    logs,
    topics,
    clusters,
    rankRows,
    stats: {
      totalKeywords: keywords.length,
      drafted: posts.length,
      inReview: posts.filter((p) => p.status === "gate_review" || p.status === "voice_check_failed").length,
      readyToPublish: posts.filter((p) => p.status === "ready_to_publish" || p.status === "approved").length,
      published: published.length,
      backlinks: published.reduce((sum, p) => sum + p.backlinks.length, 0),
    },
    cmsConfigured: Boolean(process.env.BLOG_CMS_WEBHOOK_URL?.trim()),
  };
}
