"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { approveOakOutreach } from "@/lib/actions/oak-agent";
import type { OakPartnershipDeal } from "@/lib/types";

export function OutreachQueue({ deals }: { deals: OakPartnershipDeal[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleApprove(id: string) {
    startTransition(async () => {
      await approveOakOutreach(id);
      router.refresh();
    });
  }

  if (deals.length === 0) {
    return <p className="text-sm text-brand-muted">No outreach drafts pending approval.</p>;
  }

  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Human approval required before sending outreach. Oak never auto-contacts partners.
      </p>
      {deals.map((deal) => (
        <Card key={deal.id}>
          <CardContent className="py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info">{deal.partnerType}</Badge>
                  <span className="font-heading font-semibold text-brand-primary">{deal.partnerName}</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold uppercase text-brand-sage">
                  <Mail className="h-3.5 w-3.5" />
                  Outreach draft
                </div>
                <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-brand-bg/60 p-3 text-sm leading-relaxed text-brand-primary">
                  {deal.outreachDraft}
                </pre>
              </div>
              <Button size="sm" disabled={pending} onClick={() => handleApprove(deal.id)}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Approve Outreach
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
