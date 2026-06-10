"use client";

import { Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { OakPartnershipDeal } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function FollowUpList({ deals }: { deals: OakPartnershipDeal[] }) {
  const withFollowUp = deals.filter((d) => d.followUpAt);

  if (withFollowUp.length === 0) {
    return <p className="text-sm text-brand-muted">No follow-up reminders scheduled.</p>;
  }

  return (
    <div className="space-y-3">
      {withFollowUp.map((deal) => {
        const due = deal.followUpAt ? new Date(deal.followUpAt) <= new Date() : false;
        return (
          <Card key={deal.id} className={due ? "border-amber-300" : ""}>
            <CardContent className="py-4">
              <div className="flex gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${due ? "bg-amber-100 text-amber-700" : "bg-brand-bg text-brand-muted"}`}>
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-brand-primary">{deal.partnerName}</p>
                  <p className="text-xs text-brand-muted">{deal.followUpAt && formatDate(deal.followUpAt)} · {deal.stage}</p>
                  <p className="mt-1 text-sm text-brand-muted">{deal.followUpNote}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
