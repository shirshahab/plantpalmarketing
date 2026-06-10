/**
 * Agent-facing integration helpers — all server-side only.
 * Agents call these when env vars are configured; otherwise they no-op gracefully.
 */

import { isOpenWeatherConfigured } from "@/lib/integrations/config";
import { getGardeningWeatherContent } from "@/lib/integrations/providers/openweather-provider";
import { enrichPlantContext } from "@/lib/integrations/providers/plantnet-provider";
import { getPlantCareSummary } from "@/lib/integrations/providers/perenual-provider";
import {
  discoverCreatorsViaSearch,
  discoverGardeningTrends,
  discoverCompetitorNews,
} from "@/lib/integrations/providers/serpapi-provider";
import {
  draftXTweet,
  searchXGardeningConversations,
  fetchRecentTweets,
} from "@/lib/integrations/x-service";
import { isSerpApiConfigured, isXReadConfigured } from "@/lib/integrations/config";

export async function rootsMonitorXConversations(agentId = "roots") {
  if (!isXReadConfigured()) return [];
  return searchXGardeningConversations(
    "(houseplant OR plant parent OR gardening) -is:retweet lang:en",
    agentId
  );
}

export async function scoutDiscoverCreatorsOnX(agentId = "scout") {
  if (!isSerpApiConfigured()) return [];
  return discoverCreatorsViaSearch(agentId);
}

export async function sentinelMonitorCompetitorX(competitor: string, agentId = "sentinel") {
  if (!isSerpApiConfigured()) return [];
  return discoverCompetitorNews(competitor, agentId);
}

export async function bloomEnrichContentContext(topic: string, agentId = "bloom") {
  const parts: string[] = [];
  if (isOpenWeatherConfigured()) {
    try {
      parts.push(await getGardeningWeatherContent(undefined, agentId));
    } catch {
      /* optional enrichment */
    }
  }
  try {
    parts.push(await enrichPlantContext(topic, agentId));
  } catch {
    /* optional */
  }
  try {
    parts.push(await getPlantCareSummary(topic, agentId));
  } catch {
    /* optional */
  }
  if (isSerpApiConfigured()) {
    try {
      const trends = await discoverGardeningTrends(agentId);
      if (trends.length) parts.push(`Trends: ${trends.slice(0, 3).join("; ")}`);
    } catch {
      /* optional */
    }
  }
  return parts.join("\n");
}

export async function bloomDraftXPost(text: string, bloomPieceId?: string) {
  return draftXTweet(text, { bloomPieceId, agentId: "bloom" });
}

export async function sproutSyncXEngagement(agentId = "sprout") {
  if (!isXReadConfigured()) return [];
  return fetchRecentTweets(undefined, agentId);
}
