"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { CreatorLeadDrawer } from "@/components/creators/creator-lead-drawer";
import { runScoutDiscovery } from "@/lib/actions/scout-agent";
import type { CreatorLead, CreatorPartnership } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

export function CreatorCRMPanel({
  leads: allLeads,
  partnerships,
  stats,
  initialPriority,
}: {
  leads: CreatorLead[];
  partnerships: CreatorPartnership[];
  stats: { foundToday: number; highPriority: number; pendingOutreach: number; recommendedPartnerships: number };
  initialPriority?: string;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>(initialPriority ?? "all");

  const leads =
    priorityFilter === "all" ? allLeads : allLeads.filter((l) => l.priority === priorityFilter);
  const selected = leads.find((l) => l.id === selectedId) ?? null;

  function handleRunScout() {
    startTransition(async () => {
      const res = await runScoutDiscovery();
      if (res.ok) {
        setMessage(`Scout found ${res.creatorsFound} creators — ${res.highPriority} high priority.`);
        router.refresh();
      } else {
        setMessage(res.error);
      }
    });
  }

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-brand-primary/20 bg-gradient-to-br from-brand-primary/5 to-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c9a86c] text-white">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-brand-primary">Scout — Creator Discovery Agent</h2>
              <p className="text-sm text-brand-muted">Find influencers, educators, nurseries & gardeners for partnerships</p>
            </div>
          </div>
          <Button disabled={pending} onClick={handleRunScout}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run Scout Discovery
          </Button>
        </div>
        {message && <p className="mt-3 text-sm text-brand-primary">{message}</p>}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Found Today" value={stats.foundToday} icon={Users} />
        <StatCard label="High Priority" value={stats.highPriority} icon={Users} />
        <StatCard label="Pending Outreach" value={stats.pendingOutreach} icon={Users} />
        <StatCard label="Partnership Ideas" value={stats.recommendedPartnerships} icon={Users} />
      </div>

      <div className="mb-4 flex items-center gap-2 text-sm">
        <span className="text-brand-muted">Priority:</span>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-lg border border-brand-border bg-white px-2 py-1.5 text-sm text-brand-primary"
        >
          <option value="all">All</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        {priorityFilter !== "all" && (
          <span className="text-xs text-brand-muted">
            Showing {leads.length} of {allLeads.length} leads
          </span>
        )}
      </div>

      {leads.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-brand-border py-12 text-center text-sm text-brand-muted">
          No leads yet. Click Run Scout Discovery to find creators.
        </p>
      ) : (
      <div className="overflow-x-auto rounded-2xl border border-brand-border bg-white shadow-sm">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead>
            <tr className="border-b border-brand-border bg-brand-bg/50">
              <th className="px-4 py-3 font-semibold text-brand-primary">Creator</th>
              <th className="px-4 py-3 font-semibold text-brand-primary">Platform</th>
              <th className="px-4 py-3 font-semibold text-brand-primary">Score</th>
              <th className="px-4 py-3 font-semibold text-brand-primary">Followers</th>
              <th className="px-4 py-3 font-semibold text-brand-primary">Engagement</th>
              <th className="px-4 py-3 font-semibold text-brand-primary">Status</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="cursor-pointer border-b border-brand-border last:border-0 hover:bg-brand-bg/30"
                onClick={() => setSelectedId(lead.id)}
              >
                <td className="px-4 py-4">
                  <p className="font-medium text-brand-primary">{lead.name}</p>
                  <p className="text-xs text-brand-muted">{lead.handle}</p>
                </td>
                <td className="px-4 py-4"><Badge variant="info">{lead.platform}</Badge></td>
                <td className="px-4 py-4">
                  <span className={`font-bold ${lead.partnershipScore >= 85 ? "text-brand-accent" : "text-brand-primary"}`}>
                    {lead.partnershipScore}
                  </span>
                </td>
                <td className="px-4 py-4">{formatNumber(lead.followers)}</td>
                <td className="px-4 py-4">{lead.engagementRate}%</td>
                <td className="px-4 py-4">
                  <Badge variant={lead.priority === "high" ? "warning" : "muted"}>{lead.partnershipStatus.replace(/_/g, " ")}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      <CreatorLeadDrawer lead={selected} partnerships={partnerships} onClose={() => setSelectedId(null)} />
    </div>
  );
}
