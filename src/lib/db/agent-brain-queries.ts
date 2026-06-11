import { createServerClient } from "@/lib/supabase";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import {
  mapAgentConversation,
  mapAgentDecision,
  mapAgentMemory,
  mapAgentProfile,
} from "@/lib/supabase/mappers";
import type { AgentSlug } from "@/lib/types";

export async function getAgentProfiles() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("agent_profiles")
    .select("*")
    .eq("is_active", true)
    .order("agent_id");
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map(mapAgentProfile);
}

export async function getAgentProfile(agentId: AgentSlug) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("agent_profiles")
    .select("*")
    .eq("agent_id", agentId)
    .maybeSingle();
  if (error) {
    if (isMissingTableError(error)) return null;
    throw new Error(error.message);
  }
  return data ? mapAgentProfile(data) : null;
}

export async function getAgentMemories(agentId?: AgentSlug, limit = 50) {
  const supabase = createServerClient();
  let query = supabase.from("agent_memory").select("*").order("importance", { ascending: false }).limit(limit);
  if (agentId) query = query.eq("agent_id", agentId);
  const { data, error } = await query;
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map(mapAgentMemory);
}

export async function getAgentConversations(agentId?: AgentSlug, limit = 30) {
  const supabase = createServerClient();
  let query = supabase.from("agent_conversations").select("*").order("created_at", { ascending: false }).limit(limit);
  if (agentId) query = query.eq("agent_id", agentId);
  const { data, error } = await query;
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map(mapAgentConversation);
}

export async function getAgentDecisions(agentId?: AgentSlug, limit = 30) {
  const supabase = createServerClient();
  let query = supabase.from("agent_decisions").select("*").order("created_at", { ascending: false }).limit(limit);
  if (agentId) query = query.eq("agent_id", agentId);
  const { data, error } = await query;
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map(mapAgentDecision);
}

export async function getAgentBrainStats() {
  const [profiles, memories, conversations, decisions] = await Promise.all([
    getAgentProfiles(),
    getAgentMemories(undefined, 100),
    getAgentConversations(undefined, 100),
    getAgentDecisions(undefined, 100),
  ]);

  const recentRuns = new Set(conversations.map((c) => c.runId)).size;
  const pendingDecisions = decisions.filter((d) => d.status === "pending").length;

  return {
    activeAgents: profiles.length,
    totalMemories: memories.length,
    totalConversations: conversations.length,
    totalDecisions: decisions.length,
    recentRuns,
    pendingDecisions,
  };
}
