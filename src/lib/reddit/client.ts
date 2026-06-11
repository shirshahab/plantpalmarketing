/**
 * Server-only Reddit client — script-app OAuth (password grant).
 * Credentials never leave the server and are never stored in the database.
 * Respect Reddit Developer Terms and Data API Terms: help-first replies,
 * low frequency, no spam, no hidden automation.
 */

export interface RedditConfig {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  userAgent: string;
}

export function getRedditConfig(): RedditConfig {
  return {
    clientId: process.env.REDDIT_CLIENT_ID?.trim() ?? "",
    clientSecret: process.env.REDDIT_CLIENT_SECRET?.trim() ?? "",
    username: process.env.REDDIT_USERNAME?.trim() ?? "",
    password: process.env.REDDIT_PASSWORD?.trim() ?? "",
    userAgent:
      process.env.REDDIT_USER_AGENT?.trim() ??
      "plantpal-marketing-os/0.1 (set REDDIT_USER_AGENT)",
  };
}

export function isRedditConfigured(): boolean {
  const c = getRedditConfig();
  return Boolean(c.clientId && c.clientSecret && c.username && c.password);
}

interface TokenResult {
  ok: boolean;
  token?: string;
  error?: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<TokenResult> {
  if (!isRedditConfigured()) {
    return { ok: false, error: "Reddit credentials not configured. Set REDDIT_* env vars." };
  }
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return { ok: true, token: cachedToken.token };
  }

  const c = getRedditConfig();
  try {
    const res = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${c.clientId}:${c.clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": c.userAgent,
      },
      body: new URLSearchParams({
        grant_type: "password",
        username: c.username,
        password: c.password,
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      return { ok: false, error: `Reddit OAuth failed (${res.status}): ${(await res.text()).slice(0, 200)}` };
    }
    const json = (await res.json()) as { access_token?: string; expires_in?: number; error?: string };
    if (!json.access_token) {
      return { ok: false, error: `Reddit OAuth error: ${json.error ?? "no token returned"}` };
    }
    cachedToken = {
      token: json.access_token,
      expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
    };
    return { ok: true, token: json.access_token };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Reddit OAuth request failed" };
  }
}

async function redditApi(
  path: string,
  init: RequestInit = {}
): Promise<{ ok: boolean; data?: unknown; rateLimitRemaining?: number; error?: string }> {
  const tokenResult = await getAccessToken();
  if (!tokenResult.ok || !tokenResult.token) return { ok: false, error: tokenResult.error };

  const c = getRedditConfig();
  try {
    const res = await fetch(`https://oauth.reddit.com${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${tokenResult.token}`,
        "User-Agent": c.userAgent,
        ...(init.headers ?? {}),
      },
      cache: "no-store",
    });
    const rateLimitRemaining = Math.floor(Number(res.headers.get("x-ratelimit-remaining") ?? "0"));
    if (!res.ok) {
      return {
        ok: false,
        rateLimitRemaining,
        error: `Reddit API ${res.status}: ${(await res.text()).slice(0, 300)}`,
      };
    }
    return { ok: true, data: await res.json(), rateLimitRemaining };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Reddit API request failed" };
  }
}

export interface RedditAccountInfo {
  ok: boolean;
  username?: string;
  karma?: number;
  accountAgeDays?: number;
  rateLimitRemaining?: number;
  error?: string;
}

/** Read-only connection check (test this first). */
export async function checkRedditConnection(): Promise<RedditAccountInfo> {
  const result = await redditApi("/api/v1/me");
  if (!result.ok) return { ok: false, error: result.error };
  const me = result.data as { name?: string; total_karma?: number; created_utc?: number };
  return {
    ok: true,
    username: me.name ?? "",
    karma: me.total_karma ?? 0,
    accountAgeDays: me.created_utc ? Math.floor((Date.now() / 1000 - me.created_utc) / 86400) : 0,
    rateLimitRemaining: result.rateLimitRemaining,
  };
}

export interface RedditPost {
  postId: string;
  subreddit: string;
  title: string;
  selftext: string;
  author: string;
  permalink: string;
  numComments: number;
  createdUtc: number;
}

/** Read-only: fetch recent question-style posts from a subreddit. */
export async function fetchSubredditPosts(subreddit: string, limit = 10): Promise<{
  ok: boolean;
  posts: RedditPost[];
  error?: string;
}> {
  const result = await redditApi(`/r/${encodeURIComponent(subreddit)}/new?limit=${Math.min(limit, 25)}`);
  if (!result.ok) return { ok: false, posts: [], error: result.error };
  const listing = result.data as { data?: { children?: { data?: Record<string, unknown> }[] } };
  const posts = (listing.data?.children ?? [])
    .map((child) => child.data ?? {})
    .map((d) => ({
      postId: String(d.name ?? ""),
      subreddit: String(d.subreddit ?? subreddit),
      title: String(d.title ?? ""),
      selftext: String(d.selftext ?? "").slice(0, 2000),
      author: String(d.author ?? ""),
      permalink: d.permalink ? `https://reddit.com${String(d.permalink)}` : "",
      numComments: Number(d.num_comments ?? 0),
      createdUtc: Number(d.created_utc ?? 0),
    }))
    .filter((p) => p.postId && p.title);
  return { ok: true, posts };
}

/** Post a comment reply (only called after founder approval + safety checks). */
export async function postRedditComment(parentFullname: string, text: string): Promise<{
  ok: boolean;
  commentId?: string;
  permalink?: string;
  rateLimitRemaining?: number;
  error?: string;
}> {
  const result = await redditApi("/api/comment", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ api_type: "json", thing_id: parentFullname, text }),
  });
  if (!result.ok) return { ok: false, rateLimitRemaining: result.rateLimitRemaining, error: result.error };

  const json = result.data as {
    json?: { errors?: unknown[][]; data?: { things?: { data?: { name?: string; permalink?: string } }[] } };
  };
  const errors = json.json?.errors ?? [];
  if (errors.length > 0) {
    return {
      ok: false,
      rateLimitRemaining: result.rateLimitRemaining,
      error: `Reddit rejected the comment: ${JSON.stringify(errors).slice(0, 200)}`,
    };
  }
  const thing = json.json?.data?.things?.[0]?.data;
  return {
    ok: true,
    commentId: thing?.name ?? "",
    permalink: thing?.permalink ? `https://reddit.com${thing.permalink}` : "",
    rateLimitRemaining: result.rateLimitRemaining,
  };
}
