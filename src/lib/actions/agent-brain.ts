"use server";

import { revalidateDashboard } from "@/lib/actions/shared";
import { runAgentBrain } from "@/lib/agents/ai/agent-brain-engine";
import { isOpenAIConfigured } from "@/lib/openai/config";
import type { AgentSlug } from "@/lib/types";

export type AgentBrainRunResult =
  | {
      ok: true;
      runId: string;
      summary: string;
      recommendationsCount: number;
      messagesSent: number;
      tasksCreated: number;
      memoriesSaved: number;
      usedAI: boolean;
    }
  | { ok: false; error: string };

export async function runAgentBrainAction(agentId: AgentSlug): Promise<AgentBrainRunResult> {
  try {
    const result = await runAgentBrain(agentId);
    await revalidateDashboard();
    return {
      ok: true,
      runId: result.runId,
      summary: result.summary,
      recommendationsCount: result.recommendationsCount,
      messagesSent: result.messagesSent,
      tasksCreated: result.tasksCreated,
      memoriesSaved: result.memoriesSaved,
      usedAI: result.usedAI,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Agent brain run failed" };
  }
}

export async function getAgentBrainStatus(): Promise<{ configured: boolean; model: string }> {
  return {
    configured: isOpenAIConfigured(),
    model: process.env.OPENAI_MODEL ?? "gpt-4o",
  };
}
