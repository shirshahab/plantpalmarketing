import { createServerClient } from "@/lib/supabase/server";
import { isRedditConfigured } from "@/lib/reddit/client";
import { matchRequiredTopics } from "@/lib/intelligence/plantpalRelevance";

export interface RedditOpportunityDetail {
  id: string;
  source: "oauth" | "f5bot";
  sourceLabel: string;
  title: string;
  body: string;
  subreddit: string;
  url: string;
  author: string;
  createdAt: string;
  matchedKeyword: string;
  matchedKeywords: string[];
  selectionReason: string;
  relevanceScore: number;
  plantConfidenceScore: number;
  priority: string | null;
  draftReply: string | null;
  draftId: string | null;
  oauthConfigured: boolean;
}

function extractMatchedKeywords(
  title: string,
  body: string,
  alertName: string,
  detected: unknown
): string[] {
  const blob = `${title} ${body} ${alertName}`.toLowerCase();
  const fromTopics = matchRequiredTopics(blob);
  const fromDetected = Array.isArray(detected)
    ? detected.filter((k): k is string => typeof k === "string")
    : [];
  const fromAlert = alertName ? [alertName] : [];
  return [...new Set([...fromTopics, ...fromDetected, ...fromAlert])].slice(0, 12);
}

export async function getRedditOpportunityDetail(
  id: string,
  source: string
): Promise<RedditOpportunityDetail | null> {
  const supabase = createServerClient();
  const oauthConfigured = isRedditConfigured();

  if (source === "f5bot") {
    const { data } = await supabase.from("intelligence_alerts").select("*").eq("id", id).maybeSingle();
    if (!data) return null;
    const { data: draft } = await supabase
      .from("reddit_reply_drafts")
      .select("*")
      .eq("permalink", data.url)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const matchedKeywords = extractMatchedKeywords(
      String(data.title),
      String(data.body),
      String(data.alert_name ?? ""),
      data.detected_keywords
    );
    const relevanceScore = Number(data.relevance_score ?? 0);

    return {
      id: String(data.id),
      source: "f5bot",
      sourceLabel: "F5Bot Intelligence",
      title: String(data.title),
      body: String(data.body),
      subreddit: String(data.subreddit ?? ""),
      url: String(data.url),
      author: String(data.author ?? ""),
      createdAt: String(data.created_at),
      matchedKeyword: String(data.alert_name ?? matchedKeywords[0] ?? ""),
      matchedKeywords,
      selectionReason: String(data.relevance_reason ?? data.classification_reason ?? "Plant-care relevance match"),
      relevanceScore,
      plantConfidenceScore: relevanceScore,
      priority: data.priority ? String(data.priority) : null,
      draftReply: draft ? String(draft.draft_reply) : null,
      draftId: draft ? String(draft.id) : null,
      oauthConfigured,
    };
  }

  const { data: opp } = await supabase.from("reddit_opportunities").select("*").eq("id", id).maybeSingle();
  if (!opp) return null;

  const { data: draft } = await supabase
    .from("reddit_reply_drafts")
    .select("*")
    .eq("opportunity_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const matchedKeywords = extractMatchedKeywords(
    String(opp.title),
    String(opp.question),
    "plant care",
    []
  );
  const risk = Number(opp.risk_score ?? 5);
  const plantConfidence = Math.max(0, Math.min(100, (10 - risk) * 10));

  return {
    id: String(opp.id),
    source: "oauth",
    sourceLabel: "Reddit OAuth Scanner",
    title: String(opp.title),
    body: String(opp.question),
    subreddit: String(opp.subreddit),
    url: opp.permalink?.startsWith("http") ? String(opp.permalink) : `https://reddit.com${opp.permalink}`,
    author: String(opp.author ?? ""),
    createdAt: String(opp.created_at),
    matchedKeyword: matchedKeywords[0] ?? "plant care",
    matchedKeywords,
    selectionReason: `Matched plant-care patterns in r/${opp.subreddit}. Risk score ${risk}/10.`,
    relevanceScore: plantConfidence,
    plantConfidenceScore: plantConfidence,
    priority: risk <= 3 ? "high" : "medium",
    draftReply: draft ? String(draft.draft_reply) : null,
    draftId: draft ? String(draft.id) : null,
    oauthConfigured,
  };
}
