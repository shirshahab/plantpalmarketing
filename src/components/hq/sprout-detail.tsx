"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Loader2, Play, Rocket, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentCharacter } from "@/components/hq/agent-character";
import { AgentStatusBadge } from "@/components/hq/agent-status-badge";
import { SPROUT_STATE_LABELS } from "@/lib/hq/mock-data";
import { runSproutQueueScan } from "@/lib/actions/sprout-agent";
import type { HQAgent } from "@/lib/hq/types";
import type { AgentActivityLog } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

function ActivityLog({ items }: { items: AgentActivityLog[] }) {
  if (!items.length) return <p className="text-xs text-brand-muted">No activity logged yet.</p>;
  return (
    <div className="space-y-2">
      {items.map((log) => (
        <div key={log.id} className="rounded-xl border border-lime-100 bg-lime-50/40 px-3 py-2">
          <p className="text-xs font-medium text-brand-primary">{log.detail}</p>
          <p className="mt-0.5 text-[10px] text-brand-sage">
            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
          </p>
        </div>
      ))}
    </div>
  );
}

export function SproutAgentDetail({ agent, onClose }: { agent: HQAgent; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleScan() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const res = await runSproutQueueScan();
      if (res.ok) {
        setResult(`Queued ${res.queued} posts — schedule approval required.`);
        router.refresh();
      } else setError(res.error);
    });
  }

  const stateLabel = SPROUT_STATE_LABELS[agent.agentState ?? "idle"];

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
            { label: "Waiting", key: "waiting", icon: Clock },
            { label: "Ready", key: "ready", icon: Send },
            { label: "Scheduling", key: "scheduling", icon: Calendar },
            { label: "Published", key: "published", icon: Rocket },
            { label: "Scheduled today", key: "scheduledToday", icon: Calendar },
            { label: "Ready to publish", key: "readyToPublish", icon: Send },
            { label: "Missing assets", key: "missingAssets", icon: Clock },
            { label: "Posted today", key: "postedToday", icon: Rocket },
          ].map(({ label, key }) => (
            <div key={key} className="rounded-xl border border-lime-100 bg-white p-3">
              <p className="text-[10px] text-brand-muted">{label}</p>
              <p className="font-heading text-lg font-bold text-brand-primary">{agent.stats?.[key] ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      <Button variant="secondary" className="w-full" onClick={() => { onClose(); window.location.href = "/calendar"; }}>
        <Calendar className="h-4 w-4" />
        Open Content Calendar
      </Button>

      <p className="rounded-lg bg-lime-50 px-3 py-2 text-xs text-lime-900">
        No auto-publishing. Every schedule requires human approval before going live.
      </p>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-sage">Current task</h3>
        <p className="mt-1 text-sm text-gray-800">{agent.currentTask}</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-primary/10">
          <div className="h-full rounded-full bg-lime-500 transition-all" style={{ width: `${agent.progress}%` }} />
        </div>
      </section>

      {agent.activity && agent.activity.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-sage">Recent activity</h3>
          <ActivityLog items={agent.activity} />
        </section>
      )}

      {result && <p className="text-sm text-lime-700">{result}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 pt-2">
        <Button disabled={pending} onClick={handleScan} className="flex-1">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Scan Approved Content
        </Button>
        <Button variant="secondary" onClick={() => { onClose(); window.location.href = "/sprout"; }}>
          Open Sprout
        </Button>
      </div>
    </div>
  );
}
