"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { DealCard } from "@/components/oak/deal-card";
import { Badge } from "@/components/ui/badge";
import type { OakPartnershipDeal, OakPipelineStage } from "@/lib/types";

const STAGES: { id: OakPipelineStage; label: string; color: string }[] = [
  { id: "contacted", label: "Contacted", color: "border-slate-200 bg-slate-50" },
  { id: "replied", label: "Replied", color: "border-sky-200 bg-sky-50/50" },
  { id: "negotiating", label: "Negotiating", color: "border-amber-200 bg-amber-50/50" },
  { id: "active", label: "Active", color: "border-emerald-200 bg-emerald-50/50" },
  { id: "completed", label: "Completed", color: "border-violet-200 bg-violet-50/50" },
];

export function PipelineBoard({ deals }: { deals: OakPartnershipDeal[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function refresh() {
    startTransition(() => router.refresh());
  }

  if (deals.length === 0) {
    return <p className="text-sm text-brand-muted">No partnerships in pipeline. Run Oak to convert Scout leads.</p>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {STAGES.map((stage) => {
        const column = deals.filter((d) => d.stage === stage.id);
        return (
          <div key={stage.id} className={`rounded-2xl border p-3 ${stage.color}`}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-primary">{stage.label}</h3>
              <Badge variant="muted">{column.length}</Badge>
            </div>
            <div className="space-y-2">
              {column.map((deal) => (
                <div key={deal.id} onClick={refresh}>
                  <DealCard deal={deal} compact />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
