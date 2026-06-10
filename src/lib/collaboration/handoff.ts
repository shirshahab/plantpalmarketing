import { createServerClient } from "@/lib/supabase/server";

export interface HandoffInput {
  /** Agent that finished its part of the work. */
  fromAgent: string;
  /** Agent that should pick the work up next. */
  toAgent: string;
  /** Pipeline name shown in HQ, e.g. "Scout → Oak". */
  workflowName: string;
  /** What triggered the handoff, e.g. "creator_lead". */
  triggerType: string;
  /** Optional id of the triggering record. */
  triggerId?: string;
  /** Task the receiving agent should execute. */
  taskType: string;
  taskDescription: string;
  priority?: "low" | "medium" | "high" | "urgent";
  /** Message shown in the receiving agent's inbox. */
  messageTitle: string;
  messageBody: string;
  /** Human-readable activity feed line. */
  activityDetail: string;
  metadata?: Record<string, unknown>;
}

/**
 * Phase 28 — active pipeline movement. When work enters an agent's area, the
 * previous agent automatically creates the next task, a message, an activity
 * item, and an HQ workflow movement. Every write is best-effort: a missing
 * optional table never blocks the producing agent's run.
 */
export async function recordHandoff(input: HandoffInput): Promise<void> {
  const supabase = createServerClient();
  const priority = input.priority ?? "medium";

  const writes: Promise<unknown>[] = [
    // 1. Next agent receives an actionable task
    Promise.resolve(
      supabase.from("agent_tasks").insert({
        assigned_agent: input.toAgent,
        created_by: input.fromAgent,
        task_type: input.taskType,
        description: input.taskDescription,
        priority,
        status: "pending",
      })
    ),
    // 2. Message in the receiving agent's inbox
    Promise.resolve(
      supabase.from("agent_messages").insert({
        from_agent: input.fromAgent,
        to_agent: input.toAgent,
        message_type: "handoff",
        priority,
        title: input.messageTitle,
        body: input.messageBody,
        status: "unread",
      })
    ),
    // 3. Activity feed line
    Promise.resolve(
      supabase.from("agent_activity_log").insert({
        agent_id: input.fromAgent,
        action: "handoff",
        detail: input.activityDetail,
        metadata: { to_agent: input.toAgent, workflow: input.workflowName, ...(input.metadata ?? {}) },
      })
    ),
    // 4. HQ movement (drives the living-world choreography)
    Promise.resolve(
      supabase.from("hq_workflow_events").insert({
        workflow_name: input.workflowName,
        source_agent: input.fromAgent,
        target_agent: input.toAgent,
        trigger_type: input.triggerType,
        ...(input.triggerId ? { trigger_id: input.triggerId } : {}),
        status: "active",
        metadata: (input.metadata ?? {}) as never,
      })
    ),
  ];

  const results = await Promise.allSettled(writes);
  void results; // individual failures (missing tables) are intentionally ignored
}
