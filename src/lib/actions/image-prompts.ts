"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidateDashboard } from "@/lib/actions/shared";
import type { ActionResult } from "@/lib/actions/shared";
import type { ImagePromptCategory, Status } from "@/lib/types";

export async function createImagePrompt(input: {
  title: string;
  category: ImagePromptCategory;
  prompt: string;
  style: string;
  status?: Status;
}): Promise<ActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("image_prompts").insert({
      title: input.title,
      category: input.category,
      prompt: input.prompt,
      style: input.style,
      status: input.status ?? "draft",
    });
    if (error) return { ok: false, error: error.message };
    await revalidateDashboard();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateImagePrompt(
  id: string,
  input: Partial<{
    title: string;
    category: ImagePromptCategory;
    prompt: string;
    style: string;
    status: Status;
  }>
): Promise<ActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("image_prompts").update(input).eq("id", id);
    if (error) return { ok: false, error: error.message };
    await revalidateDashboard();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
