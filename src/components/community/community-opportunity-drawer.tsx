"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Check, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Label, Textarea } from "@/components/ui/input";
import { approveCommunityReply, rejectCommunityReply, updateCommunityReplyDraft } from "@/lib/actions/roots-agent";
import type { CommunityOpportunity, CommunityReplyDraft } from "@/lib/types";

export function CommunityOpportunityDrawer({
  opportunity,
  replyDraft,
  onClose,
}: {
  opportunity: CommunityOpportunity | null;
  replyDraft: CommunityReplyDraft | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(replyDraft?.draft ?? opportunity?.suggestedReply ?? "");
  const [status, setStatus] = useState(replyDraft?.status ?? opportunity?.status ?? "pending");
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!opportunity) return null;

  function handleApprove() {
    if (!replyDraft) return;
    startTransition(async () => {
      const res = await approveCommunityReply(replyDraft.id);
      if (res.ok) {
        setStatus("approved");
        router.refresh();
      } else setError(res.error);
    });
  }

  function handleReject() {
    if (!replyDraft) return;
    startTransition(async () => {
      const res = await rejectCommunityReply(replyDraft.id);
      if (res.ok) {
        setStatus("rejected");
        router.refresh();
      } else setError(res.error);
    });
  }

  function handleSaveEdit() {
    if (!replyDraft) return;
    startTransition(async () => {
      const res = await updateCommunityReplyDraft(replyDraft.id, { draft });
      if (res.ok) {
        setEditing(false);
        router.refresh();
      } else setError(res.error);
    });
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-brand-primary/20 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <aside className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-lg flex-col border-l border-brand-border bg-white shadow-2xl sm:top-16">
        <div className="flex items-center justify-between border-b border-brand-border px-5 py-4">
          <h2 className="font-heading text-lg font-bold text-brand-primary">Community Opportunity</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-brand-muted hover:bg-brand-bg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="info">{opportunity.platform}</Badge>
            <Badge variant="muted">{opportunity.opportunityType.replace(/_/g, " ")}</Badge>
            <Badge variant="warning">Urgency {opportunity.urgencyScore}</Badge>
            <Badge variant="success">Opportunity {opportunity.opportunityScore}</Badge>
          </div>

          <p className="mt-3 text-sm font-medium text-brand-primary">{opportunity.author}</p>
          <p className="mt-2 rounded-xl bg-brand-bg/50 p-3 text-sm italic">&ldquo;{opportunity.post}&rdquo;</p>

          {opportunity.question && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase text-brand-sage">Question</p>
              <p className="text-sm">{opportunity.question}</p>
            </div>
          )}

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase text-brand-sage">Suggested reply</p>
            <p className="mb-2 text-[11px] text-brand-muted">Helpful first. PlantPal mentioned only when appropriate.</p>
            {editing ? (
              <div className="space-y-2">
                <Label>Edit reply</Label>
                <Textarea rows={6} value={draft} onChange={(e) => setDraft(e.target.value)} />
                <div className="flex gap-2">
                  <Button size="sm" disabled={pending} onClick={handleSaveEdit}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <p className="mt-2 rounded-xl border border-brand-sage/30 bg-brand-bg p-4 text-sm leading-relaxed">{draft}</p>
            )}
          </div>

          <div className="mt-4">
            <StatusBadge status={status} />
          </div>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>

        {status === "pending" && replyDraft && (
          <div className="space-y-2 border-t border-brand-border p-4">
            <p className="text-xs text-brand-muted">Human approval required — no auto-commenting</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="success" disabled={pending} onClick={handleApprove}>
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Approve
              </Button>
              <Button size="sm" variant="secondary" disabled={pending} onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button size="sm" variant="danger" disabled={pending} onClick={handleReject}>
                <X className="h-3.5 w-3.5" /> Reject
              </Button>
            </div>
          </div>
        )}

        <div className="border-t border-brand-border p-4">
          <Button variant="secondary" className="w-full" onClick={onClose}>Close</Button>
        </div>
      </aside>
    </>
  );
}
