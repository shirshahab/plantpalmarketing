import {
  matchRequiredTopics,
  PLANTPAL_MIN_RELEVANCE_SCORE,
} from "@/lib/intelligence/plantpalRelevance";
import {
  isPollutedCreativeTitle,
  stripRawRedditPrefix,
} from "@/lib/content/creative-routing-guard";
import type { ImagePromptCategory } from "@/lib/types";

export type CleanContentSourceType =
  | "bloom"
  | "founder_idea"
  | "trend"
  | "seo"
  | "reddit_opportunity"
  | "seasonal";

export interface CleanContentSource {
  sourceType: CleanContentSourceType;
  sourceTable: string;
  sourceId: string;
  rawTitle: string;
  rawBody: string;
  format?: "video" | "image" | "both";
  plantRelevanceScore?: number;
  originalUrl?: string;
  keyword?: string;
  trendLabel?: string;
  platform?: string;
  priority?: number;
  imageCategory?: ImagePromptCategory;
}

export interface CleanContentConcept {
  title: string;
  angle: string;
  hook: string;
  format: "video" | "image";
  source_type: CleanContentSourceType;
  source_id: string;
  source_table: string;
  plant_relevance_score: number;
  approved_for_creative: true;
  original_title: string;
  original_url?: string;
  platform?: string;
  priority?: number;
  prompt?: string;
  category?: ImagePromptCategory;
  style?: string;
}

const REJECT_BODY_TERMS = [
  "would you rather",
  "soccer",
  "football",
  "nfl",
  "nba",
  "video game",
  "gaming",
  "politics",
  "election",
  "kiss",
  "dating",
  "crypto",
];

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function extractPlantTopic(text: string): string | null {
  const lower = text.toLowerCase();
  const topics = [
    "monstera", "pothos", "snake plant", "clover", "orchid", "fern", "succulent",
    "basil", "tomato", "herb", "houseplant", "plant",
  ];
  for (const t of topics) {
    if (lower.includes(t)) return t;
  }
  return matchRequiredTopics(lower)[0] ?? null;
}

function buildCleanTitle(problem: string, plantTopic: string | null, sourceType: CleanContentSourceType): string {
  if (sourceType === "bloom" || sourceType === "founder_idea") {
    return problem.slice(0, 100);
  }

  const plant = plantTopic ? capitalize(plantTopic) : "Your plant";
  const blob = problem.toLowerCase();

  if (/root rot|overwater|drowning|soggy|mushy|soup/.test(blob)) {
    return `${plant} Is Not Dead Yet. But It Might Be Drowning.`;
  }
  if (/yellow|wilting|droopy|sad|dying/.test(blob)) {
    return `Why ${plant} Is Looking Sad (And How to Fix It)`;
  }
  if (/pest|mite|bug|gnat|aphid/.test(blob)) {
    return `${plant} Has Unwanted Guests. Here's the Fix.`;
  }
  if (sourceType === "seo") {
    return `Plant Care Guide: ${capitalize(problem.replace(/^SEO:\s*/i, "").slice(0, 60))}`;
  }
  if (sourceType === "trend") {
    return `Trending Plant Topic: ${capitalize(problem.slice(0, 55))}`;
  }

  const short = problem.replace(/[?!.]+$/, "").slice(0, 55).trim();
  return short.length > 10 ? `Plant Fix: ${capitalize(short)}` : `${plant} Care Tip You Need Today`;
}

function buildHook(problem: string, plantTopic: string | null): string {
  const plant = plantTopic ?? "your plant";
  const blob = problem.toLowerCase();
  if (/root rot|overwater|drowning|soggy/.test(blob)) {
    return `${capitalize(plant)} is yellow, sad, and possibly living in soup.`;
  }
  if (/yellow|wilting/.test(blob)) {
    return `If ${plant} looks dramatic, the soil might be telling you something.`;
  }
  return `Plant parents: this ${plant} question comes up more than you'd think.`;
}

function buildAngle(problem: string, plantTopic: string | null, format: "video" | "image"): string {
  const plant = plantTopic ?? "the plant";
  if (format === "image") {
    return `Educational PlantPal ${format} graphic explaining ${problem.slice(0, 120)}. Warm greens, readable typography, on-brand.`;
  }
  return `Short video explaining how to help ${plant}: ${problem.slice(0, 200)}. Show problem, demo fix, CTA to PlantPal.`;
}

