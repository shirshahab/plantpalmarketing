import { createServerClient } from "@/lib/supabase";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import {
  mapAgentDailyBrief,
  mapDiscoveryItem,
  mapPipelineContent,
} from "@/lib/supabase/mappers";
import type { PipelineStatus } from "@/lib/types";

export async function getLatestDailyBrief() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("agent_daily_briefs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    if (isMissingTableError(error)) return null;
    throw new Error(error.message);
  }
  return data ? mapAgentDailyBrief(data) : null;
}

export async function getDailyBriefs(limit = 10) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("agent_daily_briefs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map(mapAgentDailyBrief);
}

export async function getDiscoveryItemsByBrief(briefId: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("discovery_items")
    .select("*")
    .eq("brief_id", briefId)
    .order("relevance_score", { ascending: false });
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map(mapDiscoveryItem);
}

export async function getPipelineContent(status?: PipelineStatus) {
  const supabase = createServerClient();
  let query = supabase.from("pipeline_content").select("*").order("aggregate_score", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapPipelineContent);
}

export async function getPipelineContentByBrief(briefId: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("pipeline_content")
    .select("*")
    .eq("brief_id", briefId)
    .order("aggregate_score", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapPipelineContent);
}

export async function getAgentStats() {
  const supabase = createServerClient();
  const [briefs, pipeline, pending, approved, rejected] = await Promise.all([
    supabase.from("agent_daily_briefs").select("*", { count: "exact", head: true }),
    supabase.from("pipeline_content").select("*", { count: "exact", head: true }),
    supabase.from("pipeline_content").select("*", { count: "exact", head: true }).eq("status", "pending_review"),
    supabase.from("pipeline_content").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("pipeline_content").select("*", { count: "exact", head: true }).eq("status", "rejected"),
  ]);

  return {
    briefCount: briefs.count ?? 0,
    pipelineCount: pipeline.count ?? 0,
    pendingCount: pending.count ?? 0,
    approvedCount: approved.count ?? 0,
    rejectedCount: rejected.count ?? 0,
  };
}
