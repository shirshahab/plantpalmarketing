"use client";

import { useState } from "react";
import { X, Activity, Mail, ListTodo, Brain, Lightbulb, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AgentCharacter } from "@/components/hq/agent-character";
import { AgentStatusBadge } from "@/components/hq/agent-status-badge";
import { AGENT_SLUG_LABELS, hqIdToSlug } from "@/lib/agents/agent-slugs";
import type { ActivityItem, HQAgent } from "@/lib/hq/types";
import type { AgentDecision, AgentMemory, AgentMessage, AgentTask } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

type DrawerTab = "overview" | "tasks" | "messages" | "activity" | "memory" | "recommendations";

const TABS: { id: DrawerTab; label: string; icon: typeof Activity }[] = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "messages", label: "Messages", icon: Mail },
  { id: "recommendations", label: "Recommendations", icon: Lightbulb },
  { id: "memory", label: "Memory", icon: History },
  { id: "activity", label: "Activity", icon: Brain },
];

export function HQLivingAgentDrawer({
  agent,
  tasks,
  messages,
  memories,
  decisions,
  feedItems,
  onClose,
}: {
  agent: HQAgent | null;
  tasks: AgentTask[];
  messages: AgentMessage[];
  memories: AgentMemory[];
  decisions: AgentDecision[];
  feedItems: ActivityItem[];
  onClose: () => void;
}) {
  const [tab, setTab] = useState<DrawerTab>("overview");

  if (!agent) return null;

  const slug = hqIdToSlug(agent.id);
  const agentTasks = tasks.filter((t) => t.assignedAgent === slug || t.createdBy === slug);
  const agentMessages = messages.filter((m) => m.fromAgent === slug || m.toAgent === slug);
  const agentMemories = memories.filter((m) => m.agentId === slug);
  const agentDecisions = decisions.filter((d) => d.agentId === slug);
  const agentFeed = feedItems.filter((f) => f.agentId === agent.id);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-brand-primary/25 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <aside className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-lg flex-col border-l border-brand-border bg-white shadow-2xl sm:top-16">
        <div className="flex items-center justify-between border-b border-brand-border px-5 py-4">
          <h2 className="font-heading text-lg font-bold text-brand-primary">Agent Detail</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-brand-muted hover:bg-brand-bg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-brand-border px-5 py-4">
          <div className="flex items-start gap-4">
            <AgentCharacter agent={agent} floatDelay="" isActive />
            <div>
              <p className="font-heading text-xl font-bold text-brand-primary">{agent.name}</p>
              <p className="text-sm text-brand-muted">{agent.role}</p>
              <p className="text-xs text-brand-sage">{agent.station}</p>
              <div className="mt-2"><AgentStatusBadge status={agent.status} /></div>
            </div>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-brand-border px-3 py-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                tab === id ? "bg-brand-primary text-white" : "text-brand-muted hover:bg-brand-bg"
              }`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === "overview" && (
            <div className="space-y-4">
              <section>
                <h3 className="text-xs font-semibold uppercase text-brand-sage">Current task</h3>
                <p className="mt-1 text-sm text-brand-primary">{agent.currentTask}</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-primary/10">
                  <div className="h-full rounded-full bg-brand-accent" style={{ width: `${agent.progress}%` }} />
                </div>
                <p className="mt-1 text-xs text-brand-muted">Productivity {agent.progress}%</p>
              </section>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border bg-brand-bg/50 p-3">
                  <p className="text-xs text-brand-muted">Created</p>
                  <p className="font-heading text-2xl font-bold">{agent.itemsCreated}</p>
                </div>
                <div className="rounded-xl border bg-brand-bg/50 p-3">
                  <p className="text-xs text-brand-muted">Needs review</p>
                  <p className="font-heading text-2xl font-bold">{agent.itemsNeedingReview}</p>
                </div>
              </div>
            </div>
          )}

          {tab === "tasks" && (
            <div className="space-y-3">
              {agentTasks.length === 0 ? (
                <p className="text-sm text-brand-muted">No tasks assigned.</p>
              ) : (
                agentTasks.map((t) => (
                  <div key={t.id} className="rounded-xl border p-3">
                    <div className="flex gap-2">
                      <Badge variant={t.priority === "urgent" ? "danger" : "muted"}>{t.status}</Badge>
                      <Badge variant="info">{t.taskType.replace(/_/g, " ")}</Badge>
                    </div>
                    <p className="mt-2 text-sm">{t.description}</p>
                    <p className="mt-1 text-xs text-brand-muted">
                      {AGENT_SLUG_LABELS[t.createdBy] ?? t.createdBy} → {AGENT_SLUG_LABELS[t.assignedAgent] ?? t.assignedAgent}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "messages" && (
            <div className="space-y-3">
              {agentMessages.length === 0 ? (
                <p className="text-sm text-brand-muted">No messages.</p>
              ) : (
                agentMessages.map((m) => (
                  <div key={m.id} className={`rounded-xl border p-3 ${m.status === "unread" ? "border-sky-200 bg-sky-50/40" : ""}`}>
                    <p className="text-xs font-medium">
                      {AGENT_SLUG_LABELS[m.fromAgent] ?? m.fromAgent} → {AGENT_SLUG_LABELS[m.toAgent] ?? m.toAgent}
                    </p>
                    <p className="mt-1 font-medium text-sm">{m.title}</p>
                    <p className="mt-1 text-xs text-brand-muted">{m.body}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "recommendations" && (
            <div className="space-y-3">
              {agentDecisions.length === 0 ? (
                <p className="text-sm text-brand-muted">No AI recommendations yet. Run Agent Brain.</p>
              ) : (
                agentDecisions.map((d) => (
                  <div key={d.id} className="rounded-xl border p-3">
                    <div className="flex gap-2">
                      <Badge variant="info">{d.decisionType}</Badge>
                      <Badge variant="muted">{d.confidence}%</Badge>
                    </div>
                    <p className="mt-2 font-medium text-sm">{d.title}</p>
                    <p className="mt-1 text-xs text-brand-muted">{d.reasoning}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "memory" && (
            <div className="space-y-3">
              {agentMemories.length === 0 ? (
                <p className="text-sm text-brand-muted">No stored memory.</p>
              ) : (
                agentMemories.map((m) => (
                  <div key={m.id} className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-3">
                    <Badge variant="muted">{m.memoryType}</Badge>
                    <p className="mt-2 font-medium text-sm">{m.memoryKey.replace(/_/g, " ")}</p>
                    <p className="mt-1 text-xs text-brand-muted">{m.memoryValue}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "activity" && (
            <div className="space-y-3">
              {(agent.activity ?? []).map((log) => (
                <div key={log.id} className="rounded-xl border bg-brand-bg/30 px-3 py-2">
                  <p className="text-xs font-medium">{log.detail}</p>
                  <p className="text-[10px] text-brand-sage">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </p>
                </div>
              ))}
              {agentFeed.map((item) => (
                <div key={item.id} className="rounded-xl border px-3 py-2">
                  <p className="text-xs font-medium">{item.title}</p>
                  <p className="text-[10px] text-brand-muted">{item.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-brand-border p-4">
          <Button variant="secondary" className="w-full" onClick={onClose}>Close</Button>
        </div>
      </aside>
    </>
  );
}
