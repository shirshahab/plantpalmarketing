import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import { normalizeF5BotAlert } from "@/lib/intelligence/f5bot";
import { classifyF5BotAlert } from "@/lib/intelligence/classifyF5BotAlert";
import { fetchF5BotFeedItems } from "@/lib/intelligence/f5bot-feed";
import type { Json } from "@/lib/supabase/database.types";
import type { F5BotRawAlert } from "@/lib/intelligence/f5bot-types";

export interface IngestedAlertSummary {
  id: string;
  title: string;
  source: string;
  url: string;
  subreddit: string;
  classification: string | null;
  priority: string | null;
  assignedAgent: string | null;
  status: string;
  createdAt: string;
}

export interface F5BotIngestResult {
  ok: boolean;
  totalFromFeed: number;
  inserted: number;
  skippedDuplicates: number;
  errors: string[];
  latestAlerts: IngestedAlertSummary[];
  error?: string;
}

function extractSubreddit(url: string): string {
  const match = url.match(/reddit\.com\/r\/([^/?#]+)/i);
  return match?.[1] ?? "";
}

function alertName(raw: F5BotRawAlert, normalized: ReturnType<typeof normalizeF5BotAlert>): string {
  if (normalized.matchedKeyword) return normalized.matchedKeyword;
  if (typeof raw.group === "string" && raw.group.trim()) return raw.group.trim();
  return normalized.title.split(" - ")[0]?.trim() ?? "";
}

function detectedKeywords(raw: F5BotRawAlert, tags: string[]): string[] {
  const fromTags = Array.isArray(raw.tags) ? raw.tags.filter((t) => typeof t === "string") : [];
  return [...new Set([...fromTags, ...tags])].slice(0, 20);
}

function mapSummary(row: Record<string, unknown>): IngestedAlertSummary {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    source: String(row.source ?? ""),
    url: String(row.url ?? ""),
    subreddit: String(row.subreddit ?? ""),
    classification: row.classification ? String(row.classification) : null,
    priority: row.priority ? String(row.priority) : null,
    assignedAgent: row.assigned_agent ? String(row.assigned_agent) : null,
    status: String(row.status ?? "new"),
    createdAt: String(row.created_at),
  };
}

/** Phase 2 — fetch F5Bot feed and insert new rows into intelligence_alerts (URL dedupe). */
export async function ingestF5BotAlerts(): Promise<F5BotIngestResult> {
  const empty: F5BotIngestResult = {
    ok: false,
    totalFromFeed: 0,
    inserted: 0,
    skippedDuplicates: 0,
    errors: [],
    latestAlerts: [],
  };

  const fetchResult = await fetchF5BotFeedItems();
  if (!fetchResult.ok) {
    return { ...empty, error: fetchResult.error };
  }

  const supabase = createServerClient();
  const items = fetchResult.items;
  const errors: string[] = [];
  let inserted = 0;
  let skippedDuplicates = 0;
  const insertedIds: string[] = [];

  for (const raw of items) {
    try {
      const normalized = normalizeF5BotAlert(raw);
      const url = normalized.sourceUrl.trim();

      if (!url) {
        errors.push(`Skipped alert without URL: ${normalized.title.slice(0, 60) || "(untitled)"}`);
        continue;
      }

      const { data: existing } = await supabase
        .from("intelligence_alerts")
        .select("id")
        .eq("url", url)
        .maybeSingle();

      if (existing) {
        skippedDuplicates += 1;
        continue;
      }

      const classified = classifyF5BotAlert(normalized);
      const status = classified.classification === "ignore" ? "ignored" : "new";

      const row = {
        source: normalized.source,
        source_type: "f5bot",
        title: normalized.title,
        body: normalized.body,
        url,
        author: normalized.author,
        subreddit: extractSubreddit(url),
        alert_name: alertName(raw, normalized),
        detected_keywords: detectedKeywords(raw, classified.tags),
        classification: classified.classification,
        priority: classified.priority,
        assigned_agent: classified.assignedAgent,
        classification_reason: classified.reason,
        status,
        raw: raw as Json,
        raw_payload: raw as Json,
        external_id: normalized.externalId,
        external_created_at: normalized.publishedAt,
        received_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("intelligence_alerts")
        .insert(row)
        .select("id")
        .single();

      if (error) {
        if (error.code === "23505") {
          skippedDuplicates += 1;
          continue;
        }
        if (isMissingTableError(error)) {
          return {
            ...empty,
            totalFromFeed: items.length,
            error: "intelligence_alerts table missing — run migration 062",
          };
        }
        errors.push(error.message);
        continue;
      }

      inserted += 1;
      if (data?.id) insertedIds.push(String(data.id));
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "Unknown ingest error");
    }
  }

  let latestAlerts: IngestedAlertSummary[] = [];

  if (insertedIds.length > 0) {
    const { data } = await supabase
      .from("intelligence_alerts")
      .select("*")
      .in("id", insertedIds)
      .order("created_at", { ascending: false });
    latestAlerts = (data ?? []).map((r) => mapSummary(r as Record<string, unknown>));
  } else {
    const { data } = await supabase
      .from("intelligence_alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    latestAlerts = (data ?? []).map((r) => mapSummary(r as Record<string, unknown>));
  }

  return {
    ok: inserted > 0 || skippedDuplicates > 0 || items.length === 0,
    totalFromFeed: items.length,
    inserted,
    skippedDuplicates,
    errors,
    latestAlerts,
  };
}
