"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HQBuildingArt } from "@/components/hq/world/hq-building-art";
import { HQStatusPill, agentStatusToVillage } from "@/components/hq/world/hq-status-pill";
import type { VillageBuilding } from "@/lib/hq/hq-village-layout";
import type { ActivityItem, HQAgent } from "@/lib/hq/types";

export function HQBuildingPanel({
  building,
  agent,
  activity,
  onClose,
  onEnterInterior,
  onSelectAgent,
}: {
  building: VillageBuilding;
  agent: HQAgent | null;
  activity: ActivityItem[];
  onClose: () => void;
  onEnterInterior: () => void;
  onSelectAgent?: () => void;
}) {
  const related = activity.filter(
    (a) =>
      (agent && a.agentId === agent.id) ||
      a.title.toLowerCase().includes(building.agentName?.toLowerCase() ?? "")
  ).slice(0, 5);

  const founderLinks =
    building.id === "founder_plaza"
      ? [
          { href: "/inbox", label: "Founder Inbox" },
          { href: "/approvals", label: "Approvals" },
          { href: "/agents/daily-brief", label: "Executive Brief" },
          { href: "/company-os", label: "Company Health" },
        ]
      : [];

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-brand-border/60 bg-white/95 shadow-2xl backdrop-blur-md sm:absolute sm:inset-y-2 sm:right-2 sm:max-h-[calc(100%-1rem)] sm:rounded-2xl sm:border">
      <div className="flex items-start justify-between gap-2 border-b border-brand-border/40 p-4">
        <div className="flex gap-3">
          <HQBuildingArt style={building.art} accent={building.accent} />
          <div>
            <h2 className="font-heading text-lg font-bold text-brand-primary">{building.name}</h2>
            <p className="text-xs text-brand-muted">{building.description}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1 text-brand-muted hover:bg-brand-bg">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {agent && (
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-muted">Agent on duty</p>
            <button
              type="button"
              onClick={onSelectAgent}
              className="w-full rounded-xl border border-brand-border/60 bg-brand-bg/50 p-3 text-left hover:border-brand-accent/50"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-brand-primary">{agent.name}</span>
                <HQStatusPill status={agentStatusToVillage(agent.status)} />
              </div>
              <p className="mt-1 text-sm text-brand-muted">{agent.currentTask || agent.role}</p>
              {agent.itemsNeedingReview > 0 && (
                <Badge variant="warning" className="mt-2">
                  {agent.itemsNeedingReview} need review
                </Badge>
              )}
            </button>
          </section>
        )}

        {building.id === "moss_hut" && !agent && (
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-muted">Brand Guardian</p>
            <p className="text-sm text-brand-muted">
              Moss scores every caption. Nothing below 8/10 reaches the founder. No em dashes. Ever.
            </p>
            <Link href="/brand" className="mt-2 inline-block text-sm font-medium text-brand-primary underline">
              Open Brand Brain
            </Link>
          </section>
        )}

        {founderLinks.length > 0 && (
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-muted">Founder Plaza</p>
            <div className="grid gap-1.5">
              {founderLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg border border-brand-border/50 px-3 py-2 text-sm font-medium text-brand-primary hover:bg-brand-bg"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-muted">Recent activity</p>
          {related.length === 0 ? (
            <p className="text-sm text-brand-muted">Quiet right now.</p>
          ) : (
            <ul className="space-y-2">
              {related.map((item) => (
                <li key={item.id} className="rounded-lg border border-brand-border/40 px-2.5 py-2 text-xs">
                  <p className="font-medium text-brand-primary">{item.title}</p>
                  <p className="line-clamp-2 text-brand-muted">{item.summary}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {building.href && (
          <Link
            href={building.href}
            className="block rounded-xl bg-brand-primary px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-primary/90"
          >
            Open {building.name}
          </Link>
        )}
      </div>

      <div className="border-t border-brand-border/40 p-4">
        <button
          type="button"
          onClick={onEnterInterior}
          className="w-full rounded-xl border-2 border-dashed border-brand-accent/50 py-2.5 text-sm font-semibold text-brand-primary hover:bg-brand-accent/10"
        >
          Enter building
        </button>
      </div>
    </div>
  );
}
