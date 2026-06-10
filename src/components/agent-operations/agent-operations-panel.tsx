"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Moon,
  Play,
  RefreshCw,
  Server,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { triggerAgentManually, triggerScheduledBatch } from "@/lib/actions/agent-operations";
import { AGENT_SLUG_LABELS } from "@/lib/agents/agent-slugs";
import { SCHEDULE_LABELS, type AgentHealth, type AgentRun, type AgentSchedule, type SchedulableAgent } from "@/lib/agent-worker/types";
import { formatDate } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const HEALTH_VARIANT: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
  running: "info",
  healthy: "success",
  sleeping: "default",
  degraded: "warning",
  failed: "danger",
};

const RUN_VARIANT: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
  success: "success",
  running: "info",
  failed: "danger",
  skipped: "default",
};

export function AgentOperationsPanel({
  schedules,
  health,
  recentRuns,
  stats,
}: {
  schedules: AgentSchedule[];
  health: AgentHealth[];
  recentRuns: AgentRun[];
  stats: {
    running: number;
    sleeping: number;
    failed: number;
    successRuns24h: number;
    totalAgents: number;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [runningAgent, setRunningAgent] = useState<SchedulableAgent | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const healthByAgent = new Map(health.map((h) => [h.agentId, h]));

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
              <h2 className="font-heading font-semibold text-brand-primary">Agent Worker System</h2>
              <p className="text-sm text-brand-muted">
                Background workers run on Vercel Cron — agents keep working when your browser is closed
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
          Cron: hourly via <code className="rounded bg-white px-1">/api/cron/agents</code> · No auto-posting · No auto-outreach
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Running" value={stats.running} icon={Activity} />
        <StatCard label="Sleeping / Healthy" value={stats.sleeping} icon={Moon} />
        <StatCard label="Failed / Degraded" value={stats.failed} icon={AlertTriangle} />
        <StatCard label="Success (24h)" value={stats.successRuns24h} icon={CheckCircle2} />
      </div>

      <section>
        <h3 className="mb-3 font-heading font-semibold text-brand-primary">Agent Schedules & Health</h3>
        <div className="grid gap-3 lg:grid-cols-2">
          {schedules.map((schedule) => {
            const h = healthByAgent.get(schedule.agentId);
            return (
              <Card key={schedule.id} className="border-brand-border/40">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-brand-primary">
                        {AGENT_SLUG_LABELS[schedule.agentId]}
                      </p>
                      <p className="text-xs text-brand-muted">{SCHEDULE_LABELS[schedule.agentId]}</p>
                    </div>
                    <Badge variant={HEALTH_VARIANT[h?.status ?? "sleeping"] ?? "default"}>
                      {h?.status ?? "unknown"}
                    </Badge>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-brand-muted">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last: {schedule.lastRunAt ? formatDistanceToNow(new Date(schedule.lastRunAt), { addSuffix: true }) : "never"}
                    </div>
                    <div>
                      Next: {schedule.nextRunAt ? formatDistanceToNow(new Date(schedule.nextRunAt), { addSuffix: true }) : "—"}
                    </div>
                    <div>Runs: {h?.totalRuns ?? 0} ({h?.totalSuccesses ?? 0} ok)</div>
                    <div>Avg: {h?.avgDurationMs ? `${(h.avgDurationMs / 1000).toFixed(1)}s` : "—"}</div>
                  </div>

                  {h?.lastErrorMessage && h.status !== "healthy" && (
                    <p className="mt-2 text-[10px] text-rose-700">{h.lastErrorMessage}</p>
                  )}

                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-3"
                    disabled={pending}
                    onClick={() => handleRunAgent(schedule.agentId)}
                  >
                    {runningAgent === schedule.agentId ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                    Run Now
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-heading font-semibold text-brand-primary">Run History</h3>
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
                        {run.itemsProcessed > 0 && ` · ${run.itemsProcessed} items`}
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

      <Card className="border-sky-100 bg-sky-50/50">
        <CardHeader>
          <h3 className="text-sm font-semibold text-brand-primary">Deployment</h3>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-brand-muted">
          <p>
            <strong>Vercel:</strong> Set <code>CRON_SECRET</code> in project env. Deploy with <code>vercel.json</code> — cron hits hourly.
          </p>
          <p>
            <strong>Local cron test:</strong>{" "}
            <code>curl -H &quot;Authorization: Bearer $CRON_SECRET&quot; http://localhost:3000/api/cron/agents</code>
          </p>
          <p>
            <strong>Deploy health:</strong>{" "}
            <code>GET /api/health</code> — verifies auth, cron, Supabase, and secret leak checks (no keys exposed).
          </p>
          <p>
            <strong>Supabase Edge:</strong> Schedule a function to POST to your deployed cron URL with the same Bearer token.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
