"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, CornerUpLeft, Loader2, MessageSquarePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Label, Textarea } from "@/components/ui/input";
import { submitApprovalDecision } from "@/lib/actions/approval-feedback";
import {
  FEEDBACK_CATEGORIES,
  type ApprovalDecision,
} from "@/lib/approvals/feedback-categories";
import type { Status } from "@/lib/types";

type Mode = "idle" | "approve_note" | "reject" | "send_back_sage" | "send_back_bloom";

const MODE_TO_DECISION: Record<Exclude<Mode, "idle">, ApprovalDecision> = {
  approve_note: "approve_with_note",
  reject: "reject",
  send_back_sage: "send_back_to_sage",
  send_back_bloom: "send_back_to_bloom",
};

const MODE_LABEL: Record<Exclude<Mode, "idle">, string> = {
  approve_note: "Approve with note",
  reject: "Reject with reason",
  send_back_sage: "Send back to Sage",
  send_back_bloom: "Send back to Bloom",
};

/**
 * Phase 28 — founder approval card actions with structured feedback:
 * Approve / Approve with note / Reject with reason / Send back to Sage / Bloom.
 */
export function ApprovalFeedbackActions({
  id,
  initialStatus,
}: {
  id: string;
  initialStatus: Status | "revision_requested";
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string>(initialStatus);
  const [mode, setMode] = useState<Mode>("idle");
  const [category, setCategory] = useState<string>("too generic");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(decision: ApprovalDecision, feedbackCategory?: string, feedbackNote?: string) {
    startTransition(async () => {
      const result = await submitApprovalDecision({
        id,
        decision,
        feedbackCategory,
        note: feedbackNote,
      });
      if (result.ok) {
        setStatus(result.status);
        setMode("idle");
        setNote("");
        setError(null);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (status !== "pending" && mode === "idle") {
    return (
      <div className="space-y-1">
        <StatusBadge status={status as Status} />
        {status === "revision_requested" && (
          <p className="text-[11px] text-amber-700">Sent back for revision</p>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  if (mode !== "idle") {
    const isApproveNote = mode === "approve_note";
    return (
      <div className="w-full min-w-[260px] space-y-2 rounded-xl border border-brand-border/60 bg-brand-bg/50 p-3">
        <p className="text-xs font-semibold text-brand-primary">{MODE_LABEL[mode]}</p>
        {!isApproveNote && (
          <div>
            <Label>Feedback category</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-border bg-white px-2 py-1.5 text-sm text-brand-primary"
            >
              {FEEDBACK_CATEGORIES.filter((c) => c !== "approved as-is").map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <Label>{isApproveNote ? "Note for the team" : "What should change?"}</Label>
          <Textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={isApproveNote ? "Great hook — more like this." : "Be specific so the agent can fix it."}
          />
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              submit(MODE_TO_DECISION[mode], isApproveNote ? "approved as-is" : category, note)
            }
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Submit
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setMode("idle")}>
            Cancel
          </Button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <Button variant="success" size="sm" disabled={pending} onClick={() => submit("approve", "approved as-is")}>
          <Check className="h-3.5 w-3.5" />
          Approve
        </Button>
        <Button variant="ghost" size="sm" disabled={pending} onClick={() => setMode("approve_note")}>
          <MessageSquarePlus className="h-3.5 w-3.5" />
          Approve + note
        </Button>
        <Button variant="danger" size="sm" disabled={pending} onClick={() => setMode("reject")}>
          <X className="h-3.5 w-3.5" />
          Reject
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button variant="ghost" size="sm" disabled={pending} onClick={() => setMode("send_back_sage")}>
          <CornerUpLeft className="h-3.5 w-3.5" />
          To Sage
        </Button>
        <Button variant="ghost" size="sm" disabled={pending} onClick={() => setMode("send_back_bloom")}>
          <CornerUpLeft className="h-3.5 w-3.5" />
          To Bloom
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
