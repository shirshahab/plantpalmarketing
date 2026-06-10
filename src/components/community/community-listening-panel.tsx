"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, Loader2, MessageCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { CommunityOpportunityDrawer } from "@/components/community/community-opportunity-drawer";
import { runRootsListening } from "@/lib/actions/roots-agent";
import type { CommunityOpportunity, CommunityReplyDraft } from "@/lib/types";

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 85 ? "bg-red-500" : score >= 70 ? "bg-amber-500" : "bg-brand-accent";
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-brand-muted">{label}</span>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-brand-border">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold">{score}</span>
    </div>
  );
}

export function CommunityListeningPanel({
  opportunities,
  replyDrafts,
  stats,
}: {
  opportunities: CommunityOpportunity[];
  replyDrafts: CommunityReplyDraft[];
  stats: { mentionsToday: number; opportunitiesFound: number; repliesDrafted: number; pendingApprovals: number };
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const selectedOpp = opportunities.find((o) => o.id === selectedId) ?? null;
  const selectedReply = replyDrafts.find((r) => r.opportunityId === selectedId) ?? null;

  function handleRunRoots() {
    startTransition(async () => {
      const res = await runRootsListening();
      if (res.ok) {
        setMessage(`Roots found ${res.mentionsFound} mentions, drafted ${res.repliesDrafted} replies.`);
        router.refresh();
      } else {
        setMessage(res.error);
      }
    });
  }

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-brand-primary/20 bg-gradient-to-br from-[#6b9b7a]/10 to-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6b9b7a] text-white">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-brand-primary">Roots — Community Agent</h2>
              <p className="text-sm text-brand-muted">Listen, help first, draft replies — never spam</p>
            </div>
          </div>
          <Button disabled={pending} onClick={handleRunRoots}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run Community Listening
          </Button>
        </div>
        {message && <p className="mt-3 text-sm text-brand-primary">{message}</p>}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Mentions Today" value={stats.mentionsToday} icon={Eye} />
        <StatCard label="Opportunities" value={stats.opportunitiesFound} icon={MessageCircle} />
        <StatCard label="Replies Drafted" value={stats.repliesDrafted} icon={MessageCircle} />
        <StatCard label="Pending Approval" value={stats.pendingApprovals} icon={Eye} />
      </div>

      {opportunities.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-brand-border py-12 text-center text-sm text-brand-muted">
          No opportunities yet. Click Run Community Listening to scan platforms.
        </p>
      ) : (
      <div className="space-y-4">
        {opportunities.map((opp) => (
          <div key={opp.id} className="cursor-pointer" onClick={() => setSelectedId(opp.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setSelectedId(opp.id)}>
          <Card className="transition hover:shadow-md">
            <CardContent className="py-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info">{opp.platform}</Badge>
                <Badge variant="muted">{opp.opportunityType.replace(/_/g, " ")}</Badge>
                <Badge variant="muted">{opp.sentiment}</Badge>
                <ScoreBar score={opp.urgencyScore} label="Urgency" />
                <ScoreBar score={opp.opportunityScore} label="Opportunity" />
              </div>
              <p className="mt-3 text-sm font-medium text-brand-primary">{opp.author}</p>
              <p className="mt-1 line-clamp-2 text-sm">&ldquo;{opp.post}&rdquo;</p>
              <p className="mt-3 line-clamp-2 rounded-xl bg-brand-bg p-3 text-xs text-brand-muted">{opp.suggestedReply}</p>
            </CardContent>
          </Card>
          </div>
        ))}
      </div>
      )}

      <CommunityOpportunityDrawer
        opportunity={selectedOpp}
        replyDraft={selectedReply}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
