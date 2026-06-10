"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, DollarSign, Handshake, LayoutGrid, Lightbulb, Loader2, Mail, Play, TreeDeciduous,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { PipelineBoard } from "@/components/oak/pipeline-board";
import { OutreachQueue } from "@/components/oak/outreach-queue";
import { FollowUpList } from "@/components/oak/follow-up-list";
import { PartnershipMetrics } from "@/components/oak/partnership-metrics";
import { CollaborationIdeas } from "@/components/oak/collaboration-ideas";
import { runOakPartnershipScan } from "@/lib/actions/oak-agent";
import type { OakPartnershipDeal } from "@/lib/types";

type Tab = "pipeline" | "outreach" | "ideas" | "followups" | "metrics";

const TABS: { id: Tab; label: string; icon: typeof LayoutGrid }[] = [
  { id: "pipeline", label: "Partnership Pipeline", icon: LayoutGrid },
  { id: "outreach", label: "Outreach Drafts", icon: Mail },
  { id: "ideas", label: "Collaboration Ideas", icon: Lightbulb },
  { id: "followups", label: "Follow-up Reminders", icon: Bell },
  { id: "metrics", label: "Revenue & Installs", icon: DollarSign },
];

export function OakPanel({
  pipeline,
  outreachQueue,
  followUps,
  stats,
}: {
  pipeline: OakPartnershipDeal[];
  outreachQueue: OakPartnershipDeal[];
  followUps: OakPartnershipDeal[];
  stats: {
    total: number;
    byStage: Record<string, number>;
    totalRevenue: number;
    totalInstalls: number;
    pendingOutreach: number;
    dueFollowUps: number;
    activeDeals: number;
    negotiatingDeals: number;
  };
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pipeline");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleScan() {
    setMessage(null);
    startTransition(async () => {
      const res = await runOakPartnershipScan();
      if (res.ok) {
        setMessage(`Converted ${res.converted} Scout leads — ${res.outreachQueued} outreach drafts queued for approval.`);
        router.refresh();
      } else {
        setMessage(res.error);
      }
    });
  }

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-amber-800/20 bg-gradient-to-br from-amber-50 to-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-800 text-white">
              <TreeDeciduous className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-brand-primary">Oak — Partnership Manager</h2>
              <p className="text-sm text-brand-muted">
                Influencers, nurseries, garden centers, landscapers, botanical gardens, brands
              </p>
            </div>
          </div>
          <Button disabled={pending} onClick={handleScan}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Convert Scout Leads
          </Button>
        </div>
        {message && <p className="mt-3 text-sm text-brand-primary">{message}</p>}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pipeline" value={stats.total} icon={Handshake} />
        <StatCard label="Negotiating" value={stats.negotiatingDeals} icon={LayoutGrid} />
        <StatCard label="Pending Outreach" value={stats.pendingOutreach} icon={Mail} />
        <StatCard label="Follow-ups Due" value={stats.dueFollowUps} icon={Bell} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2 border-b border-brand-border pb-3">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === id ? "bg-amber-800 text-white" : "text-brand-muted hover:bg-brand-bg"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "pipeline" && <PipelineBoard deals={pipeline} />}
      {tab === "outreach" && <OutreachQueue deals={outreachQueue} />}
      {tab === "ideas" && <CollaborationIdeas deals={pipeline} />}
      {tab === "followups" && <FollowUpList deals={followUps} />}
      {tab === "metrics" && (
        <PartnershipMetrics
          deals={pipeline}
          stats={{
            totalRevenue: stats.totalRevenue,
            totalInstalls: stats.totalInstalls,
            activeDeals: stats.activeDeals,
            completed: stats.byStage.completed ?? 0,
          }}
        />
      )}
    </div>
  );
}
