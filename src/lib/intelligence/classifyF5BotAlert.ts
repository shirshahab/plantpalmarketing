import type { IntelligenceClassification, NormalizedF5BotAlert } from "@/lib/intelligence/f5bot-types";

export type F5BotAlertPriority = "low" | "medium" | "high";

export interface F5BotAlertClassification {
  classification: IntelligenceClassification;
  assignedAgent: string | null;
  priority: F5BotAlertPriority;
  reason: string;
  tags: string[];
}

const COMMUNITY_KEYWORDS = [
  "plant help",
  "help my plant",
  "watering help",
  "how often to water",
  "overwater",
  "underwater",
  "yellow leaves",
  "yellow leaf",
  "brown leaves",
  "brown tips",
  "pests",
  "spider mites",
  "aphids",
  "root rot",
  "sunlight",
  "direct sun",
  "bright indirect",
  "soil",
  "potting mix",
  "repot",
  "dying plant",
  "plant dying",
  "leaves falling",
  "wilting",
  "drooping",
  "fungus gnats",
  "mold on soil",
  "what's wrong",
  "what is wrong",
  "identify this plant",
  "is my plant",
];

const CONTENT_KEYWORDS = [
  "viral",
  "trending",
  "hot take",
  "everyone is talking",
  "blew up",
  "went viral",
  "meme",
  "carousel idea",
  "reel idea",
  "tiktok idea",
  "content idea",
  "interesting discussion",
  "common question",
  "people always ask",
  "should i post",
];

const SEO_PATTERNS: Array<{ pattern: RegExp; tag: string }> = [
  { pattern: /\bhow to\b/i, tag: "how-to" },
  { pattern: /\bwhy (does|do|is|are|did)\b/i, tag: "why-question" },
  { pattern: /\bwhat (is|are|causes|caused)\b/i, tag: "what-question" },
  { pattern: /\bbest way to\b/i, tag: "best-way" },
  { pattern: /\bguide\b/i, tag: "guide" },
  { pattern: /\btips\b/i, tag: "tips" },
  { pattern: /\bwhen to\b/i, tag: "when-to" },
  { pattern: /\bcan i\b/i, tag: "can-i" },
  { pattern: /\bshould i\b/i, tag: "should-i" },
];

const COMPETITOR_KEYWORDS = [
  "planta",
  "picturethis",
  "picture this",
  "greg app",
  "greg plant",
  "plantsnap",
  "plant snap",
  "plant care app",
  "plant identification app",
  "plant id app",
  "competitor",
  "better than planta",
];

const CREATOR_KEYWORDS = [
  "creator",
  "influencer",
  "youtuber",
  "youtube channel",
  "tiktok",
  "tiktokker",
  "tiktoker",
  "blog",
  "newsletter",
  "podcast",
  "partnership opportunity",
  "collab",
  "collaboration",
  "ugc",
  "brand deal",
  "plant tuber",
  "planttok",
];

const PRODUCT_FEEDBACK_KEYWORDS = [
  "app complaint",
  "feature request",
  "user frustration",
  "pricing complaint",
  "too expensive",
  "reminder complaint",
  "notification complaint",
  "i wish there was an app",
  "wish there was an app",
  "why doesn't this app",
  "this app sucks",
  "app is broken",
  "bug in the app",
  "plantpal",
  "plant pal",
  "getplantpal",
];

const SPAM_KEYWORDS = ["crypto", "nft", "casino", "viagra", "onlyfans promo", "click here to win"];

const PLANT_CONTEXT_KEYWORDS = [
  "plant",
  "leaf",
  "leaves",
  "soil",
  "water",
  "garden",
  "houseplant",
  "succulent",
  "monstera",
  "pothos",
  "fern",
  "basil",
  "tomato",
  "herb",
  "bonsai",
  "repot",
  "fertiliz",
  "sunlight",
  "indoor garden",
];

const QUESTION_SIGNALS = [/\?/, /\bhelp\b/i, /\bhow\b/i, /\bwhy\b/i, /\bwhat should\b/i];

function textBlob(alert: NormalizedF5BotAlert): string {
  return `${alert.title} ${alert.body} ${alert.matchedKeyword}`.toLowerCase();
}

function findMatches(blob: string, keywords: string[]): string[] {
  return keywords.filter((kw) => blob.includes(kw.toLowerCase()));
}

function hasQuestionSignal(blob: string): boolean {
  return QUESTION_SIGNALS.some((p) => p.test(blob));
}

function hasPlantContext(blob: string): boolean {
  return findMatches(blob, PLANT_CONTEXT_KEYWORDS).length > 0;
}

