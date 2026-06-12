import { recordRateLimitHit } from "@/lib/integrations/log";
import type { IntegrationProvider } from "@/lib/integrations/types";

const LIMITS: Record<IntegrationProvider, { maxPerMinute: number }> = {
  openai: { maxPerMinute: 30 },
  openweather: { maxPerMinute: 60 },
  plantnet: { maxPerMinute: 10 },
  perenual: { maxPerMinute: 30 },
  serpapi: { maxPerMinute: 20 },
  x: { maxPerMinute: 15 },
  f5bot: { maxPerMinute: 4 },
};

const buckets = new Map<IntegrationProvider, number[]>();

export function checkRateLimit(provider: IntegrationProvider): { allowed: boolean; retryAfterMs?: number } {
  const limit = LIMITS[provider].maxPerMinute;
  const now = Date.now();
  const windowStart = now - 60_000;
  const hits = (buckets.get(provider) ?? []).filter((t) => t > windowStart);
  if (hits.length >= limit) {
    const oldest = hits[0] ?? now;
    void recordRateLimitHit(provider, limit);
    return { allowed: false, retryAfterMs: oldest + 60_000 - now };
  }
  hits.push(now);
  buckets.set(provider, hits);
  return { allowed: true };
}
