/** Raw internet signals — never enter creative queues without explicit ready flags. */
export const RAW_CREATIVE_BLOCKED_SOURCES = new Set([
  "intelligence_alerts",
  "f5bot_alerts",
  "reddit_comments",
  "reddit_posts",
  "trend_cluster",
]);

export const VIDEO_CREATIVE_SOURCES = new Set([
  "content_pipeline",
  "bloom_content_packages",
  "seo_blog_posts",
  "seo_blog_keywords",
  "approved_trend_concepts",
  "creative_content_ideas",
  "founder_ideas",
  "reddit_opportunities",
]);

export const IMAGE_CREATIVE_SOURCES = new Set([
  "content_pipeline",
  "bloom_content_packages",
  "seo_blog_posts",
  "seo_blog_keywords",
  "approved_trend_concepts",
  "creative_content_ideas",
  "founder_ideas",
  "seasonal_concepts",
]);

export interface CreativeQueueMetadata {
  source_type?: string;
  original_title?: string;
  original_url?: string;
  plant_relevance_score?: number;
  approved_for_creative?: boolean;
  approved_for_video?: boolean;
  approved_for_image?: boolean;
  video_ready?: boolean;
  image_ready?: boolean;
  rejected_reason?: string;
  angle?: string;
  [key: string]: unknown;
}

export const POLLUTED_CREATIVE_TITLE_PATTERNS = [
  /reddit comments/i,
  /reddit posts/i,
  /would you rather/i,
  /\bsoccer\b/i,
  /\bnfl\b/i,
  /\bnba\b/i,
  /\bfootball\b/i,
  /\bvideo game/i,
  /\bgaming\b/i,
  /\bpolitics\b/i,
  /\belection\b/i,
  /\bkiss\b/i,
  /\bnunca es mal/i,
];

export function isPollutedCreativeTitle(title: string): boolean {
  return POLLUTED_CREATIVE_TITLE_PATTERNS.some((p) => p.test(title));
}

export function stripRawRedditPrefix(title: string): string {
  let t = title.trim();
  t = t.replace(/^[\w\s-]+\s*-\s*Reddit Comments\s*-\s*/i, "");
  t = t.replace(/^[\w\s-]+\s*-\s*Reddit Posts\s*-\s*/i, "");
  t = t.replace(/\s*-\s*Reddit Comments\s*-\s*/gi, " — ");
  t = t.replace(/\s*-\s*Reddit Posts\s*-\s*/gi, " — ");
  t = t.replace(/^r\/\w+\s*[-:]\s*/i, "");
  return t.trim();
}

export function isCreativeReadyMetadata(
  metadata: CreativeQueueMetadata | null | undefined,
  queue: "video" | "image"
): boolean {
  if (!metadata) return false;
  if (metadata.approved_for_creative === true) return true;
  if (queue === "video") {
    return metadata.video_ready === true || metadata.approved_for_video === true;
  }
  return metadata.image_ready === true || metadata.approved_for_image === true;
}

export function canEnqueueToCreativeQueue(
  queue: "video" | "image",
  sourceTable: string,
  metadata: CreativeQueueMetadata | null | undefined
): boolean {
  const table = sourceTable.toLowerCase();
  const allowed = queue === "video" ? VIDEO_CREATIVE_SOURCES : IMAGE_CREATIVE_SOURCES;

  if (RAW_CREATIVE_BLOCKED_SOURCES.has(table)) {
    return isCreativeReadyMetadata(metadata, queue);
  }

  if (table === "reddit_opportunities") {
    return isCreativeReadyMetadata(metadata, queue);
  }

  if (allowed.has(table)) {
    return metadata?.approved_for_creative === true || isCreativeReadyMetadata(metadata, queue);
  }

  return isCreativeReadyMetadata(metadata, queue);
}

export function isVisibleCreativeQueueItem(
  queue: "video" | "image",
  status: string,
  sourceTable: string,
  title: string,
  metadata: CreativeQueueMetadata | null | undefined
): boolean {
  if (status === "rejected" || status === "ignored") return false;
  if (isPollutedCreativeTitle(title)) return false;

  const table = sourceTable.toLowerCase();
  if (RAW_CREATIVE_BLOCKED_SOURCES.has(table) && !isCreativeReadyMetadata(metadata, queue)) {
    return false;
  }

  if (status === "pending") {
    return isCreativeReadyMetadata(metadata, queue) || metadata?.approved_for_creative === true;
  }

  return isCreativeReadyMetadata(metadata, queue) || !RAW_CREATIVE_BLOCKED_SOURCES.has(table);
}

export function creativeSourceLabel(
  sourceTable: string,
  metadata?: CreativeQueueMetadata | null
): string {
  const type = String(metadata?.source_type ?? "").toLowerCase();
  const table = sourceTable.toLowerCase();

  if (type === "bloom" || table === "content_pipeline" || table === "bloom_content_packages") return "Bloom";
  if (type === "seo" || table.startsWith("seo_blog")) return "SEO";
  if (type === "trend" || table === "approved_trend_concepts") return "Trend";
  if (type === "reddit_opportunity" || table === "reddit_opportunities") return "Reddit Opportunity";
  if (type === "founder_idea" || table === "creative_content_ideas" || table === "founder_ideas") return "Founder Idea";
  if (type === "seasonal" || table === "seasonal_concepts") return "Seasonal";

  return "Unknown";
}

export interface CleanConceptValidationInput {
  title: string;
  angle?: string;
  hook?: string;
  source_type?: string;
  approved_for_creative?: boolean;
}

/** Returns error message if invalid, null if OK. */
export function validateCleanConcept(input: CleanConceptValidationInput): string | null {
  if (!input.title?.trim()) return "Missing clean title";
  if (!input.angle?.trim() && !input.hook?.trim()) return "Missing angle or concept";
  if (!input.source_type) return "Missing source_type";
  if (input.approved_for_creative !== true) return "Missing approved_for_creative";
  if (isPollutedCreativeTitle(input.title)) return "Polluted title blocked";
  return null;
}

/** Detect legacy polluted rows in creative queues (no metadata flags). */
export function isRawCreativeQueueRow(
  sourceTable: string,
  title: string,
  metadata: CreativeQueueMetadata | null | undefined
): boolean {
  const table = sourceTable.toLowerCase();
  if (RAW_CREATIVE_BLOCKED_SOURCES.has(table)) return !isCreativeReadyMetadata(metadata, "video") && !isCreativeReadyMetadata(metadata, "image");
  if (isPollutedCreativeTitle(title)) return true;
  if (!metadata?.approved_for_creative && !metadata?.video_ready && !metadata?.image_ready) {
    if (table === "" || table === "intelligence_alerts") return true;
  }
  return false;
}
