"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { getRedditOpportunityDetail } from "@/lib/db/reddit-opportunity-detail";
import type { ActionResult } from "@/lib/actions/shared";

export async function sendRedditOpportunityToBloomAction(
  opportunityId: string,
  source: string
): Promise<ActionResult> {
  const detail = await getRedditOpportunityDetail(opportunityId, source);
  if (!detail) return { ok: false, error: "Opportunity not found" };

  try {
    const supabase = createServerClient();
    await supabase.from("creative_content_ideas").insert({
      title: detail.title.slice(0, 120),
      content_type: "community",
      format: "social",
      hook: detail.matchedKeywords[0] ?? detail.matchedKeyword,
      body: `${detail.body.slice(0, 400)}\n\nSuggested reply:\n${detail.draftReply ?? "(draft pending)"}`,
      status: "pending",
    });
    if (source === "f5bot") {
      await supabase
        .from("intelligence_alerts")
        .update({ assigned_agent: "bloom", classification: "reddit_opportunity" })
        .eq("id", opportunityId);
    }
    revalidatePath("/bloom");
    revalidatePath("/reddit");
    return { ok: true, message: "Sent to Bloom" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
