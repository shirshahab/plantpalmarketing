import type { NormalizedF5BotAlert } from "@/lib/intelligence/f5bot-types";

export type PlantRelevanceCategory =
  | "plant_care"
  | "houseplants"
  | "gardening"
  | "plant_disease"
  | "plant_pests"
  | "watering"
  | "soil"
  | "fertilizer"
  | "propagation"
  | "plant_identification"
  | "vegetables"
  | "herbs"
  | "flowers"
  | "landscaping"
  | "plant_apps"
  | "competitors"
  | "plant_creators";

export type PlantRejectCategory =
  | "gaming"
  | "sports"
  | "politics"
  | "finance"
  | "crypto"
  | "dating"
  | "jobs"
  | "entertainment"
  | "general_news"
  | "random_comment"
  | "keyword_collision"
  | "spam"
  | "off_topic";

export interface PlantRelevanceScore {
  score: number;
  isRelevant: boolean;
  needsReview: boolean;
  category: PlantRelevanceCategory | PlantRejectCategory;
  reason: string;
  rejectCategory: PlantRejectCategory | null;
  matchedSignals: string[];
  matchedRequiredTopics: string[];
}

/** Topics that must appear (or plant subreddit) for an alert to pass Phase 6 filtering. */
export const PLANTPAL_REQUIRED_TOPICS = [
  "houseplants",
  "gardening",
  "indoor plants",
  "plant care",
  "watering",
  "fertilizer",
  "pests",
  "soil",
  "propagation",
  "monstera",
  "pothos",
  "snake plant",
  "orchids",
  "vegetables",
  "herbs",
  "garden",
] as const;

export const PLANTPAL_MIN_RELEVANCE_SCORE = 80;

const PLANT_SIGNALS: Array<{ term: string; weight: number; category: PlantRelevanceCategory }> = [
  { term: "houseplant", weight: 18, category: "houseplants" },
  { term: "monstera", weight: 16, category: "houseplants" },
  { term: "pothos", weight: 16, category: "houseplants" },
  { term: "philodendron", weight: 16, category: "houseplants" },
  { term: "succulent", weight: 14, category: "houseplants" },
  { term: "indoor plant", weight: 18, category: "houseplants" },
  { term: "plant care", weight: 20, category: "plant_care" },
  { term: "watering", weight: 14, category: "watering" },
  { term: "overwater", weight: 16, category: "watering" },
  { term: "root rot", weight: 18, category: "plant_disease" },
  { term: "yellow leaf", weight: 14, category: "plant_disease" },
  { term: "spider mite", weight: 16, category: "plant_pests" },
  { term: "fungus gnat", weight: 14, category: "plant_pests" },
  { term: "propagat", weight: 14, category: "propagation" },
  { term: "fertiliz", weight: 12, category: "fertilizer" },
  { term: "potting mix", weight: 12, category: "soil" },
  { term: "compost", weight: 12, category: "soil" },
  { term: "grow light", weight: 14, category: "plant_care" },
  { term: "gardening", weight: 16, category: "gardening" },
  { term: "vegetable", weight: 12, category: "vegetables" },
  { term: "herb garden", weight: 12, category: "herbs" },
  { term: "landscap", weight: 12, category: "landscaping" },
  { term: "identify plant", weight: 16, category: "plant_identification" },
  { term: "planta", weight: 20, category: "competitors" },
  { term: "picturethis", weight: 20, category: "competitors" },
  { term: "greg app", weight: 18, category: "competitors" },
  { term: "blossom app", weight: 16, category: "competitors" },
];

const REJECT_SIGNALS: Array<{ term: string; weight: number; category: PlantRejectCategory }> = [
  { term: "grounded game", weight: 40, category: "gaming" },
  { term: "video game", weight: 35, category: "gaming" },
  { term: "xbox", weight: 30, category: "gaming" },
  { term: "playstation", weight: 30, category: "gaming" },
  { term: "minecraft", weight: 30, category: "gaming" },
  { term: "roblox", weight: 30, category: "gaming" },
  { term: "fortnite", weight: 30, category: "gaming" },
  { term: "youth soccer", weight: 35, category: "sports" },
  { term: "soccer", weight: 28, category: "sports" },
  { term: "nba", weight: 28, category: "sports" },
  { term: "nfl", weight: 28, category: "sports" },
  { term: "football", weight: 22, category: "sports" },
  { term: "election", weight: 35, category: "politics" },
  { term: "president", weight: 30, category: "politics" },
  { term: "trump", weight: 35, category: "politics" },
  { term: "biden", weight: 35, category: "politics" },
  { term: "bitcoin", weight: 30, category: "crypto" },
  { term: "crypto", weight: 28, category: "crypto" },
  { term: "stock market", weight: 28, category: "finance" },
  { term: "dating", weight: 28, category: "dating" },
  { term: "tinder", weight: 28, category: "dating" },
  { term: "hiring", weight: 22, category: "jobs" },
  { term: "netflix", weight: 18, category: "entertainment" },
  { term: "celebrity", weight: 22, category: "entertainment" },
];

