import { NextRequest, NextResponse } from "next/server";
import {
  normalizeF5BotAlert,
  processF5BotAlert,
  upsertF5BotAlert,
} from "@/lib/intelligence/f5bot";
import { shouldRejectF5BotWebhook } from "@/lib/intelligence/f5bot-auth";
import { recordF5BotWebhookReceived } from "@/lib/intelligence/f5bot-diagnostics";
import type { F5BotRawAlert } from "@/lib/intelligence/f5bot-types";

export const dynamic = "force-dynamic";

/**
 * F5Bot webhook — POST alerts in real time.
 * Configure in F5Bot API Dashboard:
 * https://hq.getplantpal.com/api/intelligence/f5bot/webhook
 * Secret via x-f5bot-secret header or ?secret= query param.
 */
export async function POST(request: NextRequest) {
  if (shouldRejectF5BotWebhook(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let raw: F5BotRawAlert;
  try {
    raw = (await request.json()) as F5BotRawAlert;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const normalized = normalizeF5BotAlert(raw);
  const upserted = await upsertF5BotAlert(normalized);

  if (!upserted) {
    return NextResponse.json({ ok: false, error: "Storage unavailable" }, { status: 503 });
  }

  void recordF5BotWebhookReceived();

  if (upserted.inserted) {
    void processF5BotAlert(upserted.id);
  }

  return NextResponse.json({
    ok: true,
    id: upserted.id,
    inserted: upserted.inserted,
  });
}
