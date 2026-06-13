import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import type { Json } from "@/lib/supabase/database.types";

export interface PipelineHistoryEntry {
  at: string;
  stage: string;
  event: string;
  actor?: string;
}

export interface ContentPipelineRow {
  id: string;
  sourceTable: string;
  sourceId: string;
  title: string;
  body: string;
  status: string;
  destination: string;
  workflowHistory: PipelineHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

function mapRow(row: Record<string, unknown>): ContentPipelineRow {
  const history = Array.isArray(row.workflow_history) ? row.workflow_history : [];
  return {
    id: String(row.id),
    sourceTable: String(row.source_table),
    sourceId: String(row.source_id),
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    status: String(row.status ?? "approved"),
    destination: String(row.destination ?? "bloom"),
    workflowHistory: history as PipelineHistoryEntry[],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

/** Insert approved idea into content_pipeline for Bloom + workflow tracking. */
export async function enqueueApprovedIdea(input: {
  sourceTable: string;
  sourceId: string;
  title: string;
  body?: string;
}): Promise<ContentPipelineRow | null> {
  try {
    const supabase = createServerClient();
    const now = new Date().toISOString();
    const history: PipelineHistoryEntry[] = [
      { at: now, stage: "idea_created", event: "Idea Created" },
      { at: now, stage: "approved", event: "Approved", actor: "founder" },
      { at: now, stage: "sent_to_bloom", event: "Sent to Bloom", actor: "founder" },
      { at: now, stage: "bloom_received", event: "Bloom Received", actor: "bloom" },
    ];

    const { data: existing } = await supabase
      .from("content_pipeline")
      .select("*")
      .eq("source_table", input.sourceTable)
      .eq("source_id", input.sourceId)
      .maybeSingle();

    if (existing) {
      const merged = [...mapRow(existing as Record<string, unknown>).workflowHistory, ...history.slice(-2)];
      const { data, error } = await supabase
        .from("content_pipeline")
        .update({
          status: "approved",
          destination: "bloom",
          title: input.title,
          body: input.body ?? "",
          workflow_history: merged as unknown as Json,
          updated_at: now,
        })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error) return null;
      return mapRow(data as Record<string, unknown>);
    }

    const { data, error } = await supabase
      .from("content_pipeline")
      .insert({
        source_table: input.sourceTable,
        source_id: input.sourceId,
        title: input.title,
        body: input.body ?? "",
        status: "approved",
        destination: "bloom",
        workflow_history: history as unknown as Json,
      })
      .select("*")
      .single();

    if (error) {
      if (isMissingTableError(error)) return null;
      throw error;
    }
    return mapRow(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function getBloomPipelineItems(limit = 20): Promise<ContentPipelineRow[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("content_pipeline")
      .select("*")
      .eq("destination", "bloom")
      .in("status", ["approved", "in_production", "script_generated", "video_generated"])
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) {
      if (isMissingTableError(error)) return [];
      return [];
    }
    return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function getBloomApprovalStats(): Promise<{ approvedToday: number; approvedThisWeek: number }> {
  try {
    const supabase = createServerClient();
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    const [today, week] = await Promise.all([
      supabase
        .from("content_pipeline")
        .select("*", { count: "exact", head: true })
        .eq("destination", "bloom")
        .gte("updated_at", todayStart.toISOString()),
      supabase
        .from("content_pipeline")
        .select("*", { count: "exact", head: true })
        .eq("destination", "bloom")
        .gte("updated_at", weekStart.toISOString()),
    ]);

    return {
      approvedToday: today.count ?? 0,
      approvedThisWeek: week.count ?? 0,
    };
  } catch {
    return { approvedToday: 0, approvedThisWeek: 0 };
  }
}

export async function getPipelineHistory(sourceTable: string, sourceId: string): Promise<PipelineHistoryEntry[]> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("content_pipeline")
      .select("workflow_history")
      .eq("source_table", sourceTable)
      .eq("source_id", sourceId)
      .maybeSingle();
    if (!data?.workflow_history || !Array.isArray(data.workflow_history)) return [];
    return data.workflow_history as unknown as PipelineHistoryEntry[];
  } catch {
    return [];
  }
}
