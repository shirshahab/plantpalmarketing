"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play, Users } from "lucide-react";
import Link from "next/link";
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
  stats: {
    foundToday: number;
    highPriority: number;
    pendingOutreach: number;
    recommendedPartnerships: number;
    scoutRunToday?: boolean;
  };
  initialPriority?: string;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [ranToday, setRanToday] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string>(initialPriority ?? "all");

  const leads =
    priorityFilter === "all" ? allLeads : allLeads.filter((l) => l.priority === priorityFilter);
  const selected = leads.find((l) => l.id === selectedId) ?? null;
  const olderHighPriority = stats.highPriority > 0 && stats.foundToday === 0;

  function handleRunScout() {
    startTransition(async () => {
      const res = await runScoutDiscovery();
      setRanToday(true);
      if (res.ok) {
        const diag = res.diagnostics;
        const base = `Creators found: ${res.creatorsFound}. Leads added: ${res.leadsAdded ?? res.creatorsFound}. Duplicates skipped: ${res.duplicatesSkipped ?? 0}.`;
        if (diag?.failureReason && (res.leadsAdded ?? 0) === 0) {
          setMessage(`${base} ${diag.failureReason}`);
        } else if (diag && !diag.serpApiKeySet) {
          setMessage("Scout cannot run: SERPAPI_KEY not configured.");
        } else {
          setMessage(`${base} High priority: ${res.highPriority}.`);
        }
        router.refresh();
      } else {
        setMessage(res.error);
      }
    });
  }

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-brand-primary/20 bg-gradient-to-br from-brand-primary/5 to-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c9a86c] text-white">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-brand-primary">Scout. Creator Discovery Agent</h2>
              <p className="text-sm text-brand-muted">Find influencers, educators, nurseries and gardeners for partnerships</p>
            </div>
          </div>
          <Button disabled={pending} onClick={handleRunScout} className="w-full sm:w-auto">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run Scout Discovery
          </Button>
        </div>
        {message && <p className="mt-3 break-words text-sm text-brand-primary">{message}</p>}
        {stats.scoutRunToday === false && !ranToday && (
          <p className="mt-2 text-xs text-amber-700">Scout has not run today.</p>
        )}
      </div>

      <div className="mb-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <StatCard label="Found Today" value={stats.foundToday} icon={Users} />
          <p className="mt-1 text-[10px] text-brand-muted">Discovered in last 24 hours</p>
        </div>
        <div>
          <StatCard label="High Priority" value={stats.highPriority} icon={Users} />
          <p className="mt-1 text-[10px] text-brand-muted">All open high-priority leads</p>
        </div>
        <StatCard label="Pending Outreach" value={stats.pendingOutreach} icon={Users} />
        <StatCard label="Partnership Ideas" value={stats.recommendedPartnerships} icon={Users} />
      </div>

      {olderHighPriority && (
        <div className="mb-4 flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <p>{stats.highPriority} older high-priority lead{stats.highPriority === 1 ? "" : "s"} still need review.</p>
          <Link href="/creators?priority=high">
            <Button size="sm" variant="secondary">Review High Priority</Button>
          </Link>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
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
        <div className="rounded-2xl border border-dashed border-brand-border py-12 text-center">
          <p className="text-sm text-brand-muted">
            No creator leads yet. Run Scout to search plant creators on YouTube, TikTok, Instagram, and blogs.
          </p>
          <p className="mt-2 text-xs text-brand-muted">Requires SERPAPI_KEY. Results appear here or show a clear diagnostic.</p>
        </div>
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
