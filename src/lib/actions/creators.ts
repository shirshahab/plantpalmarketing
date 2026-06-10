"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidateDashboard } from "@/lib/actions/shared";
import type { ActionResult } from "@/lib/actions/shared";
import type { Creator, Platform } from "@/lib/types";

export async function createCreator(input: {
  name: string;
  platform: Platform;
  niche: string;
  followers: number;
  engagementRate: number;
  email: string;
  status?: Creator["status"];
  notes?: string;
  partnershipIdea?: string;
}): Promise<ActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("creators").insert({
      name: input.name,
      platform: input.platform,
      niche: input.niche,
      followers: input.followers,
      engagement_rate: input.engagementRate,
      email: input.email,
      status: input.status ?? "prospect",
      notes: input.notes ?? "",
      partnership_idea: input.partnershipIdea ?? "",
    });
    if (error) return { ok: false, error: error.message };
    await revalidateDashboard();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateCreator(
  id: string,
  input: Partial<{
    name: string;
    platform: Platform;
    niche: string;
    followers: number;
    engagementRate: number;
    email: string;
    status: Creator["status"];
    notes: string;
    partnershipIdea: string;
  }>
): Promise<ActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("creators")
      .update({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.platform !== undefined && { platform: input.platform }),
        ...(input.niche !== undefined && { niche: input.niche }),
        ...(input.followers !== undefined && { followers: input.followers }),
        ...(input.engagementRate !== undefined && { engagement_rate: input.engagementRate }),
        ...(input.email !== undefined && { email: input.email }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.partnershipIdea !== undefined && { partnership_idea: input.partnershipIdea }),
      })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    await revalidateDashboard();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
