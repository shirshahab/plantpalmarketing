import { createServerClient } from "@/lib/supabase";
import { isMissingTableError } from "@/lib/integrations/db-safe";

export interface LaunchItem {
  id: string;
  itemKey: string;
  label: string;
  category: string;
  status: string;
  scoreWeight: number;
  notes: string;
  lastCheckedAt: string | null;
}

export interface LaunchData {
  items: LaunchItem[];
  score: number;
  maxScore: number;
  launchReady: boolean;
}

export async function getLaunchData(): Promise<LaunchData> {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("launch_checklist").select("*").order("category");
  if (error) {
    if (isMissingTableError(error)) return { items: [], score: 0, maxScore: 0, launchReady: false };
    throw new Error(error.message);
  }

  const items: LaunchItem[] = (data ?? []).map((row) => ({
    id: row.id,
    itemKey: row.item_key,
    label: row.label,
    category: row.category,
    status: row.status,
    scoreWeight: row.score_weight,
    notes: row.notes,
    lastCheckedAt: row.last_checked_at,
  }));

  const maxScore = items.reduce((s, i) => s + i.scoreWeight, 0);
  const earned = items.filter((i) => i.status === "ready").reduce((s, i) => s + i.scoreWeight, 0);
  const score = maxScore > 0 ? Math.round((earned / maxScore) * 100) : 0;

  return {
    items,
    score,
    maxScore,
    launchReady: items.length > 0 && items.every((i) => i.status === "ready"),
  };
}
