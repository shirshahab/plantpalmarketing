"use client";

import { AlertTriangle, CheckSquare, Sparkles, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { IvyRecommendation } from "@/lib/types";

function ActionColumn({
  title,
  icon: Icon,
  items,
  accent,
}: {
  title: string;
  icon: typeof TrendingUp;
  items: IvyRecommendation[];
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-brand-border/70 bg-white/80 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${accent}`} />
        <h3 className="text-sm font-semibold text-brand-primary">{title}</h3>
        <Badge variant="muted" className="ml-auto">{items.length}</Badge>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-brand-muted">None flagged today.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-brand-border/50 bg-brand-bg/30 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-brand-primary">{item.title}</p>
                <Badge variant={item.priorityScore >= 85 ? "danger" : item.priorityScore >= 70 ? "warning" : "muted"}>
                  {item.priorityScore}
                </Badge>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-brand-muted">{item.description}</p>
              <p className="mt-2 text-[10px] text-brand-sage">
                via {item.sourceAgent} · R{item.revenueImpact} G{item.growthImpact} V{item.viralityPotential} T{item.timeSensitivity}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ActionCenter({
  roiActions,
  threats,
  approvals,
  growthOpportunities,
}: {
  roiActions: IvyRecommendation[];
  threats: IvyRecommendation[];
  approvals: IvyRecommendation[];
  growthOpportunities: IvyRecommendation[];
}) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-heading text-lg font-semibold text-brand-primary">Today — Action Center</h2>
        <p className="text-sm text-brand-muted">
          Ivy recommends — you decide. No actions are executed automatically.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <ActionColumn title="Highest ROI Actions" icon={TrendingUp} items={roiActions} accent="text-emerald-600" />
          <ActionColumn title="Biggest Threats" icon={AlertTriangle} items={threats} accent="text-rose-600" />
          <ActionColumn title="Approvals Needing Attention" icon={CheckSquare} items={approvals} accent="text-amber-600" />
          <ActionColumn title="Growth Opportunities" icon={Sparkles} items={growthOpportunities} accent="text-violet-600" />
        </div>
      </CardContent>
    </Card>
  );
}
