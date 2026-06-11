import { createServerClient } from "@/lib/supabase";
import { isMissingTableError } from "@/lib/integrations/db-safe";

export interface MemoryHint {
  type: string;
  key: string;
  value: string;
}

/**
 * Phase 31 Step 2 — agent memory influences future generation.
 * Pulls the most important memories for an agent (founder feedback, approved
 * patterns, rejected styles) so prompts can learn from past decisions.
 */
export async function getMemoryHints(agentId: string, limit = 8): Promise<MemoryHint[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("agent_memory")
      .select("memory_type, memory_key, memory_value, importance")
      .eq("agent_id", agentId)
      .order("importance", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) {
      if (isMissingTableError(error)) return [];
      throw new Error(error.message);
    }
    return (data ?? [])
      .filter((m) => m.memory_value)
      .map((m) => ({ type: m.memory_type, key: m.memory_key, value: m.memory_value }));
  } catch {
    return [];
  }
}

/** Format memories as prompt lines. Empty string when there's nothing learned yet. */
export async function buildMemoryPromptBlock(agentIds: string[], limit = 6): Promise<string> {
  const all = await Promise.all(agentIds.map((id) => getMemoryHints(id, limit)));
  const lines = all
    .flatMap((hints, i) =>
      hints.map((h) => `- [${agentIds[i]}/${h.type}] ${h.key}: ${h.value}`)
    )
    .slice(0, limit * agentIds.length);
  if (lines.length === 0) return "";
  return `\n\nLearned from past founder feedback (apply these lessons):\n${lines.join("\n")}`;
}

/** Store a learning so future generations improve. Best-effort. */
export async function rememberLesson(input: {
  agentId: string;
  memoryType: string;
  memoryKey: string;
  memoryValue: string;
  importance?: number;
}): Promise<void> {
  try {
    const supabase = createServerClient();
    await supabase.from("agent_memory").upsert(
      {
        agent_id: input.agentId,
        memory_type: input.memoryType,
        memory_key: input.memoryKey,
        memory_value: input.memoryValue,
        importance: input.importance ?? 60,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "agent_id,memory_key" }
    );
  } catch {
    // memory is optional — never block the main flow
  }
}
