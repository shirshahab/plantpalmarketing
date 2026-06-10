"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidateDashboard } from "@/lib/actions/shared";
import type { ActionResult } from "@/lib/actions/shared";
import type { ContentFormat, Status } from "@/lib/types";

export async function createContentIdea(input: {
  title: string;
  format: ContentFormat;
  hook: string;
  body: string;
  status?: Status;
}): Promise<ActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("content_ideas").insert({
      title: input.title,
      format: input.format,
      hook: input.hook,
      body: input.body,
      status: input.status ?? "draft",
    });
    if (error) return { ok: false, error: error.message };
    await revalidateDashboard();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateContentIdea(
  id: string,
  input: Partial<{
    title: string;
    format: ContentFormat;
    hook: string;
    body: string;
    status: Status;
  }>
): Promise<ActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("content_ideas").update(input).eq("id", id);
    if (error) return { ok: false, error: error.message };
    await revalidateDashboard();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
