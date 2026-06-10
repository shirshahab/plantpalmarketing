"use client";

import { DollarSign, Download, Handshake, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import type { OakPartnershipDeal } from "@/lib/types";

export function PartnershipMetrics({
  deals,
  stats,
}: {
  deals: OakPartnershipDeal[];
  stats: {
    totalRevenue: number;
    totalInstalls: number;
    activeDeals: number;
    completed: number;
  };
}) {
  const topPerformers = [...deals]
    .filter((d) => d.installsGenerated > 0)
    .sort((a, b) => b.installsGenerated - a.installsGenerated)
    .slice(0, 5);

  return (
    <div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} icon={DollarSign} />
        <StatCard label="Installs Generated" value={stats.totalInstalls.toLocaleString()} icon={Download} />
        <StatCard label="Active Partnerships" value={stats.activeDeals} icon={Handshake} />
        <StatCard label="Completed" value={stats.completed} icon={TrendingUp} />
      </div>

      <h3 className="mb-3 font-heading text-sm font-semibold text-brand-primary">Top performers by installs</h3>
      {topPerformers.length === 0 ? (
        <p className="text-sm text-brand-muted">Metrics populate as partnerships go active.</p>
      ) : (
        <div className="space-y-3">
          {topPerformers.map((deal) => (
            <Card key={deal.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium text-brand-primary">{deal.partnerName}</p>
                  <p className="text-xs text-brand-muted">{deal.partnerType} · {deal.stage}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold text-brand-primary">{deal.installsGenerated.toLocaleString()} installs</p>
                  <p className="text-xs text-brand-muted">${deal.revenueGenerated.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
