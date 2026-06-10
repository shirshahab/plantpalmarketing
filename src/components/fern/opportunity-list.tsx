"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { FernOpportunity } from "@/lib/types";

const SOURCE_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  pinterest: "Pinterest",
  reddit: "Reddit",
  facebook_groups: "Facebook Groups",
  google_search: "Google Search",
  influencers: "Influencers",
  partnerships: "Partnerships",
  referral: "Referral",
};

export function OpportunityList({ opportunities }: { opportunities: FernOpportunity[] }) {
  if (opportunities.length === 0) {
    return <p className="text-sm text-brand-muted">No opportunities yet. Run acquisition scan.</p>;
  }

  return (
    <div className="space-y-3">
      {opportunities.map((opp, i) => (
        <Card key={opp.id}>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-brand-sage">#{i + 1}</span>
              <Badge variant="info">{SOURCE_LABELS[opp.trafficSource] ?? opp.trafficSource}</Badge>
              <Badge variant={opp.priorityScore >= 85 ? "danger" : "warning"}>Score {opp.priorityScore}</Badge>
              <Badge variant="success">~{opp.estimatedInstalls.toLocaleString()} installs</Badge>
            </div>
            <p className="mt-2 font-medium text-brand-primary">{opp.title}</p>
            <p className="mt-1 text-sm text-brand-muted">{opp.description}</p>
            <p className="mt-2 text-[10px] text-brand-sage">
              R{opp.reach} · C{opp.cost} · D{opp.difficulty} · V{opp.virality} · via {opp.sourceAgent}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
