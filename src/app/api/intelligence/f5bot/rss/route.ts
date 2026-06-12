import { NextRequest, NextResponse } from "next/server";
import { fetchF5BotRssFeed, normalizeF5BotAlert, upsertF5BotAlert } from "@/lib/intelligence/f5bot";
import { isAuthorizedF5BotPoll } from "@/lib/intelligence/f5bot-poll-auth";

export const dynamic = "force-dynamic";

/** Optional RSS fallback fetch — does not auto-process. */
export async function GET(request: NextRequest) {
  if (!(await isAuthorizedF5BotPoll(request))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await fetchF5BotRssFeed();
    let inserted = 0;
    let duplicates = 0;

    for (const raw of items) {
      const normalized = normalizeF5BotAlert(raw);
      const upserted = await upsertF5BotAlert(normalized);
      if (!upserted) continue;
      if (upserted.inserted) inserted += 1;
      else duplicates += 1;
    }

    return NextResponse.json({ ok: true, fetched: items.length, inserted, duplicates });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "RSS fetch failed" },
      { status: 500 }
    );
  }
}
