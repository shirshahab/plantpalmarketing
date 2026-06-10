import { callOpenAIJson } from "@/lib/openai/client";
import type { DiscoveryItem } from "@/lib/agents/types";
import {
  getSeasonalContext,
  REDDIT_MOCK_SIGNALS,
  TREND_MOCK_SIGNALS,
  getCompetitorSignalsFromDb,
} from "@/lib/agents/mock-inputs";

const DISCOVERY_SYSTEM = `You are the PlantPal Discovery Agent — a sharp growth researcher for a gardening app.

Your job: turn raw signals into actionable content opportunities. Be specific. Name platforms, emotions, and angles.

BANNED: vague topics like "plant care tips" without a hook angle.

Return JSON:
{
  "summary": "2-3 sentence executive brief of today's opportunity landscape",
  "items": [
    {
      "item_type": "trending_topic" | "question" | "content_opportunity",
      "title": "short title",
      "description": "why this matters + content angle for PlantPal",
      "source": "Reddit | Trends | Seasonal | Competitor",
      "relevance_score": 1-100
    }
  ]
}

Produce 12-18 items mixing all item_types. Prioritize high-intent gardener questions and viral angles.`;

function clamp(n: number) {
  return Math.min(100, Math.max(1, Math.round(n)));
}

export async function runDiscoveryAgent(
  getCompetitorAlerts: () => Promise<{ competitor: string; title: string; description: string }[]>
): Promise<{ summary: string; items: DiscoveryItem[] }> {
  const competitors = await getCompetitorSignalsFromDb(getCompetitorAlerts);
  const seasonal = getSeasonalContext();

  const userPrompt = `Analyze these signals and produce today's discovery brief for PlantPal.

SEASONAL CONTEXT:
${seasonal}

REDDIT SIGNALS (mock — Phase 6 will use live scraping):
${REDDIT_MOCK_SIGNALS.map((s) => `- ${s}`).join("\n")}

GARDENING TRENDS:
${TREND_MOCK_SIGNALS.map((s) => `- ${s}`).join("\n")}

COMPETITOR CONTENT:
${competitors.map((s) => `- ${s}`).join("\n")}

PlantPal tagline: Grow with confidence.`;

  const result = await callOpenAIJson<{
    summary: string;
    items: DiscoveryItem[];
  }>(DISCOVERY_SYSTEM, userPrompt, 0.85);

  return {
    summary: result.summary ?? "",
    items: (result.items ?? []).map((item) => ({
      item_type: item.item_type,
      title: String(item.title),
      description: String(item.description),
      source: String(item.source),
      relevance_score: clamp(Number(item.relevance_score) || 50),
    })),
  };
}