function findSeoTags(blob: string): string[] {
  return SEO_PATTERNS.filter(({ pattern }) => pattern.test(blob)).map(({ tag }) => tag);
}

/**
 * Phase 3 — classify every F5Bot alert before it appears in HQ.
 * Pure function; no database writes.
 */
export function classifyF5BotAlert(alert: NormalizedF5BotAlert): F5BotAlertClassification {
  const blob = textBlob(alert);
  const tags: string[] = [];

  const communityHits = findMatches(blob, COMMUNITY_KEYWORDS);
  const contentHits = findMatches(blob, CONTENT_KEYWORDS);
  const competitorHits = findMatches(blob, COMPETITOR_KEYWORDS);
  const creatorHits = findMatches(blob, CREATOR_KEYWORDS);
  const feedbackHits = findMatches(blob, PRODUCT_FEEDBACK_KEYWORDS);
  const spamHits = findMatches(blob, SPAM_KEYWORDS);
  const seoTags = findSeoTags(blob);
  const question = hasQuestionSignal(blob);
  const plantContext = hasPlantContext(blob);

  if (competitorHits.length > 0) {
    tags.push(...competitorHits.slice(0, 4), "competitor");
    return {
      classification: "competitor_alert",
      assignedAgent: "sentinel",
      priority: "high",
      reason: `Competitor or plant-app mention detected (${competitorHits[0]}).`,
      tags: [...new Set(tags)],
    };
  }

  if (feedbackHits.length > 0) {
    tags.push(...feedbackHits.slice(0, 4), "product-feedback");
    return {
      classification: "product_feedback",
      assignedAgent: "echo",
      priority: "high",
      reason: `Product feedback or app frustration signal (${feedbackHits[0]}).`,
      tags: [...new Set(tags)],
    };
  }

  if (communityHits.length > 0 || (question && plantContext)) {
    tags.push(...communityHits.slice(0, 4));
    if (question) tags.push("question");
    if (plantContext) tags.push("plant-care");
    const urgent =
      blob.includes("dying") ||
      blob.includes("root rot") ||
      blob.includes("emergency") ||
      communityHits.some((h) => h.includes("dying") || h.includes("root rot"));
    return {
      classification: "community_opportunity",
      assignedAgent: "roots",
      priority: urgent || question ? "high" : "medium",
      reason: communityHits[0]
        ? `Plant care / community help signal (${communityHits[0]}).`
        : "Question about plant care detected.",
      tags: [...new Set(tags)],
    };
  }

  if (creatorHits.length > 0) {
    tags.push(...creatorHits.slice(0, 4), "creator");
    return {
      classification: "creator_opportunity",
      assignedAgent: "oak",
      priority: "medium",
      reason: `Creator or partnership signal (${creatorHits[0]}).`,
      tags: [...new Set(tags)],
    };
  }

  if (seoTags.length > 0 && (question || plantContext)) {
    tags.push(...seoTags, "seo");
    return {
      classification: "seo_topic",
      assignedAgent: "petal",
      priority: "medium",
      reason: `Google-searchable question pattern (${seoTags[0]}).`,
      tags: [...new Set(tags)],
    };
  }

  if (contentHits.length > 0 || (question && !plantContext)) {
    tags.push(...contentHits.slice(0, 4));
    if (question) tags.push("question");
    tags.push("content");
    return {
      classification: "content_idea",
      assignedAgent: "bloom",
      priority: "medium",
      reason: contentHits[0]
        ? `Content-worthy discussion (${contentHits[0]}).`
        : "Common question that could become content.",
      tags: [...new Set(tags)],
    };
  }

  if (spamHits.length > 0 || blob.trim().length < 25 || (!plantContext && !question && blob.length < 120)) {
    if (spamHits.length) tags.push(...spamHits.slice(0, 2), "spam");
    else tags.push("low-signal");
    return {
      classification: "ignore",
      assignedAgent: null,
      priority: "low",
      reason: spamHits.length
        ? "Likely spam or off-topic noise."
        : "Low-quality or unrelated — not useful for PlantPal.",
      tags: [...new Set(tags)],
    };
  }

  if (plantContext) {
    tags.push("plant-context", "general");
    return {
      classification: "content_idea",
      assignedAgent: "bloom",
      priority: "medium",
      reason: "Plant-related discussion without a stronger signal — defaulting to content review.",
      tags,
    };
  }

  tags.push("unclassified");
  return {
    classification: "ignore",
    assignedAgent: null,
    priority: "low",
    reason: "No clear plant, community, or content signal.",
    tags,
  };
}
