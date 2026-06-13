"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidateDashboard } from "@/lib/actions/shared";
import type { ActionResult } from "@/lib/actions/shared";
import type { ImagePromptCategory, Status } from "@/lib/types";
import { logCreativeRoutingRejection, CREATIVE_REJECTION_MESSAGE } from "@/lib/content/creative-rejection-log";
import { canEnqueueToCreativeQueue, isPollutedCreativeTitle } from "@/lib/content/creative-routing-guard";

export async function createImagePrompt(input: {
  title: string;
  category: ImagePromptCategory;
  prompt: string;
  style: string;
  status?: Status;
  sourceTable?: string;
  metadata?: Record<string, unknown>;
}): Promise<ActionResult> {
  if (isPollutedCreativeTitle(input.title)) {
    await logCreativeRoutingRejection({
      sourceTable: input.sourceTable ?? "manual",
      title: input.title,
      targetQueue: "image",
    });
    return { ok: false, error: CREATIVE_REJECTION_MESSAGE };
  }

  const metadata = {
    approved_for_creative: input.metadata?.approved_for_creative === true,
    image_ready: input.metadata?.image_ready === true,
    ...input.metadata,
  };

  if (!canEnqueueToCreativeQueue("image", input.sourceTable ?? "manual", metadata)) {
    await logCreativeRoutingRejection({
      sourceTable: input.sourceTable ?? "manual",
      title: input.title,
      targetQueue: "image",
    });
    return { ok: false, error: CREATIVE_REJECTION_MESSAGE };
  }

  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("image_prompts").insert({
      title: input.title,
      category: input.category,
      prompt: input.prompt,
      style: input.style,
      status: input.status ?? "draft",
      source_table: input.sourceTable ?? "",
      metadata,
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
