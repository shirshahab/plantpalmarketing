"use client";

import { Activity, Filter } from "lucide-react";
import { ActivityFeedItem } from "@/components/hq/activity-feed-item";
import type { ActivityItem } from "@/lib/hq/types";

export function ActivityFeed({
  items,
  selectedId,
  onSelect,
  onApprove,
  onEdit,
  onReject,
}: {
  items: ActivityItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onApprove: (id: string) => void;
  onEdit: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const pendingCount = items.filter(
    (i) => i.type === "approval_needed" && i.status === "pending"
  ).length;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-brand-border/60 bg-gradient-to-b from-white to-brand-bg/80 shadow-sm sm:rounded-3xl">
      <div className="border-b border-brand-border/50 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-brand-primary">Company Activity Stream</h2>
              <p className="text-[11px] text-brand-muted">Who did what, when, why, and impact</p>
            </div>
          </div>
          {pendingCount > 0 && (
            <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
              {pendingCount} need approval
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 text-[11px] text-brand-muted">
          <Filter className="h-3 w-3" />
          <span>Collaboration · Events · Messages · Tasks · Approvals</span>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {items.length === 0 ? (
          <p className="py-12 text-center text-sm text-brand-muted">All quiet at HQ.</p>
        ) : (
          items.map((item, index) => (
            <ActivityFeedItem
              key={item.id}
              item={item}
              index={index}
              isSelected={selectedId === item.id}
              onSelect={() => onSelect(item.id)}
              onApprove={() => onApprove(item.id)}
              onEdit={() => onEdit(item.id)}
              onReject={() => onReject(item.id)}
            />
          ))
        )}
      </div>

      <div className="border-t border-brand-border/50 px-5 py-3">
        <p className="text-center text-[10px] text-brand-sage">
          Human approval required · No auto-posting
        </p>
      </div>
    </div>
  );
}
