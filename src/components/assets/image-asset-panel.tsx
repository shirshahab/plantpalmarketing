"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
/* eslint-disable @next/next/no-img-element */
import { CalendarDays, Check, Copy, Download, ImageIcon, RefreshCw, Sparkles, Skull } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  generateImageAsset,
  prepareAssetForPrompt,
  reviewGeneratedAsset,
  attachAssetToCalendar,
} from "@/lib/actions/asset-generation";
import type { ImageWorkflowDecision } from "@/lib/actions/asset-generation";
import { VoiceScoreBadge } from "@/components/shared/voice-score-badge";
import { LegacyWorkflowBadge } from "@/components/workflow/workflow-stage-badge";
import { WorkflowHistoryPanel } from "@/components/workflow/workflow-history-panel";
import { getCampaignContext } from "@/lib/assets/campaign-context";
import { isInCreativeDepartment } from "@/lib/workflow/types";
import type { GeneratedAsset } from "@/lib/db/asset-queries";

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
  const [showNote, setShowNote] = useState<ImageWorkflowDecision | null>(null);
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);

  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) => {
    startTransition(async () => {
      const res = await fn();
      setMessage(res.ok ? (res.message ?? null) : (res.error ?? "Something went wrong"));
      if (res.ok) {
        setShowNote(null);
        setNote("");
        router.refresh();
      }
    });
  };

  const review = (decision: ImageWorkflowDecision) => {
    if (decision !== "approve" && !showNote) {
      setShowNote(decision);
      return;
    }
    run(() =>
      reviewGeneratedAsset({
        assetId: asset!.id,
        decision,
        note: note || undefined,
      })
    );
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

  const inCreative = isInCreativeDepartment(asset.status, asset.calendarItemId);

  if (!inCreative) {
    return (
      <div className="mt-3 rounded-xl border border-brand-border bg-brand-bg/60 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <LegacyWorkflowBadge status={asset.status} />
          <span className="text-xs text-brand-muted">Approved — this asset lives on the Calendar now.</span>
        </div>
        <Link href="/calendar" className="mt-2 inline-flex text-xs font-medium text-brand-accent hover:underline">
          <CalendarDays className="mr-1 inline h-3.5 w-3.5" />
          Open Calendar
        </Link>
        <WorkflowHistoryPanel sourceTable="generated_assets" sourceId={asset.id} />
      </div>
    );
  }

  const placeholder = !asset.imageUrl;
  const lastError = typeof asset.metadata.lastError === "string" ? asset.metadata.lastError : "";
  const reviewable = asset.status === "generated";

  return (
    <div className="mt-3 rounded-xl border border-brand-border bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <LegacyWorkflowBadge status={asset.status} />
        {asset.generationProvider !== "none" && (
          <span className="text-[10px] text-brand-muted">{asset.generationProvider} · {asset.generationModel}</span>
        )}
      </div>

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

      {lastError && (
        <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-xs text-amber-900">
          Last generation didn&apos;t go through — you can regenerate.
          <span className="mt-0.5 block break-words text-[10px] text-amber-700/80">{lastError.slice(0, 220)}</span>
        </p>
      )}

      {asset.reviewFeedback && (
        <p className="mt-2 rounded-lg bg-brand-bg px-2 py-1.5 text-xs text-brand-muted">
          Feedback: {asset.reviewFeedback}
        </p>
      )}

      {asset.status !== "pending_generation" && (
        <CampaignContextBlock metadata={asset.metadata} prompt={asset.prompt} />
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {(asset.status === "pending_generation" || asset.status === "needs_revision") && (
          <Button size="sm" disabled={pending} onClick={() => run(() => generateImageAsset(asset.id))}>
            <Sparkles className="mr-1 h-3.5 w-3.5" /> Generate image
          </Button>
        )}
        {reviewable && (
          <>
            <Button size="sm" disabled={pending} onClick={() => review("approve")}>
              <Check className="mr-1 h-3.5 w-3.5" /> Approve → Calendar
            </Button>
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => review("regenerate_image")}>
              <RefreshCw className="mr-1 h-3.5 w-3.5" /> Regenerate image
            </Button>
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => review("regenerate_caption")}>
              Regenerate caption
            </Button>
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => review("regenerate_both")}>
              Regenerate both
            </Button>
            <Button size="sm" variant="danger" disabled={pending} onClick={() => review("kill_campaign")}>
              <Skull className="mr-1 h-3.5 w-3.5" /> Kill campaign
            </Button>
          </>
        )}
        {asset.status === "approved" && !asset.calendarItemId && (
          <Button size="sm" disabled={pending} onClick={() => run(() => attachAssetToCalendar(asset.id))}>
            <CalendarDays className="mr-1 h-3.5 w-3.5" /> Attach to calendar
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

      {showNote && (
        <div className="mt-3 space-y-2 rounded-lg border border-brand-border bg-brand-bg p-3">
          <p className="text-xs font-medium text-brand-primary">
            Optional note for{" "}
            {showNote === "regenerate_image"
              ? "regenerate image"
              : showNote === "regenerate_caption"
                ? "regenerate caption"
                : showNote === "regenerate_both"
                  ? "regenerate both"
                  : "kill campaign"}
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What should change?"
            rows={2}
            className="w-full rounded-lg border border-brand-border bg-white px-2 py-1.5 text-xs"
          />
          <div className="flex gap-2">
            <Button size="sm" disabled={pending} onClick={() => review(showNote)}>
              Confirm
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowNote(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <WorkflowHistoryPanel sourceTable="generated_assets" sourceId={asset.id} />
      {message && <p className="mt-2 text-xs text-brand-muted">{message}</p>}
    </div>
  );
}

function CampaignContextBlock({
  metadata,
  prompt,
}: {
  metadata: Record<string, unknown>;
  prompt: string;
}) {
  const [open, setOpen] = useState(true);
  const campaign = getCampaignContext(metadata);

  return (
    <div className="mt-2 rounded-lg border border-brand-border/60 bg-brand-bg/40 p-2.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-brand-sage">
          Why this image exists
          <VoiceScoreBadge score={campaign.voiceScore} compact />
        </span>
        <span className="text-[10px] text-brand-muted">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <dl className="mt-2 space-y-1.5 text-xs">
          <ContextRow label="Campaign objective" value={campaign.objective} />
          <ContextRow label="Platform" value={campaign.platform} />
          <ContextRow label="Target audience" value={campaign.targetAudience} />
          <ContextRow label="Hook" value={campaign.hook} />
          <ContextRow label="Caption" value={campaign.caption} />
          <ContextRow label="Hashtags" value={campaign.hashtags.join(" ")} />
          <ContextRow label="CTA" value={campaign.cta} />
          <ContextRow label="Asset prompt" value={prompt} clamp />
          <ContextRow label="Approval reason" value={campaign.approvalReason} />
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
              Platform captions (each network gets its own)
            </dt>
            <dd className="mt-1 space-y-1">
              {Object.entries(campaign.platformCaptions).map(([platform, caption]) => (
                <details key={platform} className="rounded border border-brand-border/50 bg-white/60 px-2 py-1">
                  <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-wide text-brand-sage">
                    {platform}
                  </summary>
                  <p className="mt-1 whitespace-pre-line text-brand-primary">{caption}</p>
                </details>
              ))}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}

function ContextRow({ label, value, clamp }: { label: string; value: string; clamp?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">{label}</dt>
      <dd className={clamp ? "line-clamp-2 text-brand-primary" : "text-brand-primary"}>{value}</dd>
    </div>
  );
}
