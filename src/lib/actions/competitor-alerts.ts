"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidateDashboard } from "@/lib/actions/shared";
import type { ActionResult } from "@/lib/actions/shared";
import type { CompetitorAlertType } from "@/lib/types";

export async function createCompetitorAlert(input: {
  competitor: string;
  type: CompetitorAlertType;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
}): Promise<ActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("competitor_alerts").insert(input);
    if (error) return { ok: false, error: error.message };
    await revalidateDashboard();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
