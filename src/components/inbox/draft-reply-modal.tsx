"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import {
  archiveReplyDraftSourceAction,
  saveReplyDraftAction,
  sendReplyDraftToApprovalAction,
} from "@/lib/actions/reply-drafts";

export interface DraftReplyTarget {
  sourceType: string;
  sourceId: string;
  sourceUrl: string;
  sourceTitle: string;
  sourceBody: string;
  platform: string;
  subreddit?: string;
  suggestedReply: string;
  draftId?: string;
}

export function DraftReplyModal({
  target,
  onClose,
}: {
  target: DraftReplyTarget | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editedReply, setEditedReply] = useState("");
  const [draftId, setDraftId] = useState<string | undefined>();
  const [toast, setToast] = useState<{ message: string; showReplies?: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (target) {
      setEditedReply(target.suggestedReply);
      setDraftId(target.draftId);
      setToast(null);
    }
  }, [target]);

  if (!target) return null;

  function save(andClose = false) {
    startTransition(async () => {
      const result = await saveReplyDraftAction({
        sourceType: target!.sourceType,
        sourceId: target!.sourceId,
        sourceUrl: target!.sourceUrl,
        sourceTitle: target!.sourceTitle,
        sourceBody: target!.sourceBody,
        platform: target!.platform,
        subreddit: target!.subreddit,
        suggestedReply: target!.suggestedReply,
        editedReply,
        draftId,
      });
      if (result.ok) {
        if (result.draftId) setDraftId(result.draftId);
        setToast({ message: "Reply draft saved.", showReplies: true });
        router.refresh();
        if (andClose) onClose();
      } else {
        setToast({ message: result.error ?? "Save failed" });
      }
    });
  }

  function sendToApproval() {
    startTransition(async () => {
      const saved = await saveReplyDraftAction({
        sourceType: target!.sourceType,
        sourceId: target!.sourceId,
        sourceUrl: target!.sourceUrl,
        sourceTitle: target!.sourceTitle,
        sourceBody: target!.sourceBody,
        platform: target!.platform,
        subreddit: target!.subreddit,
        suggestedReply: target!.suggestedReply,
        editedReply,
        draftId,
      });
      if (!saved.ok || !saved.draftId) {
        setToast({ message: !saved.ok ? saved.error : "Save failed" });
        return;
      }
      const result = await sendReplyDraftToApprovalAction(saved.draftId);
      setToast({
        message: result.ok ? "Sent to approval queue." : (!result.ok ? result.error : "Failed"),
        showReplies: result.ok,
      });
      if (result.ok) router.refresh();
    });
  }

  function archive() {
    startTransition(async () => {
      await archiveReplyDraftSourceAction(target!.sourceType, target!.sourceId);
      router.refresh();
      onClose();
    });
  }

  async function copyUrl() {
    if (!target?.sourceUrl) return;
    try {
      await navigator.clipboard.writeText(target.sourceUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-brand-primary/30 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-brand-border bg-white shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[85dvh] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-brand-border bg-white px-5 py-4">
          <h2 className="font-heading text-lg font-bold text-brand-primary">Draft Reply</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-brand-muted hover:bg-brand-bg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-brand-muted">Original</p>
            <p className="mt-1 font-medium text-brand-primary">{target.sourceTitle}</p>
            {target.subreddit && <p className="text-xs text-brand-muted">r/{target.subreddit.replace(/^r\//, "")}</p>}
            <p className="mt-2 rounded-xl bg-brand-bg p-3 text-sm text-brand-muted">{target.sourceBody.slice(0, 600)}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {target.sourceUrl ? (
              <>
                <a
                  href={target.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-brand-border px-2.5 py-1.5 text-xs font-medium text-brand-primary hover:bg-brand-bg"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Original Post
                </a>
                <button
                  type="button"
                  onClick={copyUrl}
                  className="inline-flex items-center gap-1 rounded-lg border border-brand-border px-2.5 py-1.5 text-xs font-medium text-brand-muted hover:bg-brand-bg"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  Copy Link
                </button>
              </>
            ) : (
              <span className="text-xs text-brand-muted">Source link unavailable</span>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-brand-primary">Suggested PlantPal reply</p>
            <p className="mt-1 rounded-xl border border-brand-border/60 bg-emerald-50/50 p-3 text-sm text-brand-muted">
              {target.suggestedReply}
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-brand-primary">Your reply</label>
            <Textarea
              value={editedReply}
              onChange={(e) => setEditedReply(e.target.value)}
              rows={5}
              className="mt-1.5 w-full"
            />
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <p className="font-medium">Safety rules</p>
            <ul className="mt-1 list-disc pl-4 space-y-0.5">
              <li>No links in replies</li>
              <li>No promotion or app mentions unless asked</li>
              <li>Founder approval required before posting</li>
              <li>Reddit OAuth required before anything goes live</li>
            </ul>
          </div>

          {toast && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
              {toast.message}
              {toast.showReplies && (
                <span className="ml-2 inline-flex gap-2">
                  <Link href="/replies" className="font-medium underline">Open Replies</Link>
                  <button type="button" onClick={onClose} className="font-medium underline">Stay Here</button>
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t border-brand-border pt-4">
            <Button size="sm" disabled={pending} onClick={() => save(false)}>Save Draft</Button>
            <Button size="sm" variant="secondary" disabled={pending} onClick={sendToApproval}>Send to Approval Queue</Button>
            <Button size="sm" variant="secondary" disabled={pending} onClick={archive}>Archive</Button>
            <Button size="sm" variant="secondary" disabled={pending} onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </div>
    </>
  );
}
