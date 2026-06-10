"use server";

import { revalidateDashboard } from "@/lib/actions/shared";
import { createServerClient } from "@/lib/supabase/server";

export type CollaborationActionResult = { ok: true } | { ok: false; error: string };

export async function acknowledgeAgentMessage(messageId: string): Promise<CollaborationActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("agent_messages")
      .update({ status: "acknowledged" })
      .eq("id", messageId);
    if (error) return { ok: false, error: error.message };
    await revalidateDashboard();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to acknowledge message" };
  }
}

export async function markMessageRead(messageId: string): Promise<CollaborationActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("agent_messages")
      .update({ status: "read" })
      .eq("id", messageId);
    if (error) return { ok: false, error: error.message };
    await revalidateDashboard();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to mark message read" };
  }
}

export async function completeAgentTask(taskId: string): Promise<CollaborationActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("agent_tasks")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", taskId);
    if (error) return { ok: false, error: error.message };
    await revalidateDashboard();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to complete task" };
  }
}

export async function startAgentTask(taskId: string): Promise<CollaborationActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("agent_tasks")
      .update({ status: "in_progress" })
      .eq("id", taskId);
    if (error) return { ok: false, error: error.message };
    await revalidateDashboard();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to start task" };
  }
}
