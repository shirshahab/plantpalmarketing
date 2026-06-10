"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Brain, Cpu, Database, History, Lightbulb, Loader2, MessageSquare, Play, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { runAgentBrainAction } from "@/lib/actions/agent-brain";
import { AGENT_SLUG_LABELS } from "@/lib/agents/agent-slugs";
import type {
  AgentConversation, AgentDecision, AgentMemory, AgentProfile, AgentSlug,
} from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

type Tab = "profiles" | "memory" | "conversations" | "decisions";

const TABS: { id: Tab; label: string; icon: typeof Brain }[] = [
  { id: "profiles", label: "Agent Profiles", icon: Brain },
  { id: "memory", label: "Memory", icon: History },
  { id: "conversations", label: "Conversations", icon: MessageSquare },
  { id: "decisions", label: "Decisions", icon: Lightbulb },
];

export function AgentBrainPanel({
  profiles,
  memories,
  conversations,
  decisions,
  stats,
  openaiConfigured,
  model,
}: {
  profiles: AgentProfile[];
  memories: AgentMemory[];
  conversations: AgentConversation[];
  decisions: AgentDecision[];
  stats: {
    activeAgents: number;
    totalMemories: number;
    totalConversations: number;
    totalDecisions: number;
    recentRuns: number;
    pendingDecisions: number;
  };
  openaiConfigured: boolean;
  model: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profiles");
  const [pending, startTransition] = useTransition();
  const [runningAgent, setRunningAgent] = useState<AgentSlug | null>(null);
  const [result, setResult] = useState<string | null>(null);

  function handleRunBrain(agentId: AgentSlug) {
    setRunningAgent(agentId);
    setResult(null);
    startTransition(async () => {
      const res = await runAgentBrainAction(agentId);
      setRunningAgent(null);
      if (res.ok) {
        setResult(
          `${AGENT_SLUG_LABELS[agentId]} brain run complete${res.usedAI ? ` (${model})` : " (fallback)"} — ${res.recommendationsCount} recommendations, ${res.messagesSent} messages, ${res.tasksCreated} tasks, ${res.memoriesSaved} memories saved.`
        );
        router.refresh();
      } else {
        setResult(res.error);
      }
    });
  }

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50 to-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-700 text-white">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-brand-primary">Agent Brain Engine</h2>
              <p className="text-sm text-brand-muted">Real AI workers with role, goal, memory, and context</p>
            </div>
          </div>
          <Badge variant={openaiConfigured ? "success" : "warning"}>
            {openaiConfigured ? `OpenAI · ${model}` : "OpenAI not configured"}
          </Badge>
        </div>
        {!openaiConfigured && (
          <p className="mt-3 text-sm text-amber-800">
            Add OPENAI_API_KEY to .env.local for full AI intelligence. Fallback heuristic mode available.
          </p>
        )}
        {result && <p className="mt-3 text-sm text-indigo-900">{result}</p>}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Active Agents" value={stats.activeAgents} icon={Brain} />
        <StatCard label="Memory Entries" value={stats.totalMemories} icon={History} />
        <StatCard label="Conversations" value={stats.totalConversations} icon={MessageSquare} />
        <StatCard label="Decisions" value={stats.totalDecisions} icon={Lightbulb} />
        <StatCard label="Brain Runs" value={stats.recentRuns} icon={Cpu} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
              tab === id
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-brand-border bg-white text-brand-muted hover:border-indigo-300"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "profiles" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-semibold text-brand-primary">{AGENT_SLUG_LABELS[p.agentId]}</h3>
                  <Badge variant="info">{p.role}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-brand-muted">{p.goal}</p>
                <ul className="space-y-1">
                  {p.responsibilities.slice(0, 3).map((r, i) => (
                    <li key={i} className="text-xs text-brand-sage">• {r}</li>
                  ))}
                </ul>
                <Button
                  size="sm"
                  className="w-full"
                  disabled={pending && runningAgent === p.agentId}
                  onClick={() => handleRunBrain(p.agentId)}
                >
                  {pending && runningAgent === p.agentId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Run Brain
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === "memory" && (
        <div className="space-y-3">
          {memories.length === 0 ? (
            <p className="text-sm text-brand-muted">No agent memory yet. Run an agent brain to create memories.</p>
          ) : (
            memories.map((m) => (
              <div key={m.id} className="rounded-xl border border-brand-border bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="muted">{AGENT_SLUG_LABELS[m.agentId]}</Badge>
                  <Badge variant="info">{m.memoryType}</Badge>
                  <Badge variant={m.importance >= 85 ? "warning" : "muted"}>importance {m.importance}</Badge>
                  <span className="ml-auto text-[10px] text-brand-sage">
                    {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-2 font-medium text-brand-primary">{m.memoryKey.replace(/_/g, " ")}</p>
                <p className="mt-1 text-sm text-brand-muted">{m.memoryValue}</p>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "conversations" && (
        <div className="space-y-3">
          {conversations.length === 0 ? (
            <p className="text-sm text-brand-muted">No conversations logged yet.</p>
          ) : (
            conversations.map((c) => (
              <div key={c.id} className={`rounded-xl border p-4 ${
                c.role === "assistant" ? "border-indigo-200 bg-indigo-50/30" : "border-brand-border bg-white"
              }`}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="muted">{AGENT_SLUG_LABELS[c.agentId]}</Badge>
                  <Badge variant={c.role === "assistant" ? "info" : "muted"}>{c.role}</Badge>
                  <span className="text-[10px] text-brand-sage">{c.model}</span>
                  <span className="ml-auto text-[10px] text-brand-sage">
                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-xs text-brand-primary">
                  {c.content.slice(0, 800)}{c.content.length > 800 ? "…" : ""}
                </pre>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "decisions" && (
        <div className="space-y-3">
          {decisions.length === 0 ? (
            <p className="text-sm text-brand-muted">No decisions logged yet.</p>
          ) : (
            decisions.map((d) => (
              <div key={d.id} className="rounded-xl border border-brand-border bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="muted">{AGENT_SLUG_LABELS[d.agentId]}</Badge>
                  <Badge variant="info">{d.decisionType}</Badge>
                  <Badge variant={d.status === "pending" ? "warning" : "success"}>{d.status}</Badge>
                  <Badge variant="muted">confidence {d.confidence}%</Badge>
                </div>
                <p className="mt-2 font-medium text-brand-primary">{d.title}</p>
                <p className="mt-1 text-sm text-brand-muted">{d.reasoning}</p>
              </div>
            ))
          )}
        </div>
      )}

      <Card className="mt-6">
        <CardHeader>
          <h3 className="flex items-center gap-2 font-heading text-sm font-semibold text-brand-primary">
            <Database className="h-4 w-4" />
            Agent Capabilities
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Database, label: "Read database", desc: "Context Engine loads live agent data" },
              { icon: Sparkles, label: "Write database", desc: "Memory, decisions, domain tables" },
              { icon: MessageSquare, label: "Send messages", desc: "Inter-agent collaboration handoffs" },
              { icon: Lightbulb, label: "Create tasks", desc: "Delegate work to other agents" },
              { icon: Brain, label: "Generate recommendations", desc: "Structured AI decisions with confidence" },
              { icon: History, label: "Reference memory", desc: "Recall previous work and patterns" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex gap-3 rounded-xl border border-brand-border/60 bg-brand-bg/30 p-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                <div>
                  <p className="text-sm font-medium text-brand-primary">{label}</p>
                  <p className="text-xs text-brand-muted">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
