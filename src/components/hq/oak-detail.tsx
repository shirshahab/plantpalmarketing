"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, Handshake, Loader2, Mail, Play, TreeDeciduous } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentCharacter } from "@/components/hq/agent-character";
import { AgentStatusBadge } from "@/components/hq/agent-status-badge";
import { OAK_STATE_LABELS } from "@/lib/hq/mock-data";
import { runOakPartnershipScan } from "@/lib/actions/oak-agent";
import type { HQAgent } from "@/lib/hq/types";
import type { AgentActivityLog } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

function ActivityLog({ items }: { items: AgentActivityLog[] }) {
  if (!items.length) return <p className="text-xs text-brand-muted">No activity logged yet.</p>;
  return (
    <div className="space-y-2">
      {items.map((log) => (
        <div key={log.id} className="rounded-xl border border-amber-100 bg-amber-50/40 px-3 py-2">
          <p className="text-xs font-medium text-brand-primary">{log.detail}</p>
          <p className="mt-0.5 text-[10px] text-brand-sage">
            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
          </p>
        </div>
      ))}
    </div>
  );
}

export function OakAgentDetail({ agent, onClose }: { agent: HQAgent; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleScan() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const res = await runOakPartnershipScan();
      if (res.ok) {
        setResult(`Converted ${res.converted} leads — ${res.outreachQueued} outreach drafts queued.`);
        router.refresh();
      } else setError(res.error);
    });
  }

  const stateLabel = OAK_STATE_LABELS[agent.agentState ?? "idle"];

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
            { label: "Pipeline", key: "total", icon: Handshake },
            { label: "Pending Outreach", key: "pendingOutreach", icon: Mail },
            { label: "Revenue", key: "totalRevenue", icon: DollarSign },
            { label: "Installs", key: "totalInstalls", icon: TreeDeciduous },
          ].map(({ label, key }) => (
            <div key={key} className="rounded-xl border border-amber-100 bg-white p-3">
              <p className="text-[10px] text-brand-muted">{label}</p>
              <p className="font-heading text-lg font-bold text-brand-primary">
                {key === "totalRevenue" && typeof agent.stats?.[key] === "number"
                  ? `$${(agent.stats[key] as number).toLocaleString()}`
                  : agent.stats?.[key] ?? 0}
              </p>
            </div>
          ))}
        </div>
      )}

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-sage">Current task</h3>
        <p className="mt-1 text-sm text-gray-800">{agent.currentTask}</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-primary/10">
          <div className="h-full rounded-full bg-amber-700 transition-all" style={{ width: `${agent.progress}%` }} />
        </div>
      </section>

      {agent.activity && agent.activity.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-sage">Recent activity</h3>
          <ActivityLog items={agent.activity} />
        </section>
      )}

      {result && <p className="text-sm text-amber-800">{result}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 pt-2">
        <Button disabled={pending} onClick={handleScan} className="flex-1">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Convert Scout Leads
        </Button>
        <Button variant="secondary" onClick={() => { onClose(); window.location.href = "/oak"; }}>
          Open Oak
        </Button>
      </div>
    </div>
  );
}
