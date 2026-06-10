"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play, Users, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentCharacter } from "@/components/hq/agent-character";
import { AgentStatusBadge } from "@/components/hq/agent-status-badge";
import { SCOUT_STATE_LABELS, ROOTS_STATE_LABELS } from "@/lib/hq/mock-data";
import { runScoutDiscovery } from "@/lib/actions/scout-agent";
import { runRootsListening } from "@/lib/actions/roots-agent";
import type { HQAgent } from "@/lib/hq/types";
import type { AgentActivityLog } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

function ActivityLog({ items }: { items: AgentActivityLog[] }) {
  if (!items.length) {
    return <p className="text-xs text-brand-muted">No activity logged yet. Run the agent to start.</p>;
  }
  return (
    <div className="space-y-2">
      {items.map((log) => (
        <div key={log.id} className="rounded-xl border border-brand-border/60 bg-brand-bg/40 px-3 py-2">
          <p className="text-xs font-medium text-brand-primary">{log.detail}</p>
          <p className="mt-0.5 text-[10px] text-brand-sage">
            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
          </p>
        </div>
      ))}
    </div>
  );
}

function ScoutStats({ stats }: { stats: Record<string, number | undefined> }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {[
        { label: "Found Today", key: "foundToday" },
        { label: "High Priority", key: "highPriority" },
        { label: "Pending Outreach", key: "pendingOutreach" },
        { label: "Partnerships", key: "recommendedPartnerships" },
      ].map(({ label, key }) => (
        <div key={key} className="rounded-xl border border-brand-border bg-white p-3">
          <p className="text-[10px] text-brand-muted">{label}</p>
          <p className="font-heading text-lg font-bold text-brand-primary">{stats[key] ?? 0}</p>
        </div>
      ))}
    </div>
  );
}

function RootsStats({ stats }: { stats: Record<string, number | undefined> }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {[
        { label: "Mentions Today", key: "mentionsToday" },
        { label: "Opportunities", key: "opportunitiesFound" },
        { label: "Replies Drafted", key: "repliesDrafted" },
        { label: "Pending Approval", key: "pendingApprovals" },
      ].map(({ label, key }) => (
        <div key={key} className="rounded-xl border border-brand-border bg-white p-3">
          <p className="text-[10px] text-brand-muted">{label}</p>
          <p className="font-heading text-lg font-bold text-brand-primary">{stats[key] ?? 0}</p>
        </div>
      ))}
    </div>
  );
}

export function ScoutRootsAgentDetail({
  agent,
  onClose,
}: {
  agent: HQAgent;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isScout = agent.id === "creator";

  function handleRun() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      if (isScout) {
        const res = await runScoutDiscovery();
        if (res.ok) {
          setResult(
            `Found ${res.creatorsFound} creators (${res.highPriority} high priority). ${res.partnershipsRecommended} partnership ideas. ${res.approvalQueueCount} queued for approval.`
          );
          router.refresh();
        } else setError(res.error);
      } else {
        const res = await runRootsListening();
        if (res.ok) {
          setResult(
            `${res.mentionsFound} mentions, ${res.opportunitiesCreated} opportunities, ${res.repliesDrafted} reply drafts. ${res.approvalQueueCount} awaiting approval.`
          );
          router.refresh();
        } else setError(res.error);
      }
    });
  }

  const stateLabel = isScout
    ? SCOUT_STATE_LABELS[agent.agentState ?? "idle"]
    : ROOTS_STATE_LABELS[agent.agentState ?? "listening"];

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <AgentCharacter agent={agent} floatDelay="" isActive />
        <div>
          <p className="font-heading text-xl font-bold text-brand-primary">{agent.name}</p>
          <p className="text-sm text-brand-muted">{agent.role}</p>
          <p className="mt-1 text-xs text-brand-sage">{agent.station} · {stateLabel}</p>
          <div className="mt-2">
            <AgentStatusBadge status={agent.status} />
          </div>
        </div>
      </div>

      {agent.stats && (isScout ? <ScoutStats stats={agent.stats} /> : <RootsStats stats={agent.stats} />)}

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-sage">Current task</h3>
        <p className="mt-1 text-sm text-gray-800">{agent.currentTask}</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-primary/10">
          <div className="h-full rounded-full bg-brand-accent" style={{ width: `${agent.progress}%` }} />
        </div>
      </section>

      <Button disabled={pending} onClick={handleRun} className="w-full">
        {pending ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Running {agent.name}…</>
        ) : (
          <><Play className="h-4 w-4" /> Run {isScout ? "Creator Discovery" : "Community Listening"}</>
        )}
      </Button>

      {result && <p className="text-xs font-medium text-brand-primary">{result}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}

      <section>
        <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-sage">
          {isScout ? <Users className="h-3.5 w-3.5" /> : <MessageCircle className="h-3.5 w-3.5" />}
          Activity log
        </h3>
        <ActivityLog items={agent.activity ?? []} />
      </section>

      <p className="text-[10px] text-brand-muted">
        {isScout
          ? "Sources: TikTok, Instagram, YouTube, Pinterest, Blogs, Podcasts. All partnerships require human approval."
          : "Sources: Reddit, Threads, Facebook Groups, X, Forums, YouTube Comments. Helpful first — never spam."}
      </p>

      <Button variant="secondary" className="w-full" onClick={onClose}>
        Close panel
      </Button>
    </div>
  );
}
