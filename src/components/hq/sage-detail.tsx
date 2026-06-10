"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, CheckCircle2, Loader2, Play, Star, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentCharacter } from "@/components/hq/agent-character";
import { AgentStatusBadge } from "@/components/hq/agent-status-badge";
import { SAGE_STATE_LABELS } from "@/lib/hq/mock-data";
import { runSageReview } from "@/lib/actions/sage-agent";
import { SAGE_PASS_THRESHOLD } from "@/lib/agents/sage/mock-scorer";
import type { HQAgent } from "@/lib/hq/types";
import type { AgentActivityLog } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

function ActivityLog({ items }: { items: AgentActivityLog[] }) {
  if (!items.length) return <p className="text-xs text-brand-muted">No activity logged yet.</p>;
  return (
    <div className="space-y-2">
      {items.map((log) => (
        <div key={log.id} className="rounded-xl border border-teal-100 bg-teal-50/40 px-3 py-2">
          <p className="text-xs font-medium text-brand-primary">{log.detail}</p>
          <p className="mt-0.5 text-[10px] text-brand-sage">
            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
          </p>
        </div>
      ))}
    </div>
  );
}

export function SageAgentDetail({ agent, onClose }: { agent: HQAgent; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleRun() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const res = await runSageReview();
      if (res.ok) {
        setResult(`${res.approvedCount} approved, ${res.rejectedCount} rejected — ${res.approvalQueueCount} queued for Gate.`);
        router.refresh();
      } else setError(res.error);
    });
  }

  const stateLabel = SAGE_STATE_LABELS[agent.agentState ?? "idle"];
  const awaiting = agent.stats?.awaitingReview ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <AgentCharacter agent={agent} floatDelay="" isActive />
        <div>
          <p className="font-heading text-xl font-bold text-brand-primary">{agent.name}</p>
          <p className="text-sm text-brand-muted">{agent.role}</p>
          <p className="mt-1 text-xs text-brand-sage">{agent.station} · {stateLabel}</p>
          <div className="mt-2"><AgentStatusBadge status={agent.status} /></div>
        </div>
      </div>

      {agent.stats && (
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Awaiting Review", key: "awaitingReview", icon: Star },
            { label: "Approved", key: "approvedCount", icon: CheckCircle2 },
            { label: "Rejected", key: "rejectedCount", icon: XCircle },
            { label: "Avg Score", key: "avgAggregateScore", icon: BarChart3 },
          ].map(({ label, key }) => (
            <div key={key} className="rounded-xl border border-teal-100 bg-white p-3">
              <p className="text-[10px] text-brand-muted">{label}</p>
              <p className="font-heading text-lg font-bold text-brand-primary">{agent.stats?.[key] ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      <p className="rounded-lg bg-teal-50 px-3 py-2 text-xs text-teal-800">
        Pass threshold: {SAGE_PASS_THRESHOLD}/100 on 6 dimensions. Rejected pieces get hook, CTA, and storytelling rewrites.
      </p>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-sage">Current task</h3>
        <p className="mt-1 text-sm text-gray-800">{agent.currentTask}</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-primary/10">
          <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${agent.progress}%` }} />
        </div>
      </section>

      {agent.activity && agent.activity.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-sage">Recent activity</h3>
          <ActivityLog items={agent.activity} />
        </section>
      )}

      {result && <p className="text-sm text-teal-700">{result}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 pt-2">
        <Button disabled={pending || awaiting === 0} onClick={handleRun} className="flex-1">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Review Queue ({awaiting})
        </Button>
        <Button variant="secondary" onClick={() => { onClose(); window.location.href = "/sage"; }}>
          Open Sage
        </Button>
      </div>
    </div>
  );
}
