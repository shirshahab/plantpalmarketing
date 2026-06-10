"use client";

import { useState } from "react";
import { Activity, CheckCircle2, GitBranch, Mail, Network } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ActivityStream } from "@/components/collaboration/activity-stream";
import { MessageBoard } from "@/components/collaboration/message-board";
import { TaskBoard } from "@/components/collaboration/task-board";
import { AGENT_RELATIONSHIPS, AGENT_SLUG_LABELS } from "@/lib/agents/agent-slugs";
import type { AgentEvent, AgentMessage, AgentTask } from "@/lib/types";

type Tab = "stream" | "messages" | "tasks" | "relationships";

const TABS: { id: Tab; label: string; icon: typeof Activity }[] = [
  { id: "stream", label: "Activity Stream", icon: Activity },
  { id: "messages", label: "Messages", icon: Mail },
  { id: "tasks", label: "Tasks", icon: CheckCircle2 },
  { id: "relationships", label: "Relationships", icon: Network },
];

export function CollaborationPanel({
  messages,
  activeTasks,
  completedTasks,
  events,
  stats,
}: {
  messages: AgentMessage[];
  activeTasks: AgentTask[];
  completedTasks: AgentTask[];
  events: AgentEvent[];
  stats: {
    totalMessages: number;
    unreadMessages: number;
    urgentMessages: number;
    activeTasks: number;
    completedTasks: number;
    totalEvents: number;
  };
}) {
  const [tab, setTab] = useState<Tab>("stream");

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50 to-white p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-700 text-white">
            <GitBranch className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-brand-primary">Agent Collaboration System</h2>
            <p className="text-sm text-brand-muted">Agents communicate, delegate tasks, and share events — no longer operating independently.</p>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Messages" value={stats.totalMessages} icon={Mail} />
        <StatCard label="Unread" value={stats.unreadMessages} icon={Mail} />
        <StatCard label="Active Tasks" value={stats.activeTasks} icon={CheckCircle2} />
        <StatCard label="Completed" value={stats.completedTasks} icon={CheckCircle2} />
        <StatCard label="Events" value={stats.totalEvents} icon={Activity} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
              tab === id
                ? "border-violet-600 bg-violet-600 text-white"
                : "border-brand-border bg-white text-brand-muted hover:border-violet-300"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "stream" && <ActivityStream events={events} />}
      {tab === "messages" && <MessageBoard messages={messages} />}
      {tab === "tasks" && (
        <div className="space-y-6">
          <section>
            <h3 className="mb-3 font-heading text-sm font-semibold text-brand-primary">Active Tasks</h3>
            <TaskBoard tasks={activeTasks} />
          </section>
          <section>
            <h3 className="mb-3 font-heading text-sm font-semibold text-brand-primary">Completed Tasks</h3>
            <TaskBoard tasks={completedTasks} showCompleted />
          </section>
        </div>
      )}
      {tab === "relationships" && (
        <Card>
          <CardHeader>
            <h3 className="font-heading text-lg font-semibold text-brand-primary">Agent Communication Paths</h3>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {AGENT_RELATIONSHIPS.map((rel) => (
                <div key={`${rel.from}-${rel.to}`} className="flex items-center gap-3 rounded-xl border border-brand-border bg-brand-bg/30 px-4 py-3">
                  <span className="text-sm font-medium text-brand-primary">{AGENT_SLUG_LABELS[rel.from]}</span>
                  <span className="text-brand-sage">→</span>
                  <span className="text-sm font-medium text-brand-primary">{AGENT_SLUG_LABELS[rel.to]}</span>
                  <span className="ml-auto text-[10px] text-brand-muted">{rel.label}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-brand-muted">
              Ivy broadcasts directives to all agents. Every handoff creates a message, task, and activity stream event.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
