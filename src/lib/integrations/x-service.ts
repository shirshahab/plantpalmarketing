import { createServerClient } from "@/lib/supabase/server";
import { invokeIntegration } from "@/lib/integrations/invoke";
import {
  getXConfig,
  isXReadConfigured,
  isXPublishConfigured,
} from "@/lib/integrations/config";
import { buildOAuth1Header } from "@/lib/integrations/x-oauth";
import { logIntegrationCall } from "@/lib/integrations/log";
import {
  assertNoDuplicatePublish,
  checkXPublishEligibility,
  validateTweetContent,
} from "@/lib/integrations/x-publish-readiness";
import { getXPublishCredentialStatus } from "@/lib/integrations/config";
import type { HealthCheckResult } from "@/lib/integrations/types";

export interface XAccountMetrics {
  followerCount: number;
  followingCount: number;
  tweetCount: number;
  listedCount: number;
  username: string;
  displayName: string;
  userId: string;
}

export interface XTweet {
  tweetId: string;
  text: string;
  authorUsername: string;
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  impressionCount: number;
  postedAt: string | null;
}

async function bearerFetch(path: string, agentId?: string) {
  const { bearerToken } = getXConfig();
  return invokeIntegration({
    provider: "x",
    action: `bearer_${path.split("?")[0]}`,
    agentId,
    requestSummary: path.slice(0, 80),
    fn: async () => {
      const res = await fetch(`https://api.twitter.com${path}`, {
        headers: { Authorization: `Bearer ${bearerToken}` },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`X API ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return res.json();
    },
    summarize: () => "ok",
  });
}

export async function healthCheckX(): Promise<HealthCheckResult> {
  const start = Date.now();
  if (!isXReadConfigured()) {
    return {
      provider: "x",
      status: "disconnected",
      configured: false,
      message: "X_BEARER_TOKEN not configured (read). Add OAuth tokens for publish.",
      durationMs: Date.now() - start,
    };
  }

  try {
    const me = (await bearerFetch("/2/users/me?user.fields=public_metrics", "health_check")) as {
      data?: { username?: string; public_metrics?: { followers_count?: number } };
    };
    const username = me.data?.username ?? "unknown";
    const followers = me.data?.public_metrics?.followers_count ?? 0;
    return {
      provider: "x",
      status: "connected",
      configured: true,
      message: `Connected — @${username} (${followers} followers)${isXPublishConfigured() ? ", publish ready" : ", read-only"}`,
      durationMs: Date.now() - start,
      metadata: {
        username,
        followers,
        publishReady: isXPublishConfigured(),
        ...getXPublishCredentialStatus(),
      },
    };
  } catch (e) {
    return {
      provider: "x",
      status: "error",
      configured: true,
      message: e instanceof Error ? e.message : "X health check failed",
      durationMs: Date.now() - start,
    };
  }
}

export async function fetchXAccountMetrics(agentId?: string): Promise<XAccountMetrics | null> {
  if (!isXReadConfigured()) return null;

  const json = (await bearerFetch(
    "/2/users/me?user.fields=public_metrics,name,username",
    agentId
  )) as {
    data?: {
      id: string;
      username: string;
      name: string;
      public_metrics?: {
        followers_count: number;
        following_count: number;
        tweet_count: number;
        listed_count: number;
      };
    };
  };

  const d = json.data;
  if (!d) return null;

  const metrics: XAccountMetrics = {
    userId: d.id,
    username: d.username,
    displayName: d.name,
    followerCount: d.public_metrics?.followers_count ?? 0,
    followingCount: d.public_metrics?.following_count ?? 0,
    tweetCount: d.public_metrics?.tweet_count ?? 0,
    listedCount: d.public_metrics?.listed_count ?? 0,
  };

  const supabase = createServerClient();
  await supabase.from("x_account_snapshots").insert({
    follower_count: metrics.followerCount,
    following_count: metrics.followingCount,
    tweet_count: metrics.tweetCount,
    listed_count: metrics.listedCount,
    username: metrics.username,
    display_name: metrics.displayName,
  });

  return metrics;
}

export async function fetchRecentTweets(userId?: string, agentId?: string): Promise<XTweet[]> {
  if (!isXReadConfigured()) return [];

  let uid = userId;
  if (!uid) {
    const me = (await bearerFetch("/2/users/me", agentId)) as { data?: { id: string } };
    uid = me.data?.id;
  }
  if (!uid) return [];

  const json = (await bearerFetch(
    `/2/users/${uid}/tweets?max_results=10&tweet.fields=created_at,public_metrics,author_id&expansions=author_id&user.fields=username`,
    agentId
  )) as {
    data?: {
      id: string;
      text: string;
      created_at?: string;
      public_metrics?: {
        like_count: number;
        retweet_count: number;
        reply_count: number;
        impression_count?: number;
      };
      author_id?: string;
    }[];
    includes?: { users?: { id: string; username: string }[] };
  };

  const users = new Map((json.includes?.users ?? []).map((u) => [u.id, u.username]));
  const tweets: XTweet[] = (json.data ?? []).map((t) => ({
    tweetId: t.id,
    text: t.text,
    authorUsername: users.get(t.author_id ?? "") ?? "",
    likeCount: t.public_metrics?.like_count ?? 0,
    retweetCount: t.public_metrics?.retweet_count ?? 0,
    replyCount: t.public_metrics?.reply_count ?? 0,
    impressionCount: t.public_metrics?.impression_count ?? 0,
    postedAt: t.created_at ?? null,
  }));

  const supabase = createServerClient();
  for (const t of tweets) {
    await supabase.from("x_posts").upsert(
      {
        tweet_id: t.tweetId,
        text: t.text,
        author_username: t.authorUsername,
        like_count: t.likeCount,
        retweet_count: t.retweetCount,
        reply_count: t.replyCount,
        impression_count: t.impressionCount,
        posted_at: t.postedAt,
        is_plantpal: true,
        source: "api",
      },
      { onConflict: "tweet_id" }
    );
  }

  return tweets;
}

export async function searchXGardeningConversations(query: string, agentId?: string): Promise<XTweet[]> {
  if (!isXReadConfigured()) return [];

  const json = (await bearerFetch(
    `/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=10&tweet.fields=created_at,public_metrics&expansions=author_id&user.fields=username`,
    agentId
  )) as {
    data?: {
      id: string;
      text: string;
      created_at?: string;
      author_id?: string;
      public_metrics?: { like_count: number; retweet_count: number; reply_count: number };
    }[];
    includes?: { users?: { id: string; username: string }[] };
  };

  const users = new Map((json.includes?.users ?? []).map((u) => [u.id, u.username]));
  return (json.data ?? []).map((t) => ({
    tweetId: t.id,
    text: t.text,
    authorUsername: users.get(t.author_id ?? "") ?? "",
    likeCount: t.public_metrics?.like_count ?? 0,
    retweetCount: t.public_metrics?.retweet_count ?? 0,
    replyCount: t.public_metrics?.reply_count ?? 0,
    impressionCount: 0,
    postedAt: t.created_at ?? null,
  }));
}

export async function draftXTweet(
  text: string,
  opts: { bloomPieceId?: string; agentId?: string } = {}
): Promise<string> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("x_post_queue")
    .insert({
      text: text.slice(0, 280),
      status: "draft",
      bloom_piece_id: opts.bloomPieceId ?? null,
      created_by_agent: opts.agentId ?? "bloom",
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to draft tweet");

  await supabase.from("agent_activity_log").insert({
    agent_id: opts.agentId ?? "bloom",
    action: "x_draft_created",
    detail: `X draft queued: "${text.slice(0, 60)}..."`,
    metadata: { queue_id: data.id },
  });

  return data.id;
}

export async function advanceXQueueStatus(
  queueId: string,
  status: "sage_review" | "gate_approval" | "queued" | "ready_to_publish" | "rejected",
  opts: { sageApproved?: boolean; gateApproved?: boolean; scheduledAt?: string } = {}
) {
  const supabase = createServerClient();
  const { error } = await supabase
    .from("x_post_queue")
    .update({
      status,
      ...(opts.sageApproved !== undefined ? { sage_approved: opts.sageApproved } : {}),
      ...(opts.gateApproved !== undefined ? { gate_approved: opts.gateApproved } : {}),
      ...(opts.scheduledAt ? { scheduled_at: opts.scheduledAt } : {}),
    })
    .eq("id", queueId);
  if (error) throw new Error(error.message);
}

async function recordPublishFailure(queueId: string, errorMessage: string, agentId: string) {
  const supabase = createServerClient();
  await supabase
    .from("x_post_queue")
    .update({ status: "failed", error_message: errorMessage })
    .eq("id", queueId);

  await logIntegrationCall({
    provider: "x",
    action: "publish_tweet_failed",
    status: "error",
    errorMessage,
    agentId,
    requestSummary: queueId,
  });
}

export async function publishApprovedXTweet(
  queueId: string,
  agentId = "sprout"
): Promise<{ tweetId: string }> {
  const supabase = createServerClient();
  const { data: item, error } = await supabase
    .from("x_post_queue")
    .select("*")
    .eq("id", queueId)
    .single();

  if (error || !item) throw new Error(error?.message ?? "Queue item not found");

  const eligibility = checkXPublishEligibility({
    sageApproved: item.sage_approved,
    gateApproved: item.gate_approved,
    status: item.status as import("@/lib/integrations/types").XPostQueueStatus,
    publishedTweetId: item.published_tweet_id,
  });

  if (!eligibility.ok) {
    const msg = eligibility.reasons.join("; ");
    await recordPublishFailure(queueId, msg, agentId);
    throw new Error(msg);
  }

  const contentCheck = validateTweetContent(item.text);
  if (!contentCheck.ok) {
    const msg = contentCheck.errors.join("; ");
    await recordPublishFailure(queueId, msg, agentId);
    throw new Error(msg);
  }

  const dupCheck = await assertNoDuplicatePublish(queueId, contentCheck.normalizedText!);
  if (!dupCheck.ok) {
    await recordPublishFailure(queueId, dupCheck.error!, agentId);
    throw new Error(dupCheck.error);
  }

  const { apiKey, apiSecret, accessToken, accessTokenSecret } = getXConfig();
  const url = "https://api.twitter.com/2/tweets";
  const tweetText = contentCheck.normalizedText!;

  try {
    const result = await invokeIntegration({
      provider: "x",
      action: "publish_tweet",
      agentId,
      requestSummary: tweetText.slice(0, 80),
      fn: async () => {
        const auth = buildOAuth1Header({
          method: "POST",
          url,
          apiKey,
          apiSecret,
          accessToken,
          accessTokenSecret,
        });
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: auth,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: tweetText }),
        });
        if (!res.ok) throw new Error(`X publish ${res.status}: ${(await res.text()).slice(0, 200)}`);
        return res.json() as Promise<{ data?: { id: string } }>;
      },
      summarize: (r) => r.data?.id ?? "published",
    });

    const tweetId = result.data?.id;
    if (!tweetId) throw new Error("X API returned no tweet id");

    await supabase
      .from("x_post_queue")
      .update({
        status: "published",
        published_tweet_id: tweetId,
        published_at: new Date().toISOString(),
        error_message: "",
        text: tweetText,
      })
      .eq("id", queueId);

    await supabase.from("x_posts").insert({
      tweet_id: tweetId,
      text: tweetText,
      author_username: "PlantPalApp",
      posted_at: new Date().toISOString(),
      is_plantpal: true,
      source: "api",
    });

    await supabase.from("agent_activity_log").insert({
      agent_id: agentId,
      action: "x_published",
      detail: `Human-confirmed publish to X: "${tweetText.slice(0, 50)}..."`,
      metadata: { queue_id: queueId, tweet_id: tweetId, human_confirmed: true },
    });

    return { tweetId };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "X publish failed";
    await recordPublishFailure(queueId, errorMessage, agentId);
    throw e;
  }
}

export async function syncXData(agentId?: string) {
  const metrics = await fetchXAccountMetrics(agentId);
  const tweets = await fetchRecentTweets(metrics?.userId, agentId);
  return { metrics, tweets };
}
