export type DiscoveryItemType = "trending_topic" | "question" | "content_opportunity";

export interface DiscoveryItem {
  item_type: DiscoveryItemType;
  title: string;
  description: string;
  source: string;
  relevance_score: number;
}

export interface ContentDraft {
  platform: string;
  format: string;
  hook: string;
  caption: string;
  cta: string;
  viral_score: number;
}

export interface DirectorScores {
  originality: number;
  humor: number;
  emotional_impact: number;
  shareability: number;
  educational_value: number;
  aggregate: number;
  notes: string;
  passed: boolean;
}

export interface ScoredContentDraft extends ContentDraft {
  originality_score: number;
  humor_score: number;
  emotional_impact_score: number;
  shareability_score: number;
  educational_score: number;
  aggregate_score: number;
  director_notes: string;
  rewrite_count: number;
  status: "pending_review" | "approved" | "rejected";
}

export const CONTENT_QUOTAS = [
  { platform: "X", format: "x_post", count: 10 },
  { platform: "TikTok", format: "tiktok_concept", count: 5 },
  { platform: "Instagram", format: "reels_concept", count: 5 },
  { platform: "YouTube", format: "shorts_concept", count: 5 },
  { platform: "Instagram", format: "carousel", count: 3 },
  { platform: "Blog", format: "blog_idea", count: 3 },
] as const;

export const PASS_THRESHOLD = 80;
export const MAX_REWRITES = 3;
