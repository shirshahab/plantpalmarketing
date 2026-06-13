import { createServerClient } from "@/lib/supabase";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import { isRedditConfigured } from "@/lib/reddit/client";
import { getRedditSafetyRules, type RedditSafetyRules } from "@/lib/reddit/safety";
import { getRedditF5BotIntelligence } from "@/lib/intelligence/reddit-intelligence-stats";

export interface RedditAccountRow {
  id: string;
  username: string;
  status: string;
  karma: number;
  accountAgeDays: number;
  monitoredSubreddits: string[];
  rateLimitRemaining: number;
  lastCheckedAt: string | null;
  notes: string;
}

export interface RedditOpportunityRow {
  id: string;
  subreddit: string;
  postId: string;
  permalink: string;
  author: string;
  title: string;
  question: string;
  riskScore: number;
  status: string;
  createdAt: string;
}

export interface RedditDraftRow {
  id: string;
  opportunityId: string | null;
  subreddit: string;
  postId: string;
  permalink: string;
  author: string;
  question: string;
  draftReply: string;
  approvedReply: string;
  status: string;
  riskScore: number;
  reviewFeedback: string;
  postedAt: string | null;
  publishedUrl: string;
  errorMessage: string;
  createdAt: string;
}

export interface RedditLogRow {
  id: string;
  subreddit: string;
  action: string;
  status: string;
  publishedUrl: string;
  errorMessage: string;
  rateLimitRemaining: number | null;
  upvotes: number;
  engagementNote: string;
  createdAt: string;
}

export interface RedditPageData {
  configured: boolean;
  account: RedditAccountRow | null;
  opportunities: RedditOpportunityRow[];
  drafts: RedditDraftRow[];
  logs: RedditLogRow[];
  safetyRules: RedditSafetyRules;
  postedToday: number;
  f5botIntelligence: import("@/lib/intelligence/reddit-intelligence-stats").RedditF5BotIntelligence;
  f5botCommunityAlerts: Array<{
    id: string;
    title: string;
    body: string;
    subreddit: string;
    url: string;
    priority: string | null;
    matchedKeyword: string;
    relevanceScore: number | null;
    createdAt: string;
  }>;
}

export async function getRedditPageData(): Promise<RedditPageData> {
  const supabase = createServerClient();
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const [accountRes, oppsRes, draftsRes, logsRes, todayRes, safetyRules, f5botIntelligence, f5botAlertsRes] =
    await Promise.all([
    supabase.from("reddit_accounts").select("*").order("created_at").limit(1).maybeSingle(),
    supabase.from("reddit_opportunities").select("*").order("created_at", { ascending: false }).limit(30),
    supabase.from("reddit_reply_drafts").select("*").order("created_at", { ascending: false }).limit(30),
    supabase.from("reddit_publish_logs").select("*").order("created_at", { ascending: false }).limit(20),
    supabase
      .from("reddit_publish_logs")
      .select("id", { count: "exact", head: true })
      .eq("status", "success")
      .gte("created_at", dayStart.toISOString()),
    getRedditSafetyRules(),
    getRedditF5BotIntelligence(),
    supabase
      .from("intelligence_alerts")
      .select("id, title, body, subreddit, url, priority, alert_name, relevance_score, created_at")
      .eq("classification", "community_opportunity")
      .or("source.ilike.%reddit%,subreddit.neq.")
      .neq("status", "archived")
      .gte("relevance_score", 80)
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  const missing = [accountRes.error, oppsRes.error, draftsRes.error, logsRes.error].some(
    (e) => e && !isMissingTableError(e)
  );
  if (missing) {
    const firstError = [accountRes.error, oppsRes.error, draftsRes.error, logsRes.error].find(
      (e) => e && !isMissingTableError(e)
    );
    throw new Error(firstError?.message ?? "Failed to load Reddit data");
  }

  const account = accountRes.data
    ? {
        id: accountRes.data.id,
        username: accountRes.data.username,
        status: accountRes.data.status,
        karma: accountRes.data.karma,
        accountAgeDays: accountRes.data.account_age_days,
        monitoredSubreddits: accountRes.data.monitored_subreddits ?? [],
        rateLimitRemaining: accountRes.data.rate_limit_remaining,
        lastCheckedAt: accountRes.data.last_checked_at,
        notes: accountRes.data.notes,
      }
    : null;

  return {
    configured: isRedditConfigured(),
    account,
    opportunities: (oppsRes.data ?? []).map((row) => ({
      id: row.id,
      subreddit: row.subreddit,
      postId: row.post_id,
      permalink: row.permalink,
      author: row.author,
      title: row.title,
      question: row.question,
      riskScore: row.risk_score,
      status: row.status,
      createdAt: row.created_at,
    })),
    drafts: (draftsRes.data ?? []).map((row) => ({
      id: row.id,
      opportunityId: row.opportunity_id,
      subreddit: row.subreddit,
      postId: row.post_id,
      permalink: row.permalink,
      author: row.author,
      question: row.question,
      draftReply: row.draft_reply,
      approvedReply: row.approved_reply,
      status: row.status,
      riskScore: row.risk_score,
      reviewFeedback: row.review_feedback,
      postedAt: row.posted_at,
      publishedUrl: row.published_url,
      errorMessage: row.error_message,
      createdAt: row.created_at,
    })),
    logs: (logsRes.data ?? []).map((row) => ({
      id: row.id,
      subreddit: row.subreddit,
      action: row.action,
      status: row.status,
      publishedUrl: row.published_url,
      errorMessage: row.error_message,
      rateLimitRemaining: row.rate_limit_remaining,
      upvotes: row.upvotes ?? 0,
      engagementNote: row.engagement_note ?? "",
      createdAt: row.created_at,
    })),
    safetyRules,
    postedToday: todayRes.error ? 0 : (todayRes.count ?? 0),
    f5botIntelligence,
    f5botCommunityAlerts: (f5botAlertsRes.data ?? []).map((row) => ({
      id: String(row.id),
      title: String(row.title ?? ""),
      body: String(row.body ?? ""),
      subreddit: String(row.subreddit ?? ""),
      url: String(row.url ?? ""),
      priority: row.priority ? String(row.priority) : null,
      matchedKeyword: String(row.alert_name ?? ""),
      relevanceScore: row.relevance_score != null ? Number(row.relevance_score) : null,
      createdAt: String(row.created_at),
    })),
  };
}
