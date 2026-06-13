import type { F5BotSetupStatus } from "@/components/intelligence/f5bot-setup-card";

function envPresent(name: string): boolean {
  const v = process.env[name]?.trim() ?? "";
  return v.length > 0 && !v.toLowerCase().includes("your_");
}

export function getF5BotSetupStatus(): F5BotSetupStatus {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  const productionWebhookUrl = siteUrl
    ? `${siteUrl}/api/intelligence/f5bot/webhook`
    : "https://hq.getplantpal.com/api/intelligence/f5bot/webhook";

  return {
    apiTokenSet: envPresent("F5BOT_API_TOKEN"),
    jsonFeedSet: envPresent("F5BOT_JSON_FEED_URL"),
    rssFeedSet: envPresent("F5BOT_RSS_FEED_URL"),
    cronSecretSet: envPresent("CRON_SECRET"),
    webhookSecretSet: envPresent("F5BOT_WEBHOOK_SECRET"),
    f5botEnabled: process.env.F5BOT_ENABLED === "true",
    productionWebhookUrl,
    localWebhookUrl: "http://localhost:3000/api/intelligence/f5bot/webhook",
  };
}
