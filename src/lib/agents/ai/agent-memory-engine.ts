import { createServerClient } from "@/lib/supabase/server";
import type { AgentMemory, AgentSlug } from "@/lib/types";

export async function loadAgentMemory(agentId: AgentSlug, limit = 20): Promise<AgentMemory[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("agent_memory")
    .select("*")
    .eq("agent_id", agentId)
    .order("importance", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    agentId: row.agent_id as AgentSlug,
    memoryKey: row.memory_key,
    memoryValue: row.memory_value,
    memoryType: row.memory_type as AgentMemory["memoryType"],
    importance: row.importance,
    sourceRunId: row.source_run_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export function formatMemoryForPrompt(memories: AgentMemory[]): string {
  if (memories.length === 0) return "No prior memory for this agent.";
  return memories
    .map((m) => `[${m.memoryType}] ${m.memoryKey}: ${m.memoryValue}`)
    .join("\n");
}

export async function saveAgentMemory(
  agentId: AgentSlug,
  memoryKey: string,
  memoryValue: string,
  memoryType: AgentMemory["memoryType"],
  importance: number,
  sourceRunId?: string
): Promise<void> {
  const supabase = createServerClient();
  const { error } = await supabase.from("agent_memory").upsert(
    {
      agent_id: agentId,
      memory_key: memoryKey,
      memory_value: memoryValue,
      memory_type: memoryType,
      importance,
      source_run_id: sourceRunId ?? null,
    },
    { onConflict: "agent_id,memory_key" }
  );
  if (error) throw new Error(error.message);
}

export async function saveMemoriesFromBrain(
  agentId: AgentSlug,
  memories: { key: string; value: string; type: AgentMemory["memoryType"]; importance: number }[],
  runId: string
): Promise<number> {
  let saved = 0;
  for (const m of memories) {
    await saveAgentMemory(agentId, m.key, m.value, m.type, m.importance, runId);
    saved++;
  }
  return saved;
}
