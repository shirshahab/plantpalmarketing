"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidateDashboard } from "@/lib/actions/shared";
import type { ActionResult } from "@/lib/actions/shared";
import type { Partnership, PartnershipType } from "@/lib/types";

export async function createPartnership(input: {
  name: string;
  type: PartnershipType;
  contact: string;
  location: string;
  status?: Partnership["status"];
  notes?: string;
  opportunity?: string;
}): Promise<ActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("partnerships").insert({
      name: input.name,
      type: input.type,
      contact: input.contact,
      location: input.location,
      status: input.status ?? "lead",
      notes: input.notes ?? "",
      opportunity: input.opportunity ?? "",
    });
    if (error) return { ok: false, error: error.message };
    await revalidateDashboard();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updatePartnership(
  id: string,
  input: Partial<{
    name: string;
    type: PartnershipType;
    contact: string;
    location: string;
    status: Partnership["status"];
    notes: string;
    opportunity: string;
  }>
): Promise<ActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("partnerships").update(input).eq("id", id);
    if (error) return { ok: false, error: error.message };
    await revalidateDashboard();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
