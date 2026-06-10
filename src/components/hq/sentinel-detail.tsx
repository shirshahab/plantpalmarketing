"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, Loader2, Play, Radar, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentCharacter } from "@/components/hq/agent-character";
import { AgentStatusBadge } from "@/components/hq/agent-status-badge";
import { SENTINEL_STATE_LABELS } from "@/lib/hq/mock-data";
import { runSentinelScan } from "@/lib/actions/sentinel-agent";
import type { HQAgent } from "@/lib/hq/types";
import type { AgentActivityLog } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

function ActivityLog({ items }: { items: AgentActivityLog[] }) {
  if (!items.length) return <p className="text-xs text-brand-muted">No activity logged yet.</p>;
  return (
    <div className="space-y-2">
      {items.map((log) => (
        <div key={log.id} className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2">
          <p className="text-xs font-medium text-brand-primary">{log.detail}</p>
          <p className="mt-0.5 text-[10px] text-brand-sage">{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</p>
        </div>
      ))}
    </div>
  );
}

export function SentinelAgentDetail({ agent, onClose }: { agent: HQAgent; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleRun() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const res = await runSentinelScan();
      if (res.ok) {
        setResult(`Scanned ${res.competitorsScanned} competitors — ${res.alertsGenerated} alerts. Brief published.`);
        router.refresh();
      } else setError(res.error);
    });
  }

  const stateLabel = SENTINEL_STATE_LABELS[agent.agentState ?? "monitoring"];

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
            { label: "Tracked", key: "competitorsTracked", icon: Eye },
            { label: "Active Alerts", key: "activeAlerts", icon: Shield },
            { label: "Alerts Today", key: "alertsToday", icon: Radar },
            { label: "High Severity", key: "highSeverityAlerts", icon: Shield },
          ].map(({ label, key }) => (
            <div key={key} className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[10px] text-brand-muted">{label}</p>
              <p className="font-heading text-lg font-bold text-brand-primary">{agent.stats?.[key] ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-sage">Current task</h3>
        <p className="mt-1 text-sm text-gray-800">{agent.currentTask}</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-primary/10">
          <div className="h-full rounded-full bg-slate-600" style={{ width: `${agent.progress}%` }} />
        </div>
      </section>

      <p className="text-xs text-brand-muted">
        Tracking: PictureThis, Planta, PlantIn, Greg, Blossom, PlantNet, Gardenia, Garden Answers
      </p>

      <Button disabled={pending} onClick={handleRun} className="w-full">
        {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Scanning market…</> : <><Play className="h-4 w-4" /> Run Sentinel Scan</>}
      </Button>

      {result && <p className="text-xs font-medium text-brand-primary">{result}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-sage">Activity log</h3>
        <ActivityLog items={agent.activity ?? []} />
      </section>

      <Button variant="secondary" className="w-full" onClick={onClose}>Close panel</Button>
    </div>
  );
}
