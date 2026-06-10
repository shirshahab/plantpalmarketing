"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { approveCreatorLead, rejectCreatorLead } from "@/lib/actions/scout-agent";
import type { Status } from "@/lib/types";

export function CreatorLeadActions({ leadId, status }: { leadId: string; status: Status }) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handle(action: "approve" | "reject") {
    startTransition(async () => {
      const res = action === "approve" ? await approveCreatorLead(leadId) : await rejectCreatorLead(leadId);
      if (res.ok) {
        setCurrent(action === "approve" ? "approved" : "rejected");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  if (current !== "pending") {
    return (
      <div>
        <StatusBadge status={current} />
        <p className="mt-2 text-xs text-brand-muted">Queued in approval workflow. No auto-outreach.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-brand-muted">Human approval required before outreach</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="success" disabled={pending} onClick={() => handle("approve")}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Approve
        </Button>
        <Button size="sm" variant="secondary" disabled={pending}>
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Button>
        <Button size="sm" variant="danger" disabled={pending} onClick={() => handle("reject")}>
          <X className="h-3.5 w-3.5" /> Reject
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
