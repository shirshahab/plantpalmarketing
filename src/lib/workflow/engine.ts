import { createServerClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/integrations/db-safe";
import type { Json } from "@/lib/supabase/database.types";
import {
  STAGE_ROUTING,
  type ContentWorkflowRow,
  type WorkflowHistoryEntry,
  type WorkflowStage,
} from "@/lib/workflow/types";

function asHistory(value: unknown): WorkflowHistoryEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter((e) => e && typeof e === "object") as WorkflowHistoryEntry[];
}

function mapRow(row: Record<string, unknown>): ContentWorkflowRow {
  return {
    id: String(row.id),
    sourceTable: String(row.source_table),
    sourceId: String(row.source_id),
    contentType: String(row.content_type ?? "content"),
    title: String(row.title ?? ""),
    currentStage: String(row.current_stage) as WorkflowStage,
    currentOwner: String(row.current_owner ?? ""),
    assignedAgent: String(row.assigned_agent ?? ""),
    nextAgent: String(row.next_agent ?? ""),
    nextAction: String(row.next_action ?? ""),
    destinationLabel: String(row.destination_label ?? ""),
    founderActionRequired: row.founder_action_required === true,
    lastTransitionAt: String(row.last_transition_at ?? row.updated_at ?? row.created_at),
    historyLog: asHistory(row.history_log),
    calendarItemId: row.calendar_item_id ? String(row.calendar_item_id) : null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function routingFor(stage: WorkflowStage) {
  return STAGE_ROUTING[stage] ?? STAGE_ROUTING.IDEA;
}

export async function ensureContentWorkflow(input: {
  sourceTable: string;
  sourceId: string;
  contentType: string;
  title: string;
  stage?: WorkflowStage;
  assignedAgent?: string;
  initialEvent?: string;
  actor?: string;
  destinationLabel?: string;
}): Promise<ContentWorkflowRow | null> {
  try {
    const supabase = createServerClient();
    const { data: existing } = await supabase
      .from("content_workflows")
      .select("*")
      .eq("source_table", input.sourceTable)
      .eq("source_id", input.sourceId)
      .maybeSingle();
    if (existing) return mapRow(existing as Record<string, unknown>);

    const stage = input.stage ?? "IDEA";
    const route = routingFor(stage);
    const now = new Date().toISOString();
    const entry: WorkflowHistoryEntry = {
      at: now,
      stage,
      event: input.initialEvent ?? "Workflow created",
      actor: input.actor ?? "system",
      agent: input.assignedAgent ?? route.assigned,
    };

    const { data, error } = await supabase
      .from("content_workflows")
      .insert({
        source_table: input.sourceTable,
        source_id: input.sourceId,
        content_type: input.contentType,
        title: input.title,
        current_stage: stage,
        current_owner: route.owner,
        assigned_agent: input.assignedAgent ?? route.assigned,
        next_agent: route.next,
        next_action: route.action,
        destination_label: input.destinationLabel ?? "",
        founder_action_required: route.founderAction,
        last_transition_at: now,
        history_log: [entry] as unknown as Json,
      })
      .select("*")
      .single();

    if (error) {
      if (isMissingTableError(error)) return null;
      throw new Error(error.message);
    }
    return mapRow(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function transitionContentWorkflow(input: {
  sourceTable: string;
  sourceId: string;
  toStage: WorkflowStage;
  event: string;
  actor?: string;
  agent?: string;
  note?: string;
  calendarItemId?: string;
  title?: string;
  contentType?: string;
  destinationLabel?: string;
  currentOwner?: string;
}): Promise<ContentWorkflowRow | null> {
  try {
    const supabase = createServerClient();
    const route = routingFor(input.toStage);
    const now = new Date().toISOString();

    let row = await getContentWorkflow(input.sourceTable, input.sourceId);
    if (!row) {
      row = await ensureContentWorkflow({
        sourceTable: input.sourceTable,
        sourceId: input.sourceId,
        contentType: input.contentType ?? "content",
        title: input.title ?? "Content item",
        stage: input.toStage,
        initialEvent: input.event,
        actor: input.actor,
        destinationLabel: input.destinationLabel,
      });
      if (!row) return null;
    }

    const entry: WorkflowHistoryEntry = {
      at: now,
      stage: input.toStage,
      event: input.event,
      actor: input.actor ?? "system",
      agent: input.agent,
      note: input.note,
      destination: input.destinationLabel,
    };
    const history = [...row.historyLog, entry];

    const patch = {
      current_stage: input.toStage,
      current_owner: input.currentOwner ?? route.owner,
      assigned_agent: input.agent ?? route.assigned,
      next_agent: route.next,
      next_action: route.action,
      destination_label: input.destinationLabel ?? row.destinationLabel,
      founder_action_required: route.founderAction,
      last_transition_at: now,
      history_log: history as unknown as Json,
      ...(input.calendarItemId ? { calendar_item_id: input.calendarItemId } : {}),
      ...(input.title ? { title: input.title } : {}),
    };

    const { data, error } = await supabase
      .from("content_workflows")
      .update(patch as never)
      .eq("source_table", input.sourceTable)
      .eq("source_id", input.sourceId)
      .select("*")
      .single();

    if (error) {
      if (isMissingTableError(error)) return null;
      throw new Error(error.message);
    }
    return mapRow(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function getContentWorkflow(
  sourceTable: string,
  sourceId: string
): Promise<ContentWorkflowRow | null> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("content_workflows")
      .select("*")
      .eq("source_table", sourceTable)
      .eq("source_id", sourceId)
      .maybeSingle();
    if (error) {
      if (isMissingTableError(error)) return null;
      throw new Error(error.message);
    }
    return data ? mapRow(data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function logWorkflowEvent(input: {
  sourceTable: string;
  sourceId: string;
  event: string;
  actor?: string;
  agent?: string;
  note?: string;
  destination?: string;
}): Promise<void> {
  const row = await getContentWorkflow(input.sourceTable, input.sourceId);
  if (!row) return;
  const entry: WorkflowHistoryEntry = {
    at: new Date().toISOString(),
    stage: row.currentStage,
    event: input.event,
    actor: input.actor ?? "system",
    agent: input.agent,
    note: input.note,
    destination: input.destination,
  };
  try {
    const supabase = createServerClient();
    await supabase
      .from("content_workflows")
      .update({ history_log: [...row.historyLog, entry] as unknown as Json })
      .eq("id", row.id);
  } catch {
    // non-blocking
  }
}
