import { normalizeF5BotAlert } from "@/lib/intelligence/f5bot";
import { classifyF5BotAlert } from "@/lib/intelligence/classifyF5BotAlert";
import { fetchF5BotFeedItems } from "@/lib/intelligence/f5bot-feed";
import type { F5BotAlertClassification } from "@/lib/intelligence/classifyF5BotAlert";

export type F5BotConnectionStatus = "connected" | "disabled" | "misconfigured" | "error";

export interface F5BotTestAlertRow {
  title: string;
  source: string;
  url: string;
  date: string | null;
  classification: F5BotAlertClassification["classification"];
  assignedAgent: string | null;
  priority: F5BotAlertClassification["priority"];
  reason: string;
  tags: string[];
}

export interface F5BotTestResponse {
  ok: boolean;
  connectionStatus: F5BotConnectionStatus;
  enabled: boolean;
  feedUrlConfigured: boolean;
  totalAlerts: number;
  checkedAt: string;
  alerts: F5BotTestAlertRow[];
  rawPreview: string;
  error?: string;
  httpStatus?: number;
}

export { parseF5BotFeedItems } from "@/lib/intelligence/f5bot-feed";

export function isF5BotEnabled(): boolean {
  return process.env.F5BOT_ENABLED?.trim().toLowerCase() === "true";
}

export function isF5BotFeedUrlConfigured(): boolean {
  const url = process.env.F5BOT_JSON_FEED_URL?.trim() ?? "";
  return url.length > 0 && !url.toLowerCase().includes("your_");
}

/** Phase 1 — read-only F5Bot JSON feed test. Does not write to Supabase. */
export async function runF5BotFeedTest(): Promise<F5BotTestResponse> {
  const checkedAt = new Date().toISOString();
  const enabled = isF5BotEnabled();
  const feedUrlConfigured = isF5BotFeedUrlConfigured();

  const baseFailure = {
    enabled,
    feedUrlConfigured,
    totalAlerts: 0,
    checkedAt,
    alerts: [] as F5BotTestAlertRow[],
    rawPreview: "",
  };

  if (!enabled) {
    return {
      ...baseFailure,
      ok: false,
      connectionStatus: "disabled",
      error: "F5BOT_ENABLED is not set to true. Set F5BOT_ENABLED=true in your environment.",
    };
  }

  if (!feedUrlConfigured) {
    return {
      ...baseFailure,
      ok: false,
      connectionStatus: "misconfigured",
      error: "F5BOT_JSON_FEED_URL is missing or still a placeholder.",
    };
  }

  const fetchResult = await fetchF5BotFeedItems();
  if (!fetchResult.ok) {
    return {
      ...baseFailure,
      ok: false,
      connectionStatus: fetchResult.error?.includes("ENABLED") ? "disabled" : "error",
      httpStatus: fetchResult.httpStatus,
      error: fetchResult.error,
    };
  }

  const items = fetchResult.items;
  const sample = items.slice(0, 10);
  const alerts: F5BotTestAlertRow[] = sample.map((raw) => {
    const normalized = normalizeF5BotAlert(raw);
    const classified = classifyF5BotAlert(normalized);
    return {
      title: normalized.title || "(no title)",
      source: normalized.source,
      url: normalized.sourceUrl,
      date: normalized.publishedAt,
      classification: classified.classification,
      assignedAgent: classified.assignedAgent,
      priority: classified.priority,
      reason: classified.reason,
      tags: classified.tags,
    };
  });

  return {
    ok: true,
    connectionStatus: "connected",
    enabled,
    feedUrlConfigured,
    totalAlerts: items.length,
    checkedAt,
    alerts,
    rawPreview: JSON.stringify(sample, null, 2),
  };
}
