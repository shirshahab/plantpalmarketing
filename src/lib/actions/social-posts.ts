"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidateDashboard } from "@/lib/actions/shared";
import type { ActionResult } from "@/lib/actions/shared";
import type { Platform, Status } from "@/lib/types";

export async function createSocialPost(input: {
  platform: Platform;
  caption: string;
  hashtags: string[];
  status?: Status;
}): Promise<ActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("social_posts").insert({
      platform: input.platform,
      caption: input.caption,
      hashtags: input.hashtags,
      status: input.status ?? "draft",
    });
    if (error) return { ok: false, error: error.message };
    await revalidateDashboard();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateSocialPost(
  id: string,
  input: Partial<{
    platform: Platform;
    caption: string;
    hashtags: string[];
    status: Status;
  }>
): Promise<ActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("social_posts").update(input).eq("id", id);
    if (error) return { ok: false, error: error.message };
    await revalidateDashboard();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
