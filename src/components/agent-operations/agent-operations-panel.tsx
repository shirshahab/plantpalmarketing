"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Moon,
  Package,
  Play,
  RefreshCw,
  Server,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { AgentScheduleTable } from "@/components/agent-operations/agent-schedule-table";
import { triggerAgentManually, triggerScheduledBatch } from "@/lib/actions/agent-operations";
import { AGENT_SLUG_LABELS } from "@/lib/agents/agent-slugs";
import {
  SCHEDULE_LABELS,
  type AgentRun,
  type AgentSchedule,
  type AgentScheduleStats,
  type SchedulableAgent,
} from "@/lib/agent-worker/types";
import { formatDate } from "@/lib/utils";

const RUN_VARIANT: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
  success: "success",
  running: "info",
  failed: "danger",
  skipped: "default",
};

export function AgentOperationsPanel({
  schedules,
  recentRuns,
  scheduleStats,
  stats,
}: {
  schedules: AgentSchedule[];
  recentRuns: AgentRun[];
  scheduleStats: AgentScheduleStats[];
  stats: {
    running: number;
    sleeping: number;
    failed: number;
    successRuns24h: number;
    itemsCreated24h: number;
    totalAgents: number;
    cronSchedule: string;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [runningAgent, setRunningAgent] = useState<SchedulableAgent | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function handleBatch() {
    setMessage(null);
    startTransition(async () => {
      const res = await triggerScheduledBatch();
      if (res.ok) {
        setMessage(
          `Batch complete — ${res.triggered} agents ran, ${res.skipped} still waiting.${res.errors.length ? ` Errors: ${res.errors.join("; ")}` : ""}`
        );
        router.refresh();
      } else {
        setMessage(res.error);
      }
    });
  }

  function handleRunAgent(agentId: SchedulableAgent) {
    setMessage(null);
    setRunningAgent(agentId);
    startTransition(async () => {
      const res = await triggerAgentManually(agentId);
      setRunningAgent(null);
      if (res.ok) setMessage(res.message);
      else setMessage(res.error);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-800 text-white">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-brand-primary">Autonomous Agent Scheduler</h2>
              <p className="text-sm text-brand-muted">
                Vercel Cron runs hourly — each agent wakes when its schedule is due
              </p>
            </div>
          </div>
          <Button disabled={pending} onClick={handleBatch}>
            {pending && !runningAgent ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Run Due Agents Now
          </Button>
        </div>
        {message && <p className="mt-3 text-sm text-emerald-900">{message}</p>}
        <p className="mt-2 text-xs text-brand-muted">
          Cron: <code className="rounded bg-white px-1">{stats.cronSchedule}</code> →{" "}
          <code className="rounded bg-white px-1">/api/cron/agents</code> · Scout/Roots/Sentinel/Echo
          interval · Bloom/Ivy/Atlas morning · Sage on content
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Active agents" value={stats.totalAgents} icon={Server} />
        <StatCard label="Running now" value={stats.running} icon={Activity} />
        <StatCard label="Healthy / sleeping" value={stats.sleeping} icon={Moon} />
        <StatCard label="Success (24h)" value={stats.successRuns24h} icon={CheckCircle2} />
        <StatCard label="Items created (24h)" value={stats.itemsCreated24h} icon={Package} />
      </div>

      <section>
        <h3 className="mb-3 font-heading font-semibold text-brand-primary">Schedule tracking</h3>
        <p className="mb-3 text-xs text-brand-muted">
          Last run, next run, success/failure counts, and cumulative items created per agent
        </p>
        <AgentScheduleTable stats={scheduleStats} />
      </section>

      <section>
        <h3 className="mb-3 font-heading font-semibold text-brand-primary">Manual run</h3>
        <div className="flex flex-wrap gap-2">
          {schedules.map((schedule) => (
            <Button
              key={schedule.id}
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => handleRunAgent(schedule.agentId)}
              title={SCHEDULE_LABELS[schedule.agentId]}
            >
              {runningAgent === schedule.agentId ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Play className="h-3 w-3" />
              )}
              {AGENT_SLUG_LABELS[schedule.agentId]}
            </Button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-heading font-semibold text-brand-primary">Run history</h3>
        <Card>
          <CardContent className="divide-y divide-brand-border/20 p-0">
            {recentRuns.length === 0 ? (
              <p className="p-6 text-center text-sm text-brand-muted">No runs yet — trigger a batch or wait for cron</p>
            ) : (
              recentRuns.map((run) => (
                <div key={run.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    {run.status === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : run.status === "failed" ? (
                      <XCircle className="h-4 w-4 text-rose-600" />
                    ) : (
                      <Activity className="h-4 w-4 text-sky-600" />
                    )}
                    <div>
                      <p className="font-medium text-brand-primary">{AGENT_SLUG_LABELS[run.agentId]}</p>
                      <p className="text-xs text-brand-muted">
                        {formatDate(run.startedAt)} · {run.triggerSource}
                        {run.durationMs != null && ` · ${(run.durationMs / 1000).toFixed(1)}s`}
                        {run.itemsProcessed > 0 && ` · ${run.itemsProcessed} items created`}
                      </p>
                      {run.errorMessage && (
                        <p className="text-xs text-rose-700">{run.errorMessage}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={RUN_VARIANT[run.status] ?? "default"}>{run.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      {stats.failed > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4" />
            {stats.failed} agent(s) degraded or failed — check run history for errors
          </div>
        </div>
      )}

      <Card className="border-sky-100 bg-sky-50/50">
        <CardHeader>
          <h3 className="text-sm font-semibold text-brand-primary">Vercel Cron setup</h3>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-brand-muted">
          <p>
            <strong>1.</strong> Set <code>CRON_SECRET</code> in Vercel Production env
          </p>
          <p>
            <strong>2.</strong> Deploy with <code>vercel.json</code> — hourly cron at <code>0 * * * *</code>
          </p>
          <p>
            <strong>3.</strong> Run migration <code>038_phase24_agent_scheduler.sql</code> in Supabase
          </p>
          <p>
            <strong>Local test:</strong>{" "}
            <code>curl -H &quot;Authorization: Bearer %CRON_SECRET%&quot; http://localhost:3000/api/cron/agents</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
