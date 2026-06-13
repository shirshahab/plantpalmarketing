import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import type { Json } from "@/lib/supabase/database.types";

export type ApprovalHubType =
  | "blog_post"
  | "social_post"
  | "meme_idea"
  | "video_idea"
  | "image_asset"
  | "reddit_reply"
  | "creator_outreach"
  | "calendar_item"
  | "content";

export interface ApprovalHubItem {
  type: ApprovalHubType;
  title: string;
  summary: string;
  payload: Record<string, unknown>;
  sourceTrace: Record<string, unknown>;
  assignedAgent: string;
  destination?: string;
  channel?: string;
  draft?: string;
}

export async function logHqWorkflowEvent(input: {
  workflowName: string;
  sourceAgent: string;
  targetAgent: string;
  triggerType: string;
  triggerId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = createServerClient();
    await supabase.from("hq_workflow_events").insert({
      workflow_name: input.workflowName,
      source_agent: input.sourceAgent,
      target_agent: input.targetAgent,
      trigger_type: input.triggerType as "collab_message" | "activity" | "agent_event" | "task" | "demo",
      trigger_id: input.triggerId,
      status: "completed",
      completed_at: new Date().toISOString(),
      metadata: (input.metadata ?? {}) as Json,
    });
  } catch {
    // non-blocking — trigger_type may need migration extension
  }
}

export async function logAutomationRun(input: {
  runType: string;
  status: "running" | "completed" | "failed" | "skipped";
  summary: Record<string, unknown>;
  errors?: string[];
  agentId?: string;
}): Promise<string | null> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("automation_runs")
      .insert({
        run_type: input.runType,
        rule_key: input.runType,
        agent_id: input.agentId ?? "ivy",
        action: input.runType,
        status: input.status,
        summary: input.summary as Json,
        errors: (input.errors ?? []) as Json,
        metadata: input.summary as Json,
        detail: JSON.stringify(input.summary).slice(0, 500),
        completed_at: input.status === "running" ? null : new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) {
      if (isMissingTableError(error)) return null;
      return null;
    }
    return data ? String(data.id) : null;
  } catch {
    return null;
  }
}

export async function enqueueApprovalItem(item: ApprovalHubItem): Promise<string | null> {
  try {
    const supabase = createServerClient();
    const draft =
      item.draft ??
      `${item.title}\n\n${item.summary}`.trim();

    const { data, error } = await supabase
      .from("approval_queue")
      .insert({
        type: item.type === "blog_post" ? "content" : item.type === "social_post" ? "social_post" : "content",
        channel: item.channel ?? item.destination ?? item.type,
        draft,
        status: "pending",
        title: item.title,
        summary: item.summary,
        payload: item.payload as Json,
        source_trace: item.sourceTrace as Json,
        assigned_agent: item.assignedAgent,
        destination: item.destination ?? "",
        data_source: "live_api",
      })
      .select("id")
      .single();

    if (error) {
      if (isMissingTableError(error)) return null;
      return null;
    }

    await logHqWorkflowEvent({
      workflowName: `approval_${item.type}`,
      sourceAgent: item.assignedAgent as "bloom",
      targetAgent: "gate",
      triggerType: "agent_event",
      triggerId: String(data?.id ?? ""),
      metadata: { type: item.type, title: item.title },
    });

    return data ? String(data.id) : null;
  } catch {
    return null;
  }
}
