"use client";

import { CheckCircle2, Clock, Loader2, Package, Play, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AGENT_SLUG_LABELS } from "@/lib/agents/agent-slugs";
import { SCHEDULE_LABELS, type AgentScheduleStats, type SchedulableAgent } from "@/lib/agent-worker/types";
import { formatDate } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const STATUS_VARIANT: Record<string, "success" | "danger" | "default" | "info"> = {
  success: "success",
  failed: "danger",
  skipped: "default",
  running: "info",
};

export function AgentScheduleTable({
  stats,
  onRunAgent,
  runningAgent,
  pending,
}: {
  stats: AgentScheduleStats[];
  onRunAgent?: (agentId: SchedulableAgent) => void;
  runningAgent?: SchedulableAgent | null;
  pending?: boolean;
}) {
  if (stats.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-brand-border/60 p-6 text-center text-sm text-brand-muted">
        No active schedules — system setup is still finishing
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-brand-border/40 bg-white">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-brand-border/30 bg-brand-bg/50 text-[10px] font-semibold uppercase tracking-wide text-brand-sage">
            <th className="px-4 py-3">Agent</th>
            <th className="px-4 py-3">Schedule</th>
            <th className="px-4 py-3">Last run</th>
            <th className="px-4 py-3">Next run</th>
            <th className="px-4 py-3">Success</th>
            <th className="px-4 py-3">Failure</th>
            <th className="px-4 py-3">Items created</th>
            <th className="px-4 py-3">Last status</th>
            {onRunAgent && <th className="px-4 py-3">Run</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-border/20">
          {stats.map((row) => (
            <tr key={row.agentId} className="hover:bg-brand-bg/30">
              <td className="px-4 py-3 font-medium text-brand-primary">
                {AGENT_SLUG_LABELS[row.agentId] ?? row.agentId}
              </td>
              <td className="px-4 py-3 text-xs text-brand-muted">{SCHEDULE_LABELS[row.agentId] ?? "—"}</td>
              <td className="px-4 py-3 text-xs text-brand-muted">
                {row.lastRunAt ? (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 shrink-0" />
                    {formatDistanceToNow(new Date(row.lastRunAt), { addSuffix: true })}
                  </span>
                ) : (
                  "Never"
                )}
                {row.lastSuccessAt && (
                  <span className="mt-0.5 block text-[10px] text-emerald-700">
                    Last ok {formatDate(row.lastSuccessAt)}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-brand-muted">
                {row.nextRunAt
                  ? formatDistanceToNow(new Date(row.nextRunAt), { addSuffix: true })
                  : "—"}
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {row.successCount}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1 text-rose-700">
                  <XCircle className="h-3.5 w-3.5" />
                  {row.failureCount}
                </span>
                {row.lastFailureAt && row.failureCount > 0 && (
                  <span className="mt-0.5 block text-[10px] text-rose-600">
                    {formatDistanceToNow(new Date(row.lastFailureAt), { addSuffix: true })}
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1 font-medium text-brand-primary">
                  <Package className="h-3.5 w-3.5 text-brand-sage" />
                  {row.itemsCreated}
                </span>
                {row.lastItemsCreated > 0 && (
                  <span className="mt-0.5 block text-[10px] text-brand-muted">
                    +{row.lastItemsCreated} last run
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                {row.lastRunStatus ? (
                  <Badge variant={STATUS_VARIANT[row.lastRunStatus] ?? "default"}>
                    {row.lastRunStatus}
                  </Badge>
                ) : (
                  <span className="text-xs text-brand-muted">—</span>
                )}
              </td>
              {onRunAgent && (
                <td className="px-4 py-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() => onRunAgent(row.agentId)}
                    title={`Run ${AGENT_SLUG_LABELS[row.agentId] ?? row.agentId} now`}
                  >
                    {runningAgent === row.agentId ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                    Now
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
