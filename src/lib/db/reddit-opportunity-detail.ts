import { createServerClient } from "@/lib/supabase/server";
import { isRedditConfigured } from "@/lib/reddit/client";

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
  selectionReason: string;
  confidenceScore: number;
  priority: string | null;
  draftReply: string | null;
  draftId: string | null;
  oauthConfigured: boolean;
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
      matchedKeyword: String(data.alert_name ?? ""),
      selectionReason: String(data.classification_reason ?? data.classification ?? "Community opportunity"),
      confidenceScore: data.priority === "high" ? 9 : data.priority === "medium" ? 6 : 4,
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
    matchedKeyword: "plant question",
    selectionReason: `Risk score ${opp.risk_score}. Matched plant-care question patterns.`,
    confidenceScore: Math.max(1, 10 - Number(opp.risk_score ?? 5)),
    priority: Number(opp.risk_score ?? 5) <= 3 ? "high" : "medium",
    draftReply: draft ? String(draft.draft_reply) : null,
    draftId: draft ? String(draft.id) : null,
    oauthConfigured,
  };
}
