import type { NormalizedF5BotAlert } from "@/lib/intelligence/f5bot-types";

export interface RelevanceResult {
  relevant: boolean;
  reason: string;
  category: "plant" | "competitor" | "off_topic" | "unknown";
}

const PLANT_TERMS = [
  "plant", "plants", "houseplant", "houseplants", "indoor plant", "garden", "gardening",
  "monstera", "pothos", "philodendron", "succulent", "cactus", "fern", "orchid", "basil",
  "tomato", "pepper", "herb", "vegetable", "flower", "flowers", "landscap", "lawn",
  "soil", "compost", "mulch", "watering", "overwater", "underwater", "fertiliz",
  "propagat", "cutting", "root rot", "yellow leaf", "yellow leaves", "brown tip",
  "spider mite", "aphid", "fungus gnat", "pests", "grow light", "led grow",
  "repot", "potting mix", "drainage", "humidity", "sunburn", "leaf", "leaves",
  "seedling", "sprout", "bonsai", "hydroponic", "aeroGarden", "plant care",
  "plant clinic", "plant parent", "plant id", "identify plant", "r/houseplants",
  "r/plantclinic", "r/gardening", "r/indoorgarden", "r/succulents", "r/herbs",
];

const COMPETITOR_TERMS = ["planta", "picturethis", "picture this", "plantsnap", "greg app", "blossom", "plant parent app"];

const REJECT_TERMS = [
  "soccer", "football", "basketball", "nba", "nfl", "mlb", "hockey", "tennis", "golf",
  "grounded game", "video game", "gaming", "xbox", "playstation", "steam", "fortnite",
  "crypto", "bitcoin", "ethereum", "stock market", "investing", "forex", "nft",
  "politics", "election", "president", "democrat", "republican", "trump", "biden",
  "dating", "relationship advice", "tinder", "breakup",
  "job opening", "hiring", "resume", "salary", "career advice",
  "movie", "netflix", "celebrity", "kardashian", "music festival",
  "youth soccer", "youth league", "minecraft", "roblox",
];

const PLANT_SUBREDDITS = [
  "houseplants", "plantclinic", "gardening", "indoorgarden", "succulents", "herbs",
  "vegetablegardening", "orchids", "bonsai", "propagation", "plantparenthood",
  "whatsthisplant", "botany", "composting", "lawncare", "landscaping",
];

function blob(alert: NormalizedF5BotAlert, subreddit: string): string {
  return `${alert.title} ${alert.body} ${subreddit} ${alert.matchedKeyword}`.toLowerCase();
}

/** PlantPal relevance gate. Rejects off-topic F5Bot noise before it hits HQ. */
export function assessPlantPalRelevance(
  alert: NormalizedF5BotAlert,
  subreddit = ""
): RelevanceResult {
  const text = blob(alert, subreddit);
  const sub = subreddit.toLowerCase().replace(/^r\//, "");

  for (const term of REJECT_TERMS) {
    if (text.includes(term)) {
      return { relevant: false, reason: `Off-topic: matched "${term}"`, category: "off_topic" };
    }
  }

  if (COMPETITOR_TERMS.some((t) => text.includes(t))) {
    return { relevant: true, reason: "Competitor mention in plant context", category: "competitor" };
  }

  if (sub && PLANT_SUBREDDITS.some((s) => sub.includes(s))) {
    return { relevant: true, reason: `Plant subreddit r/${sub}`, category: "plant" };
  }

  const plantHits = PLANT_TERMS.filter((t) => text.includes(t));
  if (plantHits.length >= 1) {
    return {
      relevant: true,
      reason: `Plant relevance: ${plantHits.slice(0, 3).join(", ")}`,
      category: "plant",
    };
  }

  return {
    relevant: false,
    reason: "No plant, garden, or competitor signals detected",
    category: "off_topic",
  };
}
