import type { NextRequest } from "next/server";

/** Verify F5Bot webhook secret from header or query param. */
export function verifyF5BotWebhookSecret(request: NextRequest): boolean {
  const configured = process.env.F5BOT_WEBHOOK_SECRET?.trim() ?? "";
  if (!configured) {
    // Local dev: no secret configured — allow through
    if (process.env.NODE_ENV !== "production") return true;
    return true;
  }

  const header = request.headers.get("x-f5bot-secret")?.trim();
  const query = request.nextUrl.searchParams.get("secret")?.trim();
  const provided = header || query || "";
  return provided === configured;
}

export function shouldRejectF5BotWebhook(request: NextRequest): boolean {
  const configured = process.env.F5BOT_WEBHOOK_SECRET?.trim() ?? "";
  if (!configured) return false;
  return !verifyF5BotWebhookSecret(request);
}
