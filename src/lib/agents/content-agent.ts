import { callOpenAIJson } from "@/lib/openai/client";
import type { ContentDraft, DiscoveryItem } from "@/lib/agents/types";
import { CONTENT_QUOTAS } from "@/lib/agents/types";

const CONTENT_SYSTEM = `You are the PlantPal Content Agent — a top creator + copywriter.

Write scroll-stopping content for PlantPal (gardening app, "Grow with confidence").

RULES:
- Emotional, relatable, funny, surprising, story-driven
- NEVER generic listicles or corporate tone
- NEVER "Here are 5 tips"
- Hooks must stop the scroll
- CTAs feel natural, not desperate

Return JSON:
{
  "items": [
    {
      "platform": "X | TikTok | Instagram | YouTube | Blog",
      "format": "x_post | tiktok_concept | reels_concept | shorts_concept | carousel | blog_idea",
      "hook": "opening line",
      "caption": "full post/script/carousel outline/blog angle",
      "cta": "call to action",
      "viral_score": 1-100 prediction
    }
  ]
}`;

function clamp(n: number) {
  return Math.min(100, Math.max(1, Math.round(n)));
}

function buildDiscoveryContext(items: DiscoveryItem[]): string {
  return items
    .slice(0, 12)
    .map((i) => `[${i.item_type}] ${i.title}: ${i.description}`)
    .join("\n");
}

async function generateBatch(
  discoveryItems: DiscoveryItem[],
  quota: { platform: string; format: string; count: number }
): Promise<ContentDraft[]> {
  const userPrompt = `Based on today's discovery brief, generate exactly ${quota.count} pieces.

PLATFORM: ${quota.platform}
FORMAT: ${quota.format}

DISCOVERY BRIEF:
${buildDiscoveryContext(discoveryItems)}

Each piece must be unique. Vary hooks and angles. PlantPal mentions should feel earned.`;

  const result = await callOpenAIJson<{ items: ContentDraft[] }>(
    CONTENT_SYSTEM,
    userPrompt,
    0.95
  );

  return (result.items ?? []).slice(0, quota.count).map((item) => ({
    platform: String(item.platform || quota.platform),
    format: String(item.format || quota.format),
    hook: String(item.hook),
    caption: String(item.caption),
    cta: String(item.cta),
    viral_score: clamp(Number(item.viral_score) || 50),
  }));
}

export async function runContentAgent(
  discoveryItems: DiscoveryItem[]
): Promise<ContentDraft[]> {
  const allDrafts: ContentDraft[] = [];

  for (const quota of CONTENT_QUOTAS) {
    const batch = await generateBatch(discoveryItems, quota);
    allDrafts.push(...batch);
  }

  return allDrafts;
}
