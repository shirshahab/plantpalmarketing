/** @deprecated Use scorePlantRelevance from plantpalRelevance.ts */
export { scorePlantRelevance, assessPlantPalRelevanceFromScore } from "@/lib/intelligence/plantpalRelevance";

import type { NormalizedF5BotAlert } from "@/lib/intelligence/f5bot-types";
import { scorePlantRelevance } from "@/lib/intelligence/plantpalRelevance";

export interface RelevanceResult {
  relevant: boolean;
  reason: string;
  category: "plant" | "competitor" | "off_topic" | "unknown";
}

/** Legacy wrapper — maps new scoring to old shape. */
export function assessPlantPalRelevance(
  alert: NormalizedF5BotAlert,
  subreddit = ""
): RelevanceResult {
  const score = scorePlantRelevance(alert, subreddit);
  return {
    relevant: score.isRelevant,
    reason: score.reason,
    category:
      score.isRelevant && String(score.category).includes("competitor")
        ? "competitor"
        : score.isRelevant
          ? "plant"
          : "off_topic",
  };
}
