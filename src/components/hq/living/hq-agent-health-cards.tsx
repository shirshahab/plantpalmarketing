"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, Clock, Loader2, Moon, Server } from "lucide-react";
import { AGENT_SLUG_LABELS } from "@/lib/agents/agent-slugs";
import type { HQAgentScheduleHealth } from "@/lib/agent-worker/types";

const STATUS_STYLES: Record<string, { dot: string; label: string }> = {
  healthy: { dot: "bg-emerald-500", label: "Healthy" },
  running: { dot: "bg-sky-500 animate-pulse", label: "Running" },
  sleeping: { dot: "bg-slate-400", label: "Sleeping" },
  degraded: { dot: "bg-amber-500", label: "Degraded" },
  failed: { dot: "bg-rose-500", label: "Failed" },
};

export function HQAgentHealthCards({ agents }: { agents: HQAgentScheduleHealth[] }) {
  if (agents.length === 0) return null;

  const failedCount = agents.filter((a) => a.healthStatus === "failed" || a.healthStatus === "degraded").length;

  return (
    <div className="relative z-20 border-b border-white/30 bg-white/20 px-3 py-2 backdrop-blur-md sm:px-4">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-brand-sage">
          <Server className="h-3 w-3" />
          Agent scheduler
        </div>
        <Link
          href="/agent-operations"
          className="text-[10px] font-medium text-emerald-800 underline-offset-2 hover:underline"
        >
          Operations →
        </Link>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {agents.map((agent) => {
          const style = STATUS_STYLES[agent.healthStatus] ?? STATUS_STYLES.sleeping;
          const hasError = Boolean(agent.lastErrorMessage) && agent.healthStatus !== "healthy";

          return (
            <div
              key={agent.agentId}
              className="min-w-[132px] shrink-0 rounded-xl border border-white/50 bg-white/75 px-2.5 py-2 shadow-sm"
              title={agent.lastErrorMessage ?? undefined}
            >
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
                <span className="truncate text-[11px] font-semibold text-brand-primary">
                  {AGENT_SLUG_LABELS[agent.agentId] ?? agent.agentId}
                </span>
                {agent.healthStatus === "running" && (
                  <Loader2 className="h-3 w-3 shrink-0 animate-spin text-sky-600" />
                )}
                {hasError && <AlertTriangle className="h-3 w-3 shrink-0 text-amber-600" />}
              </div>
              <p className="mt-1 text-[9px] text-brand-muted">
                {agent.lastRunAt ? (
                  <>
                    Last{" "}
                    {formatDistanceToNow(new Date(agent.lastRunAt), { addSuffix: true })}
                    {agent.lastRunStatus && ` · ${agent.lastRunStatus}`}
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <Moon className="h-2.5 w-2.5" />
                    Awaiting first run
                  </span>
                )}
              </p>
              <p className="mt-0.5 inline-flex items-center gap-1 text-[9px] text-emerald-800">
                <Clock className="h-2.5 w-2.5" />
                {agent.nextRunAt
                  ? `Next ${formatDistanceToNow(new Date(agent.nextRunAt), { addSuffix: true })}`
                  : "—"}
              </p>
            </div>
          );
        })}
      </div>
      {failedCount > 0 && (
        <p className="mt-1.5 text-[10px] text-amber-800">
          {failedCount} agent(s) need attention — see{" "}
          <Link href="/agent-operations" className="font-medium underline">
            failure logs
          </Link>
        </p>
      )}
    </div>
  );
}