function mapSourceTable(source: CleanContentSource): string {
  switch (source.sourceType) {
    case "bloom":
      return "content_pipeline";
    case "founder_idea":
      return "creative_content_ideas";
    case "trend":
      return "approved_trend_concepts";
    case "seo":
      return source.sourceTable.startsWith("seo") ? source.sourceTable : "seo_blog_posts";
    case "reddit_opportunity":
      return "reddit_opportunities";
    case "seasonal":
      return "seasonal_concepts";
    default:
      return source.sourceTable;
  }
}

function shouldReject(source: CleanContentSource): string | null {
  const blob = `${source.rawTitle} ${source.rawBody}`.toLowerCase();

  if (REJECT_BODY_TERMS.some((t) => blob.includes(t)) && source.sourceType === "reddit_opportunity") {
    return "Off-topic discussion";
  }

  if (isPollutedCreativeTitle(source.rawTitle)) {
    if (["bloom", "founder_idea", "seo", "trend", "seasonal"].includes(source.sourceType)) {
      // Will be rewritten — OK if plant relevant
    } else {
      const cleaned = stripRawRedditPrefix(source.rawTitle);
      const hasPlant = matchRequiredTopics(blob).length > 0 || Boolean(extractPlantTopic(`${cleaned} ${source.rawBody}`));
      const score = source.plantRelevanceScore ?? 0;
      if (!hasPlant || score < PLANTPAL_MIN_RELEVANCE_SCORE) {
        return "Polluted or non-plant signal";
      }
    }
  }

  if (source.sourceType === "reddit_opportunity") {
    const score = source.plantRelevanceScore ?? 0;
    const hasPlant = matchRequiredTopics(blob).length > 0 || Boolean(extractPlantTopic(blob));
    if (score < PLANTPAL_MIN_RELEVANCE_SCORE || !hasPlant) {
      return "Insufficient plant relevance";
    }
  }

  return null;
}

/**
 * Convert an approved Bloom/SEO/Trend/Reddit/Founder signal into a clean creative concept.
 * Returns null when the signal must stay in Intelligence/Bloom (not creative-ready).
 */
export function createCleanContentConcept(
  source: CleanContentSource,
  format: "video" | "image" = source.format === "image" ? "image" : "video"
): CleanContentConcept | null {
  const rejectReason = shouldReject(source);
  if (rejectReason) return null;

  let problemText = source.rawBody || source.rawTitle;
  if (source.sourceType === "reddit_opportunity" || isPollutedCreativeTitle(source.rawTitle)) {
    problemText = stripRawRedditPrefix(source.rawTitle) || source.rawBody;
  }
  if (source.sourceType === "seo") {
    problemText = source.keyword ?? source.rawTitle.replace(/^SEO:\s*/i, "");
  }
  if (source.sourceType === "trend") {
    problemText = source.trendLabel ?? source.rawTitle;
  }

  const plantTopic = extractPlantTopic(`${problemText} ${source.rawBody}`);
  const title = buildCleanTitle(problemText, plantTopic, source.sourceType);
  const hook = source.sourceType === "founder_idea" && source.rawBody
    ? source.rawBody.slice(0, 120)
    : buildHook(problemText, plantTopic);
  const angle = buildAngle(problemText, plantTopic, format);

  if (isPollutedCreativeTitle(title)) return null;

  const score = source.plantRelevanceScore ?? (source.sourceType === "bloom" ? 90 : 82);

  return {
    title,
    angle,
    hook,
    format,
    source_type: source.sourceType,
    source_id: source.sourceId,
    source_table: mapSourceTable(source),
    plant_relevance_score: score,
    approved_for_creative: true,
    original_title: source.rawTitle,
    original_url: source.originalUrl,
    platform: source.platform ?? (format === "video" ? "tiktok" : undefined),
    priority: source.priority ?? (source.sourceType === "founder_idea" ? 85 : 75),
    prompt: format === "image" ? angle : undefined,
    category: source.imageCategory ?? (format === "image" ? "social_graphic" : undefined),
    style: format === "image" ? `${capitalize(source.sourceType)} · Bloom gate` : undefined,
  };
}
