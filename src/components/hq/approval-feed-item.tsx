"use client";

import { Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActivityItem } from "@/lib/hq/types";

export function ApprovalFeedItem({
  item,
  onApprove,
  onEdit,
  onReject,
}: {
  item: ActivityItem;
  onApprove: () => void;
  onEdit: () => void;
  onReject: () => void;
}) {
  if (item.status === "approved") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-3 py-2 text-xs text-emerald-700">
        Approved — queued for scheduling (no auto-post)
      </div>
    );
  }

  if (item.status === "rejected") {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50/50 px-3 py-2 text-xs text-rose-700">
        Rejected — sent back to content pipeline
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="success" onClick={onApprove}>
        <Check className="h-3.5 w-3.5" />
        Approve
      </Button>
      <Button size="sm" variant="secondary" onClick={onEdit}>
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </Button>
      <Button size="sm" variant="danger" onClick={onReject}>
        <X className="h-3.5 w-3.5" />
        Reject
      </Button>
    </div>
  );
}