const PLANT_SUBREDDITS = [
  "houseplants", "plantclinic", "gardening", "indoorgarden", "succulents", "herbs",
  "vegetablegardening", "orchids", "propagation", "plantparenthood", "whatsthisplant",
  "botany", "composting", "lawncare", "landscaping",
];

/** Collision terms: "root", "plant", "grow" alone in non-plant context. */
const COLLISION_PAIRS: Array<{ weak: string; rejectContext: string[] }> = [
  { weak: "root", rejectContext: ["android", "jailbreak", "linux", "server", "game", "sport"] },
  { weak: "plant", rejectContext: ["factory", "nuclear", "power plant", "manufacturing"] },
  { weak: "grow", rejectContext: ["startup", "revenue", "business grow", "career grow"] },
  { weak: "leaf", rejectContext: ["maple leafs", "hockey", "nhl"] },
];

function blob(alert: NormalizedF5BotAlert, subreddit: string): string {
  return `${alert.title} ${alert.body} ${subreddit} ${alert.matchedKeyword}`.toLowerCase();
}

export function matchRequiredTopics(text: string): string[] {
  const lower = text.toLowerCase();
  return PLANTPAL_REQUIRED_TOPICS.filter((topic) => lower.includes(topic));
}

export function scorePlantRelevance(
  alert: NormalizedF5BotAlert,
  subreddit = ""
): PlantRelevanceScore {
  const text = blob(alert, subreddit);
  const sub = subreddit.toLowerCase().replace(/^r\//, "");
  const matchedSignals: string[] = [];
  let rejectScore = 0;
  let plantScore = 0;
  let rejectCategory: PlantRejectCategory | null = null;
  let plantCategory: PlantRelevanceCategory = "plant_care";

  for (const sig of REJECT_SIGNALS) {
    if (text.includes(sig.term)) {
      rejectScore += sig.weight;
      matchedSignals.push(`reject:${sig.term}`);
      rejectCategory = sig.category;
    }
  }

  for (const pair of COLLISION_PAIRS) {
    if (text.includes(pair.weak) && pair.rejectContext.some((c) => text.includes(c))) {
      rejectScore += 25;
      matchedSignals.push(`collision:${pair.weak}`);
      rejectCategory = "keyword_collision";
    }
  }

  if (sub && PLANT_SUBREDDITS.some((s) => sub.includes(s))) {
    plantScore += 35;
    matchedSignals.push(`subreddit:r/${sub}`);
    plantCategory = "gardening";
  }

  for (const sig of PLANT_SIGNALS) {
    if (text.includes(sig.term)) {
      plantScore += sig.weight;
      matchedSignals.push(`plant:${sig.term}`);
      plantCategory = sig.category;
    }
  }

  if (/\bplant(s)?\b/.test(text) && plantScore < 10) {
    plantScore += 8;
    matchedSignals.push("plant:generic");
  }

  const score = Math.max(0, Math.min(100, plantScore - rejectScore));
  const matchedRequiredTopics = matchRequiredTopics(text);
  const inPlantSubreddit = Boolean(sub && PLANT_SUBREDDITS.some((s) => sub.includes(s)));
  const hasRequiredTopic = matchedRequiredTopics.length > 0 || inPlantSubreddit;
  const isRelevant = score >= PLANTPAL_MIN_RELEVANCE_SCORE && hasRequiredTopic;

  if (isRelevant) {
    return {
      score,
      isRelevant: true,
      needsReview: false,
      category: plantCategory,
      reason: `Plant relevance ${score}/100. Topics: ${matchedRequiredTopics.join(", ") || `r/${sub}`}.`,
      rejectCategory: null,
      matchedSignals,
      matchedRequiredTopics,
    };
  }

  const topicReason = !hasRequiredTopic
    ? "No required plant topic match."
    : `Score ${score} below minimum ${PLANTPAL_MIN_RELEVANCE_SCORE}.`;

  return {
    score,
    isRelevant: false,
    needsReview: false,
    category: rejectCategory ?? "off_topic",
    reason: rejectCategory
      ? `Rejected (${rejectCategory}). ${topicReason}`
      : topicReason,
    rejectCategory: rejectCategory ?? "off_topic",
    matchedSignals,
    matchedRequiredTopics,
  };
}

/** Backward-compatible wrapper for existing ingest code. */
export function assessPlantPalRelevanceFromScore(
  alert: NormalizedF5BotAlert,
  subreddit = ""
): { relevant: boolean; needsReview: boolean; score: PlantRelevanceScore } {
  const score = scorePlantRelevance(alert, subreddit);
  return {
    relevant: score.isRelevant,
    needsReview: score.needsReview,
    score,
  };
}
