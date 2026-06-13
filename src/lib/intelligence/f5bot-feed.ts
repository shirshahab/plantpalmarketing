import type { F5BotRawAlert } from "@/lib/intelligence/f5bot-types";
import { isF5BotEnabled, isF5BotFeedUrlConfigured } from "@/lib/intelligence/f5bot-test";

export function parseF5BotFeedItems(json: unknown): F5BotRawAlert[] {
  if (Array.isArray(json)) return json as F5BotRawAlert[];
  if (json && typeof json === "object") {
    const feed = json as { items?: F5BotRawAlert[] };
    if (Array.isArray(feed.items)) return feed.items;
  }
  return [];
}

export interface F5BotFeedFetchResult {
  ok: boolean;
  items: F5BotRawAlert[];
  error?: string;
  httpStatus?: number;
}

/** Fetch F5Bot JSON feed — shared by test + ingest. */
export async function fetchF5BotFeedItems(): Promise<F5BotFeedFetchResult> {
  if (!isF5BotEnabled()) {
    return { ok: false, items: [], error: "F5BOT_ENABLED is not true" };
  }
  if (!isF5BotFeedUrlConfigured()) {
    return { ok: false, items: [], error: "F5BOT_JSON_FEED_URL is not configured" };
  }

  const feedUrl = process.env.F5BOT_JSON_FEED_URL!.trim();

  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    const token = process.env.F5BOT_API_TOKEN?.trim();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(feedUrl, { headers, cache: "no-store" });

    if (!res.ok) {
      let detail = "";
      try {
        detail = (await res.text()).slice(0, 200);
      } catch {
        // ignore
      }
      return {
        ok: false,
        items: [],
        httpStatus: res.status,
        error: `F5Bot JSON feed HTTP ${res.status}${detail ? `: ${detail}` : ""}`,
      };
    }

    const json = (await res.json()) as unknown;
    const items = parseF5BotFeedItems(json);

    if (items.length === 0) {
      return {
        ok: false,
        items: [],
        error: "Feed returned no parseable alerts (expected array or { items: [...] })",
      };
    }

    return { ok: true, items };
  } catch (e) {
    return {
      ok: false,
      items: [],
      error: e instanceof Error ? e.message : "Fetch failed",
    };
  }
}
