import { invokeIntegration } from "@/lib/integrations/invoke";
import { getSerpApiConfig, isSerpApiConfigured } from "@/lib/integrations/config";
import type { HealthCheckResult } from "@/lib/integrations/types";

export interface SerpSearchResult {
  title: string;
  link: string;
  snippet: string;
}

export async function healthCheckSerpApi(): Promise<HealthCheckResult> {
  const start = Date.now();
  if (!isSerpApiConfigured()) {
    return {
      provider: "serpapi",
      status: "disconnected",
      configured: false,
      message: "SERPAPI_KEY not configured",
      durationMs: Date.now() - start,
    };
  }

  try {
    const results = await searchGoogle("houseplant care trends", "health_check");
    return {
      provider: "serpapi",
      status: "connected",
      configured: true,
      message: `Connected — ${results.length} sample results`,
      durationMs: Date.now() - start,
    };
  } catch (e) {
    return {
      provider: "serpapi",
      status: "error",
      configured: true,
      message: e instanceof Error ? e.message : "SerpAPI health check failed",
      durationMs: Date.now() - start,
    };
  }
}

export async function searchGoogle(query: string, agentId?: string): Promise<SerpSearchResult[]> {
  const { apiKey } = getSerpApiConfig();
  return invokeIntegration({
    provider: "serpapi",
    action: "google_search",
    agentId,
    requestSummary: query.slice(0, 100),
    fn: async () => {
      const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${apiKey}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`SerpAPI ${res.status}`);
      const data = (await res.json()) as {
        organic_results?: { title?: string; link?: string; snippet?: string }[];
      };
      return (data.organic_results ?? []).slice(0, 8).map((r) => ({
        title: r.title ?? "",
        link: r.link ?? "",
        snippet: r.snippet ?? "",
      }));
    },
    summarize: (r) => `${r.length} results`,
  });
}

export async function discoverGardeningTrends(agentId?: string): Promise<string[]> {
  if (!isSerpApiConfigured()) return [];
  const results = await searchGoogle("gardening trends 2026 houseplants", agentId);
  return results.map((r) => r.title).filter(Boolean);
}

export async function discoverCreatorsViaSearch(agentId?: string, query?: string): Promise<SerpSearchResult[]> {
  if (!isSerpApiConfigured()) return [];
  return searchGoogle(query ?? "site:x.com plant parent influencer gardening", agentId);
}

export const SCOUT_CREATOR_QUERIES = [
  "plant creators instagram",
  "houseplant influencers",
  "gardening YouTube channels",
  "plant care TikTok creators",
  "plant Instagram creators",
  "nursery influencers gardening",
  "plant bloggers",
  "plant podcasts gardening",
];

export async function discoverCreatorsMultiQuery(agentId = "scout"): Promise<{
  results: SerpSearchResult[];
  queriesRun: number;
  serpApiConfigured: boolean;
}> {
  if (!isSerpApiConfigured()) {
    return { results: [], queriesRun: 0, serpApiConfigured: false };
  }

  const seen = new Set<string>();
  const results: SerpSearchResult[] = [];

  for (const query of SCOUT_CREATOR_QUERIES) {
    const hits = await searchGoogle(query, agentId).catch(() => []);
    for (const hit of hits) {
      const key = hit.link.toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      results.push({ ...hit, snippet: hit.snippet || query });
    }
  }

  return { results, queriesRun: SCOUT_CREATOR_QUERIES.length, serpApiConfigured: true };
}

export async function discoverCompetitorNews(competitor: string, agentId?: string): Promise<SerpSearchResult[]> {
  if (!isSerpApiConfigured()) return [];
  return searchGoogle(`${competitor} plant app gardening news`, agentId);
}
