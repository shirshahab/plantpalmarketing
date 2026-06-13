import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import { getF5BotWebhookUrl } from "@/lib/intelligence/f5bot";
import type { F5BotDiagnostics } from "@/lib/intelligence/f5bot-types";
import { getProviderStatusesFromDb } from "@/lib/db/integration-queries";

function envPresent(name: string): boolean {
  const v = process.env[name]?.trim() ?? "";
  return v.length > 0 && !v.toLowerCase().includes("your_");
}

export async function getF5BotDiagnostics(): Promise<F5BotDiagnostics> {
  const dbStatuses = await getProviderStatusesFromDb().catch(() => []);
  const f5botStatus = dbStatuses.find((s) => s.provider === "f5bot");
  const meta = (f5botStatus?.metadata ?? {}) as Record<string, unknown>;

  let alertCount = 0;
  let opportunityCount = 0;
  let lastAlertReceived: string | null = null;

  try {
    const supabase = createServerClient();
    const [{ count: alerts }, { count: opps }, { data: latest }] = await Promise.all([
      supabase.from("intelligence_alerts").select("*", { count: "exact", head: true }),
      supabase.from("intelligence_opportunities").select("*", { count: "exact", head: true }),
      supabase
        .from("intelligence_alerts")
        .select("received_at")
        .order("received_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    alertCount = alerts ?? 0;
    opportunityCount = opps ?? 0;
    lastAlertReceived = latest?.received_at ?? null;
  } catch {
    // tables may not exist yet
  }

  return {
    apiTokenPresent: envPresent("F5BOT_API_TOKEN"),
    jsonFeedPresent: envPresent("F5BOT_JSON_FEED_URL"),
    rssFeedPresent: envPresent("F5BOT_RSS_FEED_URL"),
    webhookSecretPresent: envPresent("F5BOT_WEBHOOK_SECRET"),
    webhookUrl: getF5BotWebhookUrl(),
    lastPoll:
      typeof meta.last_fetch_at === "string"
        ? meta.last_fetch_at
        : typeof meta.last_poll_at === "string"
          ? meta.last_poll_at
          : f5botStatus?.lastSuccessAt ?? null,
    lastWebhookReceived:
      typeof meta.last_webhook_at === "string" ? meta.last_webhook_at : null,
    lastAlertReceived,
    lastProcessError: f5botStatus?.lastErrorMessage ?? null,
    alertCount,
    opportunityCount,
  };
}

export async function recordF5BotWebhookReceived(): Promise<void> {
  try {
    const supabase = createServerClient();
    const now = new Date().toISOString();
    const { error } = await supabase.from("integration_status").upsert(
      {
        provider: "f5bot",
        status: "connected",
        configured: true,
        last_success_at: now,
        metadata: { last_webhook_at: now },
      },
      { onConflict: "provider" }
    );
    if (error && !isMissingTableError(error)) {
      console.error("[f5bot webhook status]", error.message);
    }
  } catch {
    // best-effort
  }
}
