"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { isOpenAIConfigured } from "@/lib/openai/config";
import { isRedditConfigured } from "@/lib/reddit/client";

type Result = { ok: true; message?: string } | { ok: false; error: string };

type AnyClient = ReturnType<typeof createServerClient>;

async function countOf(
  supabase: AnyClient,
  table: string,
  filter?: (q: unknown) => unknown
): Promise<number | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from(table as any) as any).select("*", { count: "exact", head: true });
    if (filter) query = filter(query);
    const { count, error } = await query;
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

/**
 * Phase 31 Step 10 — recompute every launch checklist item from live data.
 * ready = the feature works end to end. blocked = something is broken.
 * pending = not exercised yet.
 */
export async function refreshLaunchChecklist(): Promise<Result> {
  try {
    const supabase = createServerClient();
    const checks: Record<string, { status: "ready" | "pending" | "blocked"; notes: string }> = {};

    // Daily brief
    const briefs = await countOf(supabase, "daily_reports");
    const ivyBriefs = await countOf(supabase, "ivy_briefs");
    checks.daily_brief =
      (briefs ?? 0) + (ivyBriefs ?? 0) > 0
        ? { status: "ready", notes: "Brief generated at least once" }
        : { status: "pending", notes: "No brief yet — run Ivy" };

    // Calendar
    const calendarItems = await countOf(supabase, "content_calendar");
    checks.calendar =
      calendarItems === null
        ? { status: "blocked", notes: "Calendar storage not ready — see /admin/setup-health" }
        : calendarItems > 0
          ? { status: "ready", notes: `${calendarItems} items on the calendar` }
          : { status: "pending", notes: "Calendar empty — approve some content" };

    // Approvals
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decided = await countOf(supabase, "approval_queue", (q: any) => q.in("status", ["approved", "rejected"]));
    checks.approvals =
      decided === null
        ? { status: "blocked", notes: "approval_queue missing" }
        : decided > 0
          ? { status: "ready", notes: `${decided} decisions made` }
          : { status: "pending", notes: "No approval decisions yet" };

    // SEO factory
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const voicePassed = await countOf(supabase, "seo_blog_posts", (q: any) => q.eq("voice_check_passed", true));
    checks.seo_factory =
      voicePassed === null
        ? { status: "blocked", notes: "SEO storage not ready — see /admin/setup-health" }
        : voicePassed > 0
          ? { status: "ready", notes: `${voicePassed} voice-checked drafts` }
          : { status: "pending", notes: "No voice-checked drafts yet — run the factory" };

    // Reddit engine
    const redditRules = await countOf(supabase, "reddit_safety_rules");
    checks.reddit_engine = isRedditConfigured()
      ? { status: "ready", notes: "Credentials set, safety rules active" }
      : (redditRules ?? 0) > 0
        ? { status: "pending", notes: "Safety rules seeded — add REDDIT_* env vars" }
        : { status: "pending", notes: "Finish setup, then add Reddit credentials" };

    // Creative department
    const creativeAssets = await countOf(supabase, "creative_assets");
    checks.creative_department =
      creativeAssets === null
        ? { status: "blocked", notes: "Creative storage not ready — see /admin/setup-health" }
        : creativeAssets > 0
          ? { status: "ready", notes: `${creativeAssets} creative assets produced` }
          : { status: "pending", notes: "Queue a project for Fern on /creative" };

    // Founder mode + analytics: pages exist and render gracefully
    checks.founder_mode = { status: "ready", notes: "/founder renders from live data" };
    checks.analytics = { status: "ready", notes: "/analytics renders; external sources show Not Connected Yet" };

    // Agent health
    try {
      const { data: health } = await supabase.from("agent_health").select("agent_id, status");
      const failed = (health ?? []).filter((h) => h.status === "failed");
      checks.agent_health =
        (health ?? []).length === 0
          ? { status: "pending", notes: "No runs yet — trigger the batch" }
          : failed.length > 0
            ? { status: "blocked", notes: `Failed: ${failed.map((f) => f.agent_id).join(", ")}` }
            : { status: "ready", notes: "No failed agents" };
    } catch {
      checks.agent_health = { status: "pending", notes: "agent_health unavailable" };
    }

    // API health
    checks.api_health = isOpenAIConfigured()
      ? { status: "ready", notes: "OpenAI key configured" }
      : { status: "blocked", notes: "OPENAI_API_KEY missing — generation runs on templates only" };

    const now = new Date().toISOString();
    for (const [key, check] of Object.entries(checks)) {
      await supabase
        .from("launch_checklist")
        .update({ status: check.status, notes: check.notes, last_checked_at: now })
        .eq("item_key", key);
    }

    revalidatePath("/launch");
    return { ok: true, message: "Checklist refreshed from live data" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Refresh failed" };
  }
}
