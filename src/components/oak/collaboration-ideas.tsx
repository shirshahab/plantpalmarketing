"use client";

import { Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { OakPartnershipDeal } from "@/lib/types";

export function CollaborationIdeas({ deals }: { deals: OakPartnershipDeal[] }) {
  if (deals.length === 0) {
    return <p className="text-sm text-brand-muted">Collaboration ideas appear when Oak converts leads.</p>;
  }

  return (
    <div className="space-y-4">
      {deals.map((deal) => (
        <Card key={deal.id}>
          <CardContent className="py-5">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <p className="font-heading font-semibold text-brand-primary">{deal.partnerName}</p>
                <p className="text-xs text-brand-muted">{deal.partnerType} · {deal.stage}</p>
                <p className="mt-2 text-sm leading-relaxed text-brand-primary">{deal.collaborationIdea}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
