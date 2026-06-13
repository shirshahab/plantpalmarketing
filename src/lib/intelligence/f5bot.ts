import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import { recordHandoff } from "@/lib/collaboration/handoff";
import { ensureContentWorkflow } from "@/lib/workflow/engine";
import { createNotification } from "@/lib/notifications/create";
import { logIntegrationCall, updateProviderStatus } from "@/lib/integrations/log";
import type { Json } from "@/lib/supabase/database.types";
import type {
  F5BotClassification,
  F5BotFetchResult,
  F5BotRawAlert,
  IntelligenceClassification,
  NormalizedF5BotAlert,
} from "@/lib/intelligence/f5bot-types";
import { classifyF5BotAlert as classifyAlertCore } from "@/lib/intelligence/classifyF5BotAlert";

export { classifyF5BotAlert } from "@/lib/intelligence/classifyF5BotAlert";
export type { F5BotAlertClassification, F5BotAlertPriority } from "@/lib/intelligence/classifyF5BotAlert";

const COMPETITOR_KEYWORDS = ["planta", "picturethis", "picture this", "greg app", "plantsnap", "plant snap"];

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function envPresent(name: string): boolean {
  const v = process.env[name]?.trim() ?? "";
  return v.length > 0 && !v.toLowerCase().includes("your_");
}

function inferPlatform(raw: F5BotRawAlert, title: string, url: string): string {
  const tags = Array.isArray(raw.tags) ? raw.tags.join(" ") : "";
  const hay = `${title} ${tags} ${url}`.toLowerCase();
  if (hay.includes("reddit")) return "Reddit";
  if (hay.includes("hacker news") || hay.includes("news.ycombinator")) return "Hacker News";
  if (hay.includes("lobste")) return "Lobsters";
  if (hay.includes("twitter") || hay.includes("x.com")) return "X";
  return tags.split(" ").pop() ?? "Community";
}

function inferKeyword(raw: F5BotRawAlert, title: string): string {
  if (Array.isArray(raw.tags) && raw.tags.length > 0) {
    const kw = raw.tags.find((t) => !/reddit|comments|posts|hacker|lobsters/i.test(t));
    if (kw) return kw;
    return raw.tags[0] ?? "";
  }
  const parts = title.split(" - ");
  return parts[0]?.trim() ?? "";
}

/** Normalize F5Bot webhook / JSON feed item into a consistent alert shape. */
export function normalizeF5BotAlert(raw: F5BotRawAlert): NormalizedF5BotAlert {
  const title = String(raw.title ?? "");
  const url = String(raw.url ?? "");
  const html = String(raw.content_html ?? raw.content ?? raw.body ?? "");
  const body = html.includes("<") ? stripHtml(html) : html;
  const externalId = String(raw.id ?? `${url}:${title}`.slice(0, 200));
  const publishedAt = raw.date_published ?? raw.published ?? null;

  return {
    externalId,
    source: inferPlatform(raw, title, url),
    sourceUrl: url,
    title,
    body,
    author: String(raw.username ?? raw.author ?? ""),
    matchedKeyword: inferKeyword(raw, title),
    keywordGroup: String(raw.group ?? ""),
    publishedAt: publishedAt ? String(publishedAt) : null,
    rawPayload: raw as Record<string, unknown>,
  };
}

function textBlob(alert: NormalizedF5BotAlert): string {
  return `${alert.title} ${alert.body} ${alert.matchedKeyword}`.toLowerCase();
}

