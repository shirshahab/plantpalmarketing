import { randomUUID } from "crypto";
import { buildBrandVoicePrompt } from "@/lib/brand/brand-brain";
import { callOpenAIJson } from "@/lib/openai/client";
import { getOpenAIConfig, isOpenAIConfigured } from "@/lib/openai/config";
import { createServerClient } from "@/lib/supabase/server";
import { gatherAgentContext, formatContextForPrompt } from "@/lib/agents/ai/agent-context-engine";
import { loadAgentMemory, formatMemoryForPrompt, saveMemoriesFromBrain } from "@/lib/agents/ai/agent-memory-engine";
import { getProfileDefinition } from "@/lib/agents/ai/agent-profiles";
import type { AgentSlug } from "@/lib/types";
import type { Json } from "@/lib/supabase/database.types";

export interface BrainRecommendation {
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  confidence: number;
}

export interface BrainMessage {
  toAgent: AgentSlug;
  title: string;
  body: string;
  priority: "low" | "medium" | "high" | "urgent";
  messageType: "handoff" | "request" | "response" | "notification" | "status" | "broadcast";
}

export interface BrainTask {
  assignedAgent: AgentSlug;
  description: string;
  taskType: string;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
}

export interface BrainMemoryUpdate {
  key: string;
  value: string;
  type: "fact" | "pattern" | "history" | "insight" | "preference";
  importance: number;
}

export interface BrainOutput {
  summary: string;
  reasoning: string;
  recommendations: BrainRecommendation[];
  memoriesToSave: BrainMemoryUpdate[];
  messagesToSend: BrainMessage[];
  tasksToCreate: BrainTask[];
  agentSpecificActions?: Record<string, unknown>;
}

export interface BrainRunResult {
  runId: string;
  agentId: AgentSlug;
  summary: string;
  recommendationsCount: number;
  messagesSent: number;
  tasksCreated: number;
  memoriesSaved: number;
  decisionsLogged: number;
  usedAI: boolean;
}

const BRAIN_OUTPUT_SCHEMA = `Return ONLY valid JSON:
{
  "summary": "1-2 sentence executive summary of your analysis",
  "reasoning": "Brief explanation of how you used memory and context",
  "recommendations": [{ "title": "", "description": "", "priority": "low|medium|high|urgent", "confidence": 0-100 }],
  "memoriesToSave": [{ "key": "snake_case_key", "value": "what to remember", "type": "fact|pattern|history|insight|preference", "importance": 1-100 }],
  "messagesToSend": [{ "toAgent": "scout|roots|...", "title": "", "body": "", "priority": "low|medium|high|urgent", "messageType": "handoff|request|notification|broadcast" }],
  "tasksToCreate": [{ "assignedAgent": "scout|roots|...", "description": "", "taskType": "content_brief|partnership_review|...", "priority": "low|medium|high|urgent", "dueDate": "YYYY-MM-DD or omit" }],
  "agentSpecificActions": {}
}`;

function buildSystemPrompt(agentId: AgentSlug, profilePrompt: string, memory: string): string {
  return `${profilePrompt}

${buildBrandVoicePrompt()}

You are a real AI worker for PlantPal Marketing OS. You have:
- MEMORY of previous work (reference and update it)
- CONTEXT from the live database (read-only snapshot)
- ABILITY to recommend actions, send messages to other agents, create tasks, and save new memories

Rules:
- Never auto-publish, auto-post, or contact users directly
- Humans approve all outbound actions
- Reference your memory when patterns repeat
- Send messages only to agents you collaborate with
- Be specific and actionable

Your memory:
${memory}

${BRAIN_OUTPUT_SCHEMA}`;
}

