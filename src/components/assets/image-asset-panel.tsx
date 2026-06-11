"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
/* eslint-disable @next/next/no-img-element */
import { CalendarPlus, Check, Copy, Download, ImageIcon, RefreshCw, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  generateImageAsset,
  prepareAssetForPrompt,
  reviewGeneratedAsset,
  attachAssetToCalendar,
} from "@/lib/actions/asset-generation";
import { FEEDBACK_CATEGORIES } from "@/lib/approvals/feedback-categories";
import type { GeneratedAsset } from "@/lib/db/asset-queries";

const STATUS_BADGES: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" | "muted" }> = {
  pending_generation: { label: "Ready to generate", variant: "info" },
  generating: { label: "Generating…", variant: "warning" },
  generated: { label: "Review image", variant: "warning" },
  approved: { label: "Image approved", variant: "success" },
  rejected: { label: "Image rejected", variant: "danger" },
  needs_revision: { label: "Needs revision", variant: "warning" },
  scheduled: { label: "On calendar", variant: "success" },
  published: { label: "Published", variant: "success" },
};

export function ImageAssetPanel({
  promptId,
  promptText,
  promptApproved,
  asset,
}: {
  promptId: string;
  promptText: string;
  promptApproved: boolean;
  asset: GeneratedAsset | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState<"reject" | "revision" | null>(null);
  const [category, setCategory] = useState<string>("needs better visual");
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);

  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) => {
    startTransition(async () => {
      const res = await fn();
      setMessage(res.ok ? (res.message ?? null) : (res.error ?? "Something went wrong"));
      if (res.ok) {
        setShowFeedback(null);
        setNote("");
        router.refresh();
      }
    });
  };

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!asset) {
    if (!promptApproved) return null;
    return (
      <div className="mt-3 rounded-xl border border-dashed border-brand-border bg-brand-bg/60 p-3">
        <p className="text-xs text-brand-muted">Prompt approved — create the asset package to generate the final image.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" disabled={pending} onClick={() => run(() => prepareAssetForPrompt(promptId))}>
            <Sparkles className="mr-1 h-3.5 w-3.5" /> Create asset package
          </Button>
          <Button size="sm" variant="secondary" onClick={copyPrompt}>
            <Copy className="mr-1 h-3.5 w-3.5" /> {copied ? "Copied" : "Copy prompt"}
          </Button>
        </div>
        {message && <p className="mt-2 text-xs text-brand-muted">{message}</p>}
      </div>
    );
  }

  const badge = STATUS_BADGES[asset.status] ?? { label: asset.status, variant: "muted" as const };
  const placeholder = !asset.imageUrl;

  return (
    <div className="mt-3 rounded-xl border border-brand-border bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <Badge variant={badge.variant}>{badge.label}</Badge>
        {asset.generationProvider !== "none" && (
          <span className="text-[10px] text-brand-muted">{asset.generationProvider} · {asset.generationModel}</span>
        )}
      </div>

      {/* Preview */}
      <div className="mt-2 overflow-hidden rounded-lg border border-brand-border bg-brand-bg">
        {placeholder ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-brand-muted">
            <ImageIcon className="h-8 w-8 opacity-50" />
            <p className="px-6 text-center text-xs">
              {asset.status === "pending_generation"
                ? "No image yet — click Generate Image."
                : "Image generation provider not connected yet. The asset package is ready for manual creation."}
            </p>
          </div>
        ) : (
          <img src={asset.imageUrl} alt="Generated asset preview" className="h-56 w-full object-cover" />
        )}
      </div>

      {asset.reviewFeedback && (
        <p className="mt-2 rounded-lg bg-brand-bg px-2 py-1.5 text-xs text-brand-muted">
          Feedback: {asset.reviewFeedback}
        </p>
      )}

      {/* Actions */}
      <div className="mt-3 flex flex-wrap gap-2">
        {(asset.status === "pending_generation" || asset.status === "needs_revision") && (
          <Button size="sm" disabled={pending} onClick={() => run(() => generateImageAsset(asset.id))}>
            <Sparkles className="mr-1 h-3.5 w-3.5" /> Generate image
          </Button>
        )}
        {(asset.status === "generated" || asset.status === "rejected") && (
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => generateImageAsset(asset.id))}>
            <RefreshCw className="mr-1 h-3.5 w-3.5" /> Regenerate
          </Button>
        )}
        {asset.status === "generated" && (
          <>
            <Button
              size="sm"
              disabled={pending}
              onClick={() => run(() => reviewGeneratedAsset({ assetId: asset.id, decision: "approve" }))}
            >
              <Check className="mr-1 h-3.5 w-3.5" /> Approve image
            </Button>
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => setShowFeedback("reject")}>
              <X className="mr-1 h-3.5 w-3.5" /> Reject
            </Button>
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => setShowFeedback("revision")}>
              Leave feedback
            </Button>
          </>
        )}
        {(asset.status === "approved" || asset.status === "scheduled") && !asset.calendarItemId && (
          <Button size="sm" disabled={pending} onClick={() => run(() => attachAssetToCalendar(asset.id))}>
            <CalendarPlus className="mr-1 h-3.5 w-3.5" /> Attach to calendar
          </Button>
        )}
        {asset.imageUrl && (
          <a href={asset.imageUrl} target="_blank" rel="noreferrer">
            <Button size="sm" variant="secondary">
              <Download className="mr-1 h-3.5 w-3.5" /> Download
            </Button>
          </a>
        )}
        <Button size="sm" variant="ghost" onClick={copyPrompt}>
          <Copy className="mr-1 h-3.5 w-3.5" /> {copied ? "Copied" : "Copy prompt"}
        </Button>
      </div>

      {/* Feedback form */}
      {showFeedback && (
        <div className="mt-3 space-y-2 rounded-lg border border-brand-border bg-brand-bg p-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-brand-border bg-white px-2 py-1.5 text-xs"
          >
            {FEEDBACK_CATEGORIES.filter((c) => c !== "approved as-is").map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What should change about this image?"
            rows={2}
            className="w-full rounded-lg border border-brand-border bg-white px-2 py-1.5 text-xs"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                run(() =>
                  reviewGeneratedAsset({
                    assetId: asset.id,
                    decision: showFeedback === "reject" ? "reject" : "request_revision",
                    feedbackCategory: category,
                    note,
                  })
                )
              }
            >
              {showFeedback === "reject" ? "Reject with reason" : "Send back to Fern"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowFeedback(null)}>Cancel</Button>
          </div>
        </div>
      )}

      {message && <p className="mt-2 text-xs text-brand-muted">{message}</p>}
    </div>
  );
}
