"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { triggerAgentManually } from "@/lib/actions/agent-operations";
import type { ScheduleRow } from "@/lib/db/schedule-queries";
import type { AgentRun } from "@/lib/agent-worker/types";

const HEALTH_STYLE: Record<string, string> = {
  healthy: "bg-emerald-50 text-emerald-700",
  running: "bg-blue-50 text-blue-700",
  sleeping: "bg-gray-100 text-gray-600",
  degraded: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-red-700",
};

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function timeUntil(iso: string | null): string {
  if (!iso) return "—";
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "due now";
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `in ${hours}h`;
  return `in ${Math.round(hours / 24)}d`;
}

function formatDuration(ms: number): string {
  if (ms <= 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function ScheduleBoard({ rows, recentRuns }: { rows: ScheduleRow[]; recentRuns: AgentRun[] }) {
  const [pending, startTransition] = useTransition();
  const [busyAgent, setBusyAgent] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function runNow(agentId: ScheduleRow["agentId"]) {
    setBusyAgent(agentId);
    startTransition(async () => {
      const result = await triggerAgentManually(agentId);
      setMessage(result.ok ? result.message : result.error);
      setBusyAgent(null);
    });
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="rounded-xl border border-brand-border bg-white px-4 py-2.5 text-sm text-brand-primary">
          {message}
        </div>
      )}

      <Card>
        <CardContent className="py-5">
          <h3 className="font-heading font-semibold text-brand-primary">Agent schedules</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-border text-xs uppercase tracking-wide text-brand-muted">
                  <th className="py-2 pr-4">Agent</th>
                  <th className="py-2 pr-4">Schedule</th>
                  <th className="py-2 pr-4">Last run</th>
                  <th className="py-2 pr-4">Next run</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Avg runtime</th>
                  <th className="py-2 pr-4">Success</th>
                  <th className="py-2 pr-4">Errors</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.agentId} className="border-b border-brand-border/50 last:border-0">
                    <td className="py-2.5 pr-4 font-medium capitalize text-brand-primary">{row.agentId}</td>
                    <td className="py-2.5 pr-4 text-brand-muted">{row.scheduleLabel}</td>
                    <td className="py-2.5 pr-4 text-brand-muted">{timeAgo(row.lastRunAt)}</td>
                    <td className="py-2.5 pr-4 text-brand-muted">{timeUntil(row.nextRunAt)}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${HEALTH_STYLE[row.healthStatus] ?? HEALTH_STYLE.sleeping}`}>
                        {row.healthStatus}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-brand-muted">{formatDuration(row.avgDurationMs)}</td>
                    <td className="py-2.5 pr-4 text-brand-muted">
                      {row.successRate === null ? "—" : `${row.successRate}% (${row.totalRuns} runs)`}
                    </td>
                    <td className="py-2.5 pr-4">
                      {row.errorCount > 0 ? (
                        <span className="text-red-600" title={row.lastErrorMessage}>
                          {row.errorCount}
                        </span>
                      ) : (
                        <span className="text-brand-muted">0</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <Button size="sm" variant="secondary" onClick={() => runNow(row.agentId)} disabled={pending}>
                        {busyAgent === row.agentId ? "Running..." : "Run now"}
                      </Button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-sm text-brand-muted">
                      No schedules found. They appear once system setup finishes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-5">
          <h3 className="font-heading font-semibold text-brand-primary">Recent runs</h3>
          {recentRuns.length === 0 ? (
            <p className="mt-2 text-sm text-brand-muted">No runs recorded yet.</p>
          ) : (
            <ul className="mt-3 space-y-1.5 text-sm">
              {recentRuns.map((run) => (
                <li key={run.id} className="flex flex-wrap items-center gap-2 text-brand-muted">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      run.status === "success"
                        ? "bg-emerald-50 text-emerald-700"
                        : run.status === "failed"
                          ? "bg-red-50 text-red-700"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {run.status}
                  </span>
                  <span className="font-medium capitalize text-brand-primary">{run.agentId}</span>
                  <span className="text-xs">{run.itemsProcessed} items</span>
                  <span className="text-xs">{formatDuration(run.durationMs ?? 0)}</span>
                  <span className="text-xs">{timeAgo(run.startedAt)}</span>
                  {run.errorMessage && <span className="text-xs text-red-600">{run.errorMessage.slice(0, 120)}</span>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
