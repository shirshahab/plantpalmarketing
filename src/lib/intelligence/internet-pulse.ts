import type { SavedIntelligenceAlert } from "@/lib/intelligence/saved-alerts-queries";

export interface InternetPulse {
  trendingTopics: string[];
  trendingKeywords: string[];
  contentOpportunities: number;
  seoOpportunities: number;
  competitorMentions: number;
  communityQuestions: number;
  creatorOpportunities: number;
  newDiscussions: number;
  lastUpdatedAt: string | null;
}

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "is", "it", "my", "i",
  "this", "that", "with", "from", "what", "how", "why", "when", "can", "do", "does", "are", "was",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function topPhrases(alerts: SavedIntelligenceAlert[], limit: number): string[] {
  const counts = new Map<string, number>();

  for (const alert of alerts) {
    const blob = `${alert.title} ${alert.subreddit}`.toLowerCase();
    const words = tokenize(blob);
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      if (bigram.length > 6) counts.set(bigram, (counts.get(bigram) ?? 0) + 1);
    }
    for (const w of words) {
      counts.set(w, (counts.get(w) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([phrase]) => phrase);
}

function titleTopics(alerts: SavedIntelligenceAlert[], limit: number): string[] {
  const seen = new Set<string>();
  const topics: string[] = [];
  for (const alert of alerts) {
    const t = alert.title.replace(/^[^-]+-\s*/, "").trim().slice(0, 80);
    if (!t || t.length < 8) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    topics.push(t);
    if (topics.length >= limit) break;
  }
  return topics;
}

/** Analyze real F5Bot alerts — no fake data. */
export function computeInternetPulse(alerts: SavedIntelligenceAlert[]): InternetPulse {
  const active = alerts.filter((a) => a.status !== "ignored" && a.status !== "archived");

  return {
    trendingTopics: titleTopics(active, 8),
    trendingKeywords: topPhrases(active, 12),
    contentOpportunities: active.filter((a) => a.classification === "content_idea").length,
    seoOpportunities: active.filter((a) => a.classification === "seo_topic").length,
    competitorMentions: active.filter((a) => a.classification === "competitor_alert").length,
    communityQuestions: active.filter((a) => a.classification === "community_opportunity").length,
    creatorOpportunities: active.filter((a) => a.classification === "creator_opportunity").length,
    newDiscussions: active.filter((a) => a.status === "new").length,
    lastUpdatedAt: alerts[0]?.createdAt ?? null,
  };
}