function extractSubreddit(url: string): string {
  const match = url.match(/reddit\.com\/r\/([^/?#]+)/i);
  return match?.[1] ?? "";
}

/** Map Phase 3 classification → pipeline / inbox shape. */
export function toF5BotPipelineClassification(alert: NormalizedF5BotAlert): F5BotClassification {
  const result = classifyAlertCore(alert);
  return {
    classification: result.classification,
    priority: result.priority,
    assignedAgent: result.assignedAgent ?? "",
    suggestedAction: result.reason,
    founderInbox: result.priority === "high",
  };
}

function mapAlertRow(row: Record<string, unknown>): NormalizedF5BotAlert {
  const url = String(row.url ?? row.source_url ?? "");
  return {
    externalId: String(row.external_id ?? ""),
    source: String(row.source ?? ""),
    sourceUrl: url,
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    author: String(row.author ?? ""),
    matchedKeyword: String(row.matched_keyword ?? ""),
    keywordGroup: String(row.keyword_group ?? ""),
    publishedAt: row.created_at ? String(row.created_at) : row.published_at ? String(row.published_at) : null,
    rawPayload: (row.raw_payload as Record<string, unknown>) ?? {},
  };
}

/** Upsert alert by source URL (primary dedupe key). */
export async function upsertIntelligenceAlert(
  alert: NormalizedF5BotAlert
): Promise<{ id: string; inserted: boolean } | null> {
  try {
    const supabase = createServerClient();
    const classified = classifyAlertCore(alert);
    const dedupeUrl = alert.sourceUrl.trim();
    const subreddit = extractSubreddit(dedupeUrl);

    if (dedupeUrl) {
      const { data: existing } = await supabase
        .from("intelligence_alerts")
        .select("id, status")
        .eq("url", dedupeUrl)
        .maybeSingle();
      if (existing) return { id: String(existing.id), inserted: false };
    } else if (alert.externalId) {
      const { data: existing } = await supabase
        .from("intelligence_alerts")
        .select("id, status")
        .eq("external_id", alert.externalId)
        .maybeSingle();
      if (existing) return { id: String(existing.id), inserted: false };
    }

    const status = classified.classification === "ignore" ? "ignored" : "new";
    const { data, error } = await supabase
      .from("intelligence_alerts")
      .insert({
        source: alert.source,
        title: alert.title,
        body: alert.body,
        url: dedupeUrl,
        author: alert.author,
        subreddit,
        created_at: alert.publishedAt ?? new Date().toISOString(),
        classification: classified.classification,
        priority: classified.priority,
        assigned_agent: classified.assignedAgent ?? "",
        status,
        external_id: alert.externalId,
        raw_payload: alert.rawPayload as Json,
      })
      .select("id")
      .single();

    if (error) {
      if (isMissingTableError(error)) return null;
      if (error.code === "23505") return null;
      throw new Error(error.message);
    }
    return { id: String(data.id), inserted: true };
  } catch {
    return null;
  }
}

/** @deprecated Use upsertIntelligenceAlert */
export async function upsertF5BotAlert(
  alert: NormalizedF5BotAlert
): Promise<{ id: string; inserted: boolean } | null> {
  return upsertIntelligenceAlert(alert);
}

async function createOpportunityFromAlert(
  alertId: string,
  alert: NormalizedF5BotAlert,
  classification: F5BotClassification
): Promise<string | null> {
  const supabase = createServerClient();
  const actionForType: Record<IntelligenceClassification, string> = {
    community_opportunity: "Draft helpful reply",
    competitor_alert: "Analyze competitor mention",
    content_idea: "Develop content from signal",
    seo_topic: "Add to SEO / growth research queue",
    creator_opportunity: "Evaluate creator partnership",
    product_feedback: "Review product feedback",
    ignore: "Skip low-signal alert",
  };

  const { data, error } = await supabase
    .from("intelligence_opportunities")
    .insert({
      source_type: "f5bot",
      source_table: "intelligence_alerts",
      source_id: alertId,
      platform: alert.source,
      title: alert.title.slice(0, 240) || alert.matchedKeyword || "F5Bot alert",
      summary: alert.body.slice(0, 500),
      opportunity_type: classification.classification,
      priority: classification.priority,
      recommended_agent: classification.assignedAgent,
      suggested_action: actionForType[classification.classification],
      source_url: alert.sourceUrl,
      status: "new",
      metadata: {
        matched_keyword: alert.matchedKeyword,
        author: alert.author,
        subreddit: extractSubreddit(alert.sourceUrl),
      } as Json,
    })
    .select("id")
    .single();

  if (error) {
    if (isMissingTableError(error)) return null;
    throw new Error(error.message);
  }
  return String(data.id);
}

async function routeCommunityOpportunity(alert: NormalizedF5BotAlert, alertId: string): Promise<void> {
  const supabase = createServerClient();
  const subredditMatch = alert.sourceUrl.match(/reddit\.com\/r\/([^/]+)/i);
  const { data: opp } = await supabase
    .from("community_opportunities")
    .insert({
      platform: alert.source,
      author: alert.author,
      post: alert.body.slice(0, 2000),
      topic: alert.matchedKeyword || alert.title.slice(0, 120),
      question: alert.title,
      urgency_score: 70,
      suggested_reply: "",
      status: "pending",
      source_url: alert.sourceUrl,
      source_author: alert.author,
      source_platform: alert.source,
      source_title: alert.title,
      source_subreddit: subredditMatch?.[1] ?? "",
      source_created_at: alert.publishedAt,
      data_source: "f5bot",
    })
    .select("id")
    .single();

  if (opp) {
    await ensureContentWorkflow({
      sourceTable: "community_opportunities",
      sourceId: String(opp.id),
      contentType: "community_reply",
      title: alert.title.slice(0, 120) || "Community opportunity",
      stage: "WITH_AGENT",
      assignedAgent: "roots",
      initialEvent: "F5Bot alert routed to Roots",
      actor: "f5bot",
      destinationLabel: "Reply Queue",
    });
  }

  await recordHandoff({
    fromAgent: "scout",
    toAgent: "roots",
    workflowName: "F5Bot → Roots",
    triggerType: "f5bot_alert",
    triggerId: alertId,
    taskType: "community_response",
    taskDescription: `Review F5Bot ${alert.source} thread: ${alert.matchedKeyword || alert.title.slice(0, 80)}`,
    priority: "high",
    messageTitle: "New community opportunity from F5Bot",
    messageBody: alert.body.slice(0, 400),
    activityDetail: `F5Bot routed community alert to Roots (${alert.source})`,
    metadata: { source_url: alert.sourceUrl, alert_id: alertId },
  });
}

async function routeCompetitorAlert(alert: NormalizedF5BotAlert, alertId: string): Promise<void> {
  const supabase = createServerClient();
  const competitor = COMPETITOR_KEYWORDS.find((kw) =>
    textBlob(alert).includes(kw.toLowerCase())
  ) ?? "competitor";

  await supabase.from("competitor_intel_alerts").insert({
    competitor: competitor.charAt(0).toUpperCase() + competitor.slice(1),
    alert_type: "viral_post",
    title: alert.title.slice(0, 200) || "F5Bot competitor mention",
    description: alert.body.slice(0, 1000),
    severity: "high",
    source: alert.sourceUrl,
    recommended_action: "Analyze competitor / create response content",
    status: "active",
  });

  await recordHandoff({
    fromAgent: "sentinel",
    toAgent: "atlas",
    workflowName: "Sentinel → Atlas",
    triggerType: "f5bot_competitor",
    triggerId: alertId,
    taskType: "competitor_analysis",
    taskDescription: `Competitor mention on ${alert.source}: ${alert.title.slice(0, 100)}`,
    priority: "high",
    messageTitle: "Competitor alert from F5Bot",
    messageBody: alert.body.slice(0, 400),
    activityDetail: `F5Bot competitor alert logged by Sentinel`,
    metadata: { source_url: alert.sourceUrl },
  });

  await recordHandoff({
    fromAgent: "atlas",
    toAgent: "ivy",
    workflowName: "Atlas → Ivy",
    triggerType: "f5bot_competitor",
    triggerId: alertId,
    taskType: "executive_brief",
    taskDescription: `Surface competitor intel in Ivy brief: ${alert.title.slice(0, 80)}`,
    priority: "medium",
    messageTitle: "Competitor intel for brief",
    messageBody: alert.body.slice(0, 300),
    activityDetail: `Atlas forwarded F5Bot competitor alert to Ivy`,
    metadata: { source_url: alert.sourceUrl },
  });
}

async function routeCreatorOpportunity(alert: NormalizedF5BotAlert, alertId: string): Promise<void> {
  await recordHandoff({
    fromAgent: "scout",
    toAgent: "oak",
    workflowName: "F5Bot → Oak",
    triggerType: "f5bot_creator",
    triggerId: alertId,
    taskType: "partnership_outreach",
    taskDescription: `Creator opportunity: ${alert.title.slice(0, 100)}`,
    priority: "high",
    messageTitle: "Creator opportunity from F5Bot",
    messageBody: alert.body.slice(0, 400),
    activityDetail: `F5Bot creator signal routed to Oak`,
    metadata: { source_url: alert.sourceUrl },
  });
}

async function routeProductFeedback(alert: NormalizedF5BotAlert, alertId: string): Promise<void> {
  await recordHandoff({
    fromAgent: "scout",
    toAgent: "echo",
    workflowName: "F5Bot → Echo",
    triggerType: "f5bot_feedback",
    triggerId: alertId,
    taskType: "customer_insight",
    taskDescription: `Product feedback: ${alert.title.slice(0, 100)}`,
    priority: "medium",
    messageTitle: "Product feedback from community",
    messageBody: alert.body.slice(0, 400),
    activityDetail: `F5Bot product feedback routed to Echo`,
    metadata: { source_url: alert.sourceUrl },
  });
}

async function routeReplyDraft(alert: NormalizedF5BotAlert, alertId: string): Promise<void> {
  const supabase = createServerClient();
  const subredditMatch = alert.sourceUrl.match(/reddit\.com\/r\/([^/]+)/i);

  const { data: draft } = await supabase
    .from("community_reply_drafts")
    .insert({
      platform: alert.source,
      author: alert.author,
      original_content: alert.body.slice(0, 2000),
      draft: "",
      status: "draft",
      source_url: alert.sourceUrl,
      source_author: alert.author,
      source_platform: alert.source,
      source_title: alert.title,
      source_subreddit: subredditMatch?.[1] ?? "",
      source_created_at: alert.publishedAt,
      data_source: "f5bot",
    })
    .select("id")
    .single();

  if (draft) {
    await ensureContentWorkflow({
      sourceTable: "community_reply_drafts",
      sourceId: String(draft.id),
      contentType: "community_reply",
      title: `Reply: ${alert.title.slice(0, 80)}`,
      stage: "WITH_AGENT",
      assignedAgent: "roots",
      initialEvent: "F5Bot high-intent question — reply pipeline started",
      actor: "f5bot",
      destinationLabel: "Reply Queue",
    });
  }

  const chain: Array<{ from: string; to: string; task: string; desc: string }> = [
    { from: "roots", to: "bloom", task: "community_response", desc: "Draft helpful reply" },
    { from: "bloom", to: "moss", task: "creative_review", desc: "Moss voice check on reply draft" },
    { from: "moss", to: "sage", task: "creative_review", desc: "Sage fact-check reply" },
    { from: "sage", to: "gate", task: "approval_gate", desc: "Queue founder approval" },
  ];

  for (const step of chain) {
    await recordHandoff({
      fromAgent: step.from,
      toAgent: step.to,
      workflowName: `${step.from} → ${step.to}`,
      triggerType: "f5bot_reply",
      triggerId: alertId,
      taskType: step.task as "community_response",
      taskDescription: step.desc,
      priority: "high",
      messageTitle: `F5Bot reply pipeline: ${step.desc}`,
      messageBody: alert.body.slice(0, 300),
      activityDetail: `F5Bot reply route: ${step.from} → ${step.to}`,
      metadata: { alert_id: alertId, source_url: alert.sourceUrl },
    });
  }
}

async function routeContentIdea(alert: NormalizedF5BotAlert, alertId: string): Promise<void> {
  const supabase = createServerClient();
  const title = alert.title.replace(/^[^-]+-\s*/, "").slice(0, 120) || alert.matchedKeyword;

  const { data: idea } = await supabase
    .from("creative_content_ideas")
    .insert({
      title,
      content_type: "educational",
      format: "social",
      hook: `[F5Bot · ${alert.source}] ${alert.body.slice(0, 180)}`,
      body: `${alert.body.slice(0, 1400)}\n\nSource: ${alert.sourceUrl}`,
      status: "pending",
    })
    .select("id")
    .single();

  if (idea) {
    await ensureContentWorkflow({
      sourceTable: "creative_content_ideas",
      sourceId: String(idea.id),
      contentType: "content_idea",
      title,
      stage: "IDEA",
      assignedAgent: "bloom",
      initialEvent: "Content idea from F5Bot recurring topic",
      actor: "f5bot",
    });

    await recordHandoff({
      fromAgent: "bloom",
      toAgent: "moss",
      workflowName: "Bloom → Moss",
      triggerType: "f5bot_content",
      triggerId: alertId,
      taskType: "content_brief",
      taskDescription: `Content idea from F5Bot: ${title}`,
      priority: "medium",
      messageTitle: "Content idea from community signal",
      messageBody: alert.body.slice(0, 300),
      activityDetail: `Bloom created content idea from F5Bot alert`,
      metadata: { source_url: alert.sourceUrl },
    });
  }
}

async function routeSeoTopic(alert: NormalizedF5BotAlert, alertId: string): Promise<void> {
  const supabase = createServerClient();
  const topic = alert.title.replace(/^[^-]+-\s*/, "").slice(0, 200) || alert.matchedKeyword;

  await supabase.from("seo_topics").upsert(
    {
      topic,
      question: alert.body.slice(0, 500),
      source: "f5bot",
      status: "idea",
      metadata: { f5bot_alert_id: alertId, source_url: alert.sourceUrl } as Json,
    },
    { onConflict: "topic", ignoreDuplicates: true }
  );

  await recordHandoff({
    fromAgent: "scout",
    toAgent: "atlas",
    workflowName: "F5Bot → Atlas",
    triggerType: "f5bot_seo",
    triggerId: alertId,
    taskType: "growth_recommendation",
    taskDescription: `SEO / growth topic from F5Bot: ${topic.slice(0, 80)}`,
    priority: "medium",
    messageTitle: "SEO / growth signal from F5Bot",
    messageBody: alert.body.slice(0, 300),
    activityDetail: `F5Bot topic queued for Atlas`,
    metadata: { source_url: alert.sourceUrl },
  });
}

/** Process a stored alert: classify, create opportunities, route agents, notify founder. */
export async function processF5BotAlert(alertId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createServerClient();
    const { data: row, error } = await supabase
      .from("intelligence_alerts")
      .select("*")
      .eq("id", alertId)
      .maybeSingle();

    if (error || !row) {
      return { ok: false, error: error?.message ?? "Alert not found" };
    }

    if (row.status === "processed" || row.status === "ignored" || row.status === "routed") {
      return { ok: true };
    }

    const alert = mapAlertRow(row as Record<string, unknown>);
    const classification =
      row.classification && row.assigned_agent
        ? {
            classification: row.classification as IntelligenceClassification,
            priority: row.priority as F5BotClassification["priority"],
            assignedAgent: String(row.assigned_agent),
            suggestedAction: classifyAlertCore(alert).reason,
            founderInbox: row.priority === "high",
          }
        : toF5BotPipelineClassification(alert);

    if (classification.classification === "ignore") {
      await supabase.from("intelligence_alerts").update({ status: "ignored" }).eq("id", alertId);
      return { ok: true };
    }

    const oppId = await createOpportunityFromAlert(alertId, alert, classification);
    if (!oppId) {
      return { ok: false, error: "Could not create opportunity" };
    }

    switch (classification.classification) {
      case "community_opportunity":
        await routeCommunityOpportunity(alert, alertId);
        if (classification.priority === "high") await routeReplyDraft(alert, alertId);
        break;
      case "competitor_alert":
        await routeCompetitorAlert(alert, alertId);
        break;
      case "content_idea":
        await routeContentIdea(alert, alertId);
        break;
      case "seo_topic":
        await routeSeoTopic(alert, alertId);
        break;
      case "creator_opportunity":
        await routeCreatorOpportunity(alert, alertId);
        break;
      case "product_feedback":
        await routeProductFeedback(alert, alertId);
        break;
      default:
        break;
    }

    if (classification.founderInbox) {
      await createNotification({
        type: classification.classification === "competitor_alert" ? "competitor_alert" : "f5bot_alert",
        title: `${alert.source}: ${alert.title.slice(0, 60)}`,
        message: alert.body.slice(0, 200),
        targetRoute: `/intelligence?alert=${alertId}`,
        targetTable: "intelligence_alerts",
        targetId: alertId,
        priority: "high",
        metadata: { source_url: alert.sourceUrl, classification: classification.classification },
      });
    }

    await supabase
      .from("intelligence_alerts")
      .update({ status: "routed", assigned_agent: classification.assignedAgent })
      .eq("id", alertId);

    await updateProviderStatus("f5bot", "connected", {
      configured: true,
      success: true,
      metadata: { last_alert_id: alertId, last_processed_at: new Date().toISOString() },
    });

    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Process failed";
    await updateProviderStatus("f5bot", "error", {
      configured: envPresent("F5BOT_JSON_FEED_URL") || envPresent("F5BOT_API_TOKEN"),
      errorMessage: msg,
    });
    return { ok: false, error: msg };
  }
}

function parseFeedItems(json: unknown): F5BotRawAlert[] {
  if (Array.isArray(json)) return json as F5BotRawAlert[];
  if (json && typeof json === "object") {
    const feed = json as { items?: F5BotRawAlert[] };
    if (Array.isArray(feed.items)) return feed.items;
  }
  return [];
}

/** Fetch alerts from F5BOT_JSON_FEED_URL (Power User JSON feed). */
export async function fetchF5BotJsonFeed(prevId?: string): Promise<F5BotRawAlert[]> {
  const baseUrl = process.env.F5BOT_JSON_FEED_URL?.trim();
  if (!baseUrl) throw new Error("F5BOT_JSON_FEED_URL not configured");

  const url = new URL(baseUrl);
  if (prevId) url.searchParams.set("prev_id", prevId);

  const headers: Record<string, string> = { Accept: "application/json" };
  const token = process.env.F5BOT_API_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url.toString(), { headers, cache: "no-store" });
  if (!res.ok) throw new Error(`F5Bot JSON feed HTTP ${res.status}`);

  const json = (await res.json()) as unknown;
  return parseFeedItems(json);
}

/** Parse RSS feed as fallback when JSON is unavailable. */
export async function fetchF5BotRssFeed(): Promise<F5BotRawAlert[]> {
  const rssUrl = process.env.F5BOT_RSS_FEED_URL?.trim();
  if (!rssUrl) throw new Error("F5BOT_RSS_FEED_URL not configured");

  const res = await fetch(rssUrl, { cache: "no-store" });
  if (!res.ok) throw new Error(`F5Bot RSS feed HTTP ${res.status}`);
  const xml = await res.text();

  const items: F5BotRawAlert[] = [];
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  for (const block of itemBlocks) {
    const id = block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i)?.[1]?.trim();
    const link = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.trim();
    const title = block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
    const desc = block.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1]?.trim();
    const pubDate = block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim();
    items.push({
      id: id ?? link,
      url: link,
      title: title ? stripHtml(title) : "",
      content_html: desc ?? "",
      date_published: pubDate,
    });
  }
  return items;
}

