"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Check, Clapperboard, Package, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  buildVideoPackageFromScript,
  reviewGeneratedVideo,
  attachVideoToCalendar,
} from "@/lib/actions/video-generation";
import { FEEDBACK_CATEGORIES } from "@/lib/approvals/feedback-categories";
import type { GeneratedVideo } from "@/lib/db/asset-queries";

const STATUS_BADGES: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" | "muted" }> = {
  script_draft: { label: "Script draft", variant: "muted" },
  script_approved: { label: "Script approved", variant: "info" },
  package_ready: { label: "Package ready — review", variant: "warning" },
  pending_generation: { label: "Awaiting generation", variant: "info" },
  generating: { label: "Generating…", variant: "warning" },
  generated: { label: "Video ready — review", variant: "warning" },
  approved: { label: "Video approved", variant: "success" },
  rejected: { label: "Rejected", variant: "danger" },
  needs_revision: { label: "Edits requested", variant: "warning" },
  scheduled: { label: "On calendar", variant: "success" },
  published: { label: "Published", variant: "success" },
};

export function VideoPackagePanel({
  scriptId,
  scriptApproved,
  video,
}: {
  scriptId: string;
  scriptApproved: boolean;
  video: GeneratedVideo | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState<"reject" | "edits" | null>(null);
  const [category, setCategory] = useState<string>("needs better video pacing");
  const [note, setNote] = useState("");

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

  if (!video) {
    if (!scriptApproved) return null;
    return (
      <div className="mt-4 rounded-xl border border-dashed border-brand-border bg-brand-bg/60 p-3">
        <p className="text-xs text-brand-muted">
          Script approved — build the full video package (scenes, b-roll, caption, hashtags, thumbnail prompt, checklist).
        </p>
        <Button size="sm" className="mt-2" disabled={pending} onClick={() => run(() => buildVideoPackageFromScript(scriptId))}>
          <Package className="mr-1 h-3.5 w-3.5" /> Generate video package
        </Button>
        {message && <p className="mt-2 text-xs text-brand-muted">{message}</p>}
      </div>
    );
  }

  const badge = STATUS_BADGES[video.status] ?? { label: video.status, variant: "muted" as const };
  const meta = video.metadata;
  const bRoll = Array.isArray(meta.bRollList) ? (meta.bRollList as string[]) : [];
  const hashtags = Array.isArray(meta.hashtags) ? (meta.hashtags as string[]) : [];
  const checklist = Array.isArray(meta.uploadChecklist) ? (meta.uploadChecklist as string[]) : [];
  const reviewable = ["package_ready", "generated"].includes(video.status);

  return (
    <div className="mt-4 rounded-xl border border-brand-border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-brand-primary" />
          <span className="text-sm font-semibold text-brand-primary">Video package</span>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
      </div>

      {/* Preview area */}
      <div className="mt-3 grid gap-3 sm:grid-cols-[200px_1fr]">
        <div className="flex aspect-[9/16] max-h-64 flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-brand-border bg-brand-bg text-brand-muted">
          {video.videoUrl ? (
            <video src={video.videoUrl} poster={video.thumbnailUrl || undefined} controls className="h-full w-full object-cover" />
          ) : (
            <>
              <Clapperboard className="h-8 w-8 opacity-50" />
              <p className="px-4 text-center text-[11px]">Final video generation not connected yet.</p>
            </>
          )}
        </div>
        <div className="min-w-0 space-y-2 text-xs">
          {typeof meta.visualDirection === "string" && (
            <div>
              <p className="font-semibold uppercase tracking-wider text-brand-sage">Visual direction</p>
              <p className="mt-0.5 text-brand-muted">{meta.visualDirection}</p>
            </div>
          )}
          {bRoll.length > 0 && (
            <div>
              <p className="font-semibold uppercase tracking-wider text-brand-sage">B-roll list</p>
              <ul className="mt-0.5 list-disc pl-4 text-brand-muted">
                {bRoll.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>
          )}
          {typeof meta.thumbnailPrompt === "string" && (
            <div>
              <p className="font-semibold uppercase tracking-wider text-brand-sage">Thumbnail prompt</p>
              <p className="mt-0.5 text-brand-muted">{meta.thumbnailPrompt}</p>
            </div>
          )}
          {hashtags.length > 0 && (
            <p className="text-brand-primary">{hashtags.join(" ")}</p>
          )}
        </div>
      </div>

      {checklist.length > 0 && (
        <div className="mt-3 rounded-lg bg-brand-bg p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-sage">Upload checklist</p>
          <ul className="mt-1 space-y-0.5 text-xs text-brand-muted">
            {checklist.map((c, i) => <li key={i}>☐ {c}</li>)}
          </ul>
        </div>
      )}

      {video.reviewFeedback && (
        <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-xs text-amber-900">
          Founder remarks: {video.reviewFeedback}
        </p>
      )}

      {/* Review actions */}
      <div className="mt-3 flex flex-wrap gap-2">
        {reviewable && (
          <>
            <Button
              size="sm"
              disabled={pending}
              onClick={() => run(() => reviewGeneratedVideo({ videoId: video.id, decision: "approve" }))}
            >
              <Check className="mr-1 h-3.5 w-3.5" /> Approve video
            </Button>
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => setShowFeedback("reject")}>
              <X className="mr-1 h-3.5 w-3.5" /> Reject video
            </Button>
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => setShowFeedback("edits")}>
              Request edits
            </Button>
          </>
        )}
        {video.status === "approved" && !video.calendarItemId && (
          <Button size="sm" disabled={pending} onClick={() => run(() => attachVideoToCalendar(video.id))}>
            <CalendarPlus className="mr-1 h-3.5 w-3.5" /> Mark ready for calendar
          </Button>
        )}
      </div>

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
            placeholder="Leave remarks on this video…"
            rows={2}
            className="w-full rounded-lg border border-brand-border bg-white px-2 py-1.5 text-xs"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                run(() =>
                  reviewGeneratedVideo({
                    videoId: video.id,
                    decision: showFeedback === "reject" ? "reject" : "request_edits",
                    feedbackCategory: category,
                    note,
                  })
                )
              }
            >
              {showFeedback === "reject" ? "Reject with reason" : "Send edits to Bloom"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowFeedback(null)}>Cancel</Button>
          </div>
        </div>
      )}

      {message && <p className="mt-2 text-xs text-brand-muted">{message}</p>}
    </div>
  );
}
