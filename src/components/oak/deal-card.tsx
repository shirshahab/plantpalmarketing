"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { OakPartnershipDeal } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const typeLabels: Record<string, string> = {
  influencer: "Influencer",
  nursery: "Nursery",
  garden_center: "Garden Center",
  landscaper: "Landscaper",
  botanical_garden: "Botanical Garden",
  brand: "Brand",
  seed_company: "Seed Company",
  home_garden_brand: "Home & Garden",
};

const stageLabels: Record<string, string> = {
  contacted: "Contacted",
  replied: "Replied",
  negotiating: "Negotiating",
  active: "Active",
  completed: "Completed",
};

export function DealCard({
  deal,
  actions,
  compact,
}: {
  deal: OakPartnershipDeal;
  actions?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">{typeLabels[deal.partnerType] ?? deal.partnerType}</Badge>
              <Badge variant={deal.stage === "active" ? "success" : deal.stage === "negotiating" ? "warning" : "muted"}>
                {stageLabels[deal.stage]}
              </Badge>
              {deal.priority === "high" && <Badge variant="danger">High</Badge>}
              {deal.outreachApproved && <Badge variant="success">Outreach OK</Badge>}
            </div>
            <h4 className="mt-3 font-heading font-semibold text-brand-primary">{deal.partnerName}</h4>
            <p className="mt-1 text-xs text-brand-muted">{deal.contactName} · {deal.location}</p>
            {!compact && (
              <>
                <p className="mt-3 text-sm text-brand-muted">{deal.collaborationIdea}</p>
                {deal.followUpAt && (
                  <p className="mt-2 text-xs text-amber-700">Follow-up: {formatDate(deal.followUpAt)} — {deal.followUpNote}</p>
                )}
                {(deal.revenueGenerated > 0 || deal.installsGenerated > 0) && (
                  <p className="mt-2 text-xs text-brand-primary">
                    ${deal.revenueGenerated.toLocaleString()} revenue · {deal.installsGenerated.toLocaleString()} installs
                  </p>
                )}
              </>
            )}
          </div>
          {actions && <div className="flex shrink-0 flex-col gap-2">{actions}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