/** Fetch F5Bot JSON feed, store alerts, route new ones. Primary intelligence ingest. */
export async function fetchF5BotAlerts(): Promise<F5BotFetchResult> {
  const result: F5BotFetchResult = {
    fetched: 0,
    inserted: 0,
    duplicates: 0,
    processed: 0,
    failed: 0,
    errors: [],
  };

  let rawItems: F5BotRawAlert[] = [];
  try {
    rawItems = await fetchF5BotJsonFeed();
  } catch (jsonErr) {
    const msg = jsonErr instanceof Error ? jsonErr.message : "JSON feed failed";
    result.errors.push(msg);
    await updateProviderStatus("f5bot", "error", {
      configured: envPresent("F5BOT_JSON_FEED_URL"),
      errorMessage: msg,
    });
    return result;
  }

  result.fetched = rawItems.length;

  for (const raw of rawItems) {
    try {
      const normalized = normalizeF5BotAlert(raw);
      if (!normalized.sourceUrl && !normalized.title) {
        result.failed += 1;
        continue;
      }
      const upserted = await upsertIntelligenceAlert(normalized);
      if (!upserted) {
        result.failed += 1;
        continue;
      }
      if (upserted.inserted) {
        result.inserted += 1;
        const proc = await processF5BotAlert(upserted.id);
        if (proc.ok) result.processed += 1;
        else {
          result.failed += 1;
          if (proc.error) result.errors.push(proc.error);
        }
      } else {
        result.duplicates += 1;
      }
    } catch (e) {
      result.failed += 1;
      result.errors.push(e instanceof Error ? e.message : "Unknown error");
    }
  }

  await logIntegrationCall({
    provider: "f5bot",
    action: "f5bot_fetch",
    status: result.errors.length > 0 ? "error" : "success",
    responseSummary: `fetched=${result.fetched} inserted=${result.inserted} processed=${result.processed}`,
    errorMessage: result.errors[0],
  });

  await updateProviderStatus("f5bot", result.errors.length > 0 ? "degraded" : "connected", {
    configured: true,
    success: result.errors.length === 0,
    metadata: {
      last_fetch_at: new Date().toISOString(),
      last_poll_at: new Date().toISOString(),
      fetched: result.fetched,
      inserted: result.inserted,
    },
    errorMessage: result.errors[0],
  });

  return result;
}

/** @deprecated Use fetchF5BotAlerts */
export async function pollF5BotAlerts(): Promise<F5BotFetchResult> {
  return fetchF5BotAlerts();
}

export function getF5BotWebhookUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return `${explicit.replace(/\/$/, "")}/api/intelligence/f5bot/webhook`;
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}/api/intelligence/f5bot/webhook`;
  return "https://hq.getplantpal.com/api/intelligence/f5bot/webhook";
}
