import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";

export interface SavedIntelligenceAlert {
  id: string;
  title: string;
  source: string;
  subreddit: string;
  url: string;
  classification: string | null;
  priority: string | null;
  assignedAgent: string | null;
  status: string;
  createdAt: string;
  classificationReason: string | null;
  body: string;
}

export interface SavedAlertFilters {
  status?: string;
  classification?: string;
  priority?: string;
  assignedAgent?: string;
}

function mapRow(row: Record<string, unknown>): SavedIntelligenceAlert {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    source: String(row.source ?? ""),
    subreddit: String(row.subreddit ?? ""),
    url: String(row.url ?? ""),
    classification: row.classification ? String(row.classification) : null,
    priority: row.priority ? String(row.priority) : null,
    assignedAgent: row.assigned_agent ? String(row.assigned_agent) : null,
    status: String(row.status ?? "new"),
    createdAt: String(row.created_at),
    classificationReason: row.classification_reason ? String(row.classification_reason) : null,
    body: String(row.body ?? ""),
  };
}

export async function getSavedIntelligenceAlerts(
  filters: SavedAlertFilters = {},
  limit = 100
): Promise<{ alerts: SavedIntelligenceAlert[]; total: number }> {
  try {
    const supabase = createServerClient();
    let query = supabase
      .from("intelligence_alerts")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (filters.status) query = query.eq("status", filters.status);
    if (filters.classification) query = query.eq("classification", filters.classification);
    if (filters.priority) query = query.eq("priority", filters.priority);
    if (filters.assignedAgent) query = query.eq("assigned_agent", filters.assignedAgent);

    const { data, count, error } = await query;
    if (error) {
      if (isMissingTableError(error)) return { alerts: [], total: 0 };
      throw error;
    }

    return {
      alerts: (data ?? []).map((r) => mapRow(r as Record<string, unknown>)),
      total: count ?? 0,
    };
  } catch {
    return { alerts: [], total: 0 };
  }
}

export async function getIntelligenceFilterOptions(): Promise<{
  statuses: string[];
  classifications: string[];
  priorities: string[];
  agents: string[];
}> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("intelligence_alerts")
      .select("status, classification, priority, assigned_agent")
      .limit(500);

    const statuses = new Set<string>();
    const classifications = new Set<string>();
    const priorities = new Set<string>();
    const agents = new Set<string>();

    for (const row of data ?? []) {
      if (row.status) statuses.add(String(row.status));
      if (row.classification) classifications.add(String(row.classification));
      if (row.priority) priorities.add(String(row.priority));
      if (row.assigned_agent) agents.add(String(row.assigned_agent));
    }

    return {
      statuses: [...statuses].sort(),
      classifications: [...classifications].sort(),
      priorities: [...priorities].sort(),
      agents: [...agents].sort(),
    };
  } catch {
    return { statuses: [], classifications: [], priorities: [], agents: [] };
  }
}

/** Founder Live Intelligence — high priority only, newest first. */
export async function getLiveIntelligenceAlerts(limit = 20): Promise<SavedIntelligenceAlert[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("intelligence_alerts")
      .select("*")
      .eq("priority", "high")
      .neq("status", "archived")
      .neq("status", "ignored")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      if (isMissingTableError(error)) return [];
      throw error;
    }
    return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
  } catch {
    return [];
  }
}
