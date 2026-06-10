import { createServerClient } from "@/lib/supabase";
import { mapAgentEvent, mapAgentMessage, mapAgentTask } from "@/lib/supabase/mappers";
import type { AgentSlug } from "@/lib/types";

export async function getAgentMessages(limit = 50) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("agent_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAgentMessage);
}

export async function getAgentTasks(limit = 50) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("agent_tasks")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAgentTask);
}

export async function getActiveAgentTasks() {
  const tasks = await getAgentTasks(100);
  return tasks.filter((t) => t.status === "pending" || t.status === "in_progress");
}

export async function getCompletedAgentTasks(limit = 20) {
  const tasks = await getAgentTasks(100);
  return tasks.filter((t) => t.status === "completed").slice(0, limit);
}

export async function getAgentEvents(limit = 50) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("agent_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAgentEvent);
}

export async function getUnreadMessages() {
  const messages = await getAgentMessages(100);
  return messages.filter((m) => m.status === "unread");
}

export async function getCollaborationStats() {
  const [messages, tasks, events] = await Promise.all([
    getAgentMessages(100),
    getAgentTasks(100),
    getAgentEvents(100),
  ]);

  const unreadMessages = messages.filter((m) => m.status === "unread").length;
  const activeTasks = tasks.filter((t) => t.status === "pending" || t.status === "in_progress").length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const urgentMessages = messages.filter((m) => m.priority === "urgent" && m.status === "unread").length;

  return {
    totalMessages: messages.length,
    unreadMessages,
    urgentMessages,
    activeTasks,
    completedTasks,
    totalEvents: events.length,
    recentEvents: events.slice(0, 10),
  };
}

export async function getCollaborationHQData() {
  const [messages, activeTasks, completedTasks, events, stats] = await Promise.all([
    getAgentMessages(30),
    getActiveAgentTasks(),
    getCompletedAgentTasks(10),
    getAgentEvents(25),
    getCollaborationStats(),
  ]);

  const activeMessageLines = messages
    .filter((m) => m.status === "unread" || m.status === "read")
    .slice(0, 12)
    .map((m) => ({ from: m.fromAgent, to: m.toAgent, priority: m.priority, id: m.id }));

  const notificationsByAgent = messages
    .filter((m) => m.status === "unread")
    .reduce<Record<AgentSlug, number>>((acc, m) => {
      acc[m.toAgent] = (acc[m.toAgent] ?? 0) + 1;
      return acc;
    }, {} as Record<AgentSlug, number>);

  return {
    messages,
    activeTasks,
    completedTasks,
    events,
    stats,
    activeMessageLines,
    notificationsByAgent,
  };
}
