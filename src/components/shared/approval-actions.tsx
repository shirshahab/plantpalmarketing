"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Label, Textarea } from "@/components/ui/input";
import { approveRecord, rejectRecord } from "@/lib/actions/shared";
import { updateApprovalItem } from "@/lib/actions/approval-queue";
import { updateCommunityOpportunity } from "@/lib/actions/community";
import { useToast, showDestinationToast } from "@/components/shared/toast-provider";
import { WorkflowStatusStrip } from "@/components/workflow/workflow-status-strip";
import { founderSafeError } from "@/lib/integrations/founder-safe-error";
import type { MarketingTable, Status } from "@/lib/types";

type ApprovalActionsProps = {
  table: MarketingTable;
  id: string;
  initialStatus: Status;
  showEdit?: boolean;
  editDraft?: string;
  onEditSave?: (draft: string) => Promise<{ ok: boolean; error?: string }>;
};

export function ApprovalActions({
  table,
  id,
  initialStatus,
  showEdit = false,
  editDraft,
  onEditSave,
}: ApprovalActionsProps) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(editDraft ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { showToast } = useToast();
  const [destinationStrip, setDestinationStrip] = useState<string | null>(null);

  function handleApprove() {
    startTransition(async () => {
      const result = await approveRecord(table, id);
      if (result.ok) {
        setStatus("approved");
        setError(null);
        const msg = "message" in result ? result.message : "Approved";
        setDestinationStrip(msg ?? "Approved");
        showDestinationToast(showToast, {
          message: msg ?? "Approved",
          destination: result.destination,
          destinationLabel: result.destinationLabel,
          destinationUrl: result.destinationUrl,
          workflowUrl: result.workflowUrl,
          nextOwner: result.nextOwner,
          nextStep: result.nextStep,
          withNavigation: table === "creative_content_ideas",
        });
      } else {
        setError(founderSafeError(result.error));
      }
    });
  }

  function handleReject() {
    startTransition(async () => {
      const result = await rejectRecord(table, id);
      if (result.ok) {
        setStatus("rejected");
        setError(null);
        const msg = "message" in result ? result.message : "Sent back for revision";
        setDestinationStrip(msg ?? "Sent back for revision");
        showDestinationToast(showToast, {
          message: msg ?? "Sent back for revision",
          tone: "warning",
          destination: "message" in result ? result.destination : undefined,
        });
      } else {
        setError(founderSafeError(result.error));
      }
    });
  }

  function handleSaveEdit() {
    startTransition(async () => {
      let result: { ok: boolean; error?: string };
      if (onEditSave) {
        result = await onEditSave(draft);
      } else if (table === "approval_queue") {
        const r = await updateApprovalItem(id, { draft });
        result = r.ok ? { ok: true } : { ok: false, error: r.error };
      } else if (table === "community_opportunities") {
        const r = await updateCommunityOpportunity(id, { suggestedReply: draft });
        result = r.ok ? { ok: true } : { ok: false, error: r.error };
      } else {
        result = { ok: false, error: "Edit not supported for this item" };
      }

      if (result.ok) {
        setEditing(false);
        setError(null);
      } else {
        setError(result.error ?? "Failed to save");
      }
    });
  }

  if (editing) {
    return (
      <div className="w-full min-w-[240px] space-y-2">
        <Label>Edit draft</Label>
        <Textarea rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} />
        <div className="flex gap-2">
          <Button size="sm" disabled={pending} onClick={handleSaveEdit}>
            Save
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  if (status !== "pending") {
    return (
      <div className="space-y-1">
        <StatusBadge status={status} />
        {destinationStrip && (
          <p className="rounded-lg bg-brand-bg px-2 py-1 text-xs font-medium text-brand-primary">{destinationStrip}</p>
        )}
        <WorkflowStatusStrip
          sourceTable={table}
          sourceId={id}
          founderActionRequired={false}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="success" size="sm" disabled={pending} onClick={handleApprove}>
          <Check className="h-3.5 w-3.5" />
          Approve
        </Button>
        <Button variant="danger" size="sm" disabled={pending} onClick={handleReject}>
          <X className="h-3.5 w-3.5" />
          Reject
        </Button>
        {showEdit && (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