async function logConversation(
  agentId: AgentSlug,
  runId: string,
  role: "system" | "user" | "assistant",
  content: string,
  tokensUsed?: number
): Promise<string> {
  const supabase = createServerClient();
  const { model } = getOpenAIConfig();
  const { data, error } = await supabase
    .from("agent_conversations")
    .insert({
      agent_id: agentId,
      run_id: runId,
      role,
      content: content.slice(0, 50000),
      model,
      tokens_used: tokensUsed ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

async function logDecision(
  agentId: AgentSlug,
  runId: string,
  conversationId: string,
  output: BrainOutput
): Promise<string> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("agent_decisions")
    .insert({
      agent_id: agentId,
      run_id: runId,
      conversation_id: conversationId,
      decision_type: "recommendation",
      title: output.summary.slice(0, 200),
      input_summary: "Brain run with memory + context",
      output_json: output as unknown as Json,
      reasoning: output.reasoning,
      confidence: output.recommendations[0]?.confidence ?? 70,
      status: "executed",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

async function executeBrainActions(
  agentId: AgentSlug,
  output: BrainOutput,
  runId: string
): Promise<{ messagesSent: number; tasksCreated: number; memoriesSaved: number }> {
  const supabase = createServerClient();

  let messagesSent = 0;
  for (const msg of output.messagesToSend) {
    const { error } = await supabase.from("agent_messages").insert({
      from_agent: agentId,
      to_agent: msg.toAgent,
      message_type: msg.messageType,
      priority: msg.priority,
      title: msg.title,
      body: msg.body,
      status: "unread",
    });
    if (!error) {
      messagesSent++;
      await supabase.from("agent_events").insert({
        event_type: "agent_message_sent",
        source_agent: agentId,
        target_agent: msg.toAgent,
        title: `${agentId} → ${msg.toAgent}: ${msg.title}`,
        summary: msg.body.slice(0, 200),
        impact: `Inter-agent handoff from ${agentId}`,
      });
    }
  }

  let tasksCreated = 0;
  for (const task of output.tasksToCreate) {
    const { error } = await supabase.from("agent_tasks").insert({
      assigned_agent: task.assignedAgent,
      created_by: agentId,
      task_type: task.taskType,
      description: task.description,
      priority: task.priority,
      status: "pending",
      due_date: task.dueDate ?? null,
    });
    if (!error) {
      tasksCreated++;
      await supabase.from("agent_events").insert({
        event_type: "agent_task_assigned",
        source_agent: agentId,
        target_agent: task.assignedAgent,
        title: `Task assigned to ${task.assignedAgent}`,
        summary: task.description.slice(0, 200),
        impact: `Delegated by ${agentId}`,
      });
    }
  }

  const memoriesSaved = await saveMemoriesFromBrain(agentId, output.memoriesToSave, runId);

  for (const rec of output.recommendations) {
    await supabase.from("agent_decisions").insert({
      agent_id: agentId,
      run_id: runId,
      decision_type: "recommendation",
      title: rec.title,
      input_summary: output.summary,
      output_json: rec as unknown as Json,
      reasoning: rec.description,
      confidence: rec.confidence,
      status: "pending",
    });
  }

  return { messagesSent, tasksCreated, memoriesSaved };
}

export async function runAgentBrain(agentId: AgentSlug): Promise<BrainRunResult> {
  const runId = randomUUID();
  const profile = getProfileDefinition(agentId);

  const [memories, context] = await Promise.all([
    loadAgentMemory(agentId),
    gatherAgentContext(agentId),
  ]);

  const memoryText = formatMemoryForPrompt(memories);
  const contextText = formatContextForPrompt(context);
  const systemPrompt = buildSystemPrompt(agentId, profile.systemPrompt, memoryText);

  const userPrompt = `Run your analysis now for PlantPal.

Your role: ${profile.role}
Your goal: ${profile.goal}
Your responsibilities: ${profile.responsibilities.join("; ")}

Live database context:
${contextText}

Reference your memory of previous work. Identify patterns, generate recommendations, send messages to collaborating agents if needed, create tasks, and save new memories worth keeping.`;

  let output: BrainOutput;
  let usedAI = false;

  if (isOpenAIConfigured()) {
    await logConversation(agentId, runId, "system", systemPrompt);
    await logConversation(agentId, runId, "user", userPrompt);

    output = await callOpenAIJson<BrainOutput>(systemPrompt, userPrompt, 0.7);
    usedAI = true;

    const assistantId = await logConversation(agentId, runId, "assistant", JSON.stringify(output));
    await logDecision(agentId, runId, assistantId, output);
  } else {
    output = buildFallbackOutput(agentId, memories, context);
    await logConversation(agentId, runId, "system", systemPrompt);
    await logConversation(agentId, runId, "user", userPrompt);
    await logConversation(agentId, runId, "assistant", JSON.stringify(output) + "\n[fallback — OpenAI not configured]");
  }

  const { messagesSent, tasksCreated, memoriesSaved } = await executeBrainActions(agentId, output, runId);

  const supabase = createServerClient();
  await supabase.from("agent_activity_log").insert({
    agent_id: agentId,
    action: usedAI ? "brain_run" : "brain_run_fallback",
    detail: `${profile.role} brain run — ${output.recommendations.length} recommendations, ${messagesSent} messages, ${tasksCreated} tasks`,
    metadata: { runId, usedAI, recommendations: output.recommendations.length },
  });

  return {
    runId,
    agentId,
    summary: output.summary,
    recommendationsCount: output.recommendations.length,
    messagesSent,
    tasksCreated,
    memoriesSaved,
    decisionsLogged: output.recommendations.length + 1,
    usedAI,
  };
}

function buildFallbackOutput(
  agentId: AgentSlug,
  memories: { memoryKey: string; memoryValue: string }[],
  context: { summary: string }
): BrainOutput {
  const topMemory = memories[0];
  return {
    summary: `${agentId} analyzed context using stored memory (OpenAI not configured — heuristic mode).`,
    reasoning: topMemory
      ? `Referenced memory: ${topMemory.memoryKey}`
      : "No prior memory — used database context only.",
    recommendations: [
      {
        title: `Review ${agentId} priorities`,
        description: context.summary,
        priority: "medium",
        confidence: 60,
      },
    ],
    memoriesToSave: [],
    messagesToSend: [],
    tasksToCreate: [],
  };
}

export function isAgentBrainAvailable(): boolean {
  return isOpenAIConfigured();
}
