"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Clipboard,
  ExternalLink,
  Hash,
  History,
  Image as ImageIcon,
  Link2,
  Rocket,
  StickyNote,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  markCalendarItemPosted,
  publishCalendarItemToX,
  saveCalendarItemNotes,
  saveCalendarItemPublishedUrl,
  updateCalendarItemStatus,
} from "@/lib/actions/content-calendar";
import type {
  CalendarStatus,
  ContentAsset,
  ContentCalendarItem,
  ContentPublishLog,
} from "@/lib/types";
import {
  ALL_STATUSES,
  STATUS_META,
  getPlatformMeta,
  getStatusMeta,
  buildCopyAll,
  extractHashtags,
  formatFullDate,
  itemNeedsAsset,
} from "./calendar-utils";

function CopyButton({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={!text}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
      {copied ? "Copied" : label}
    </Button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-brand-muted">{title}</h4>
      {children}
    </div>
  );
}

interface ApprovalHistoryEntry {
  stage?: string;
  status?: string;
  at?: string;
}

export function CalendarItemDrawer({
  item,
  assets,
  publishLogs,
  xPublishConfigured,
  onClose,
}: {
  item: ContentCalendarItem;
  assets: ContentAsset[];
  publishLogs: ContentPublishLog[];
  xPublishConfigured: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState(item.notes);
  const [publishedUrl, setPublishedUrl] = useState(item.platformUrl);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setNotes(item.notes);
    setPublishedUrl(item.platformUrl);
    setFeedback(null);
  }, [item.id, item.notes, item.platformUrl]);

  const platform = getPlatformMeta(item.platform);
  const hashtags = extractHashtags(item);
  const meta = item.metadata ?? {};
  const script =
    (typeof meta.script === "string" && meta.script) ||
    (typeof meta.postBody === "string" && meta.postBody) ||
    (typeof meta.outline === "string" && meta.outline) ||
    "";
  const checklist = Array.isArray(meta.uploadChecklist) ? meta.uploadChecklist.map(String) : [];
  const approvalHistory: ApprovalHistoryEntry[] = Array.isArray(meta.approvalHistory)
    ? (meta.approvalHistory as ApprovalHistoryEntry[])
    : [];
  const itemLogs = useMemo(
    () => publishLogs.filter((l) => l.calendarItemId === item.id),
    [publishLogs, item.id]
  );
  const itemAssets = useMemo(
    () => assets.filter((a) => a.calendarItemId === item.id),
    [assets, item.id]
  );

  const canPublishToX =
    item.platform === "x" &&
    item.status === "ready_to_publish" &&
    item.sourceTable === "x_post_queue" &&
    xPublishConfigured;

  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) => {
    startTransition(async () => {
      const result = await fn();
      setFeedback(result.ok ? result.message ?? "Saved" : `Error: ${"error" in result ? result.error : ""}`);
      router.refresh();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Close drawer"
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-brand-border bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-brand-border bg-white/95 px-6 py-4 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{ color: platform.color, backgroundColor: platform.bg }}
                >
                  {platform.label}
                </span>
                <Badge variant={getStatusMeta(item.status).badge}>{getStatusMeta(item.status).label}</Badge>
                <Badge variant={item.approvalStatus === "approved" ? "success" : item.approvalStatus === "rejected" ? "danger" : "muted"}>
                  {(item.approvalStatus ?? "pending").replace("_", " ")}
                </Badge>
              </div>
              <h3 className="truncate font-heading text-lg font-semibold text-brand-primary">
                {item.title || item.hook || "Untitled"}
              </h3>
              <p className="text-xs text-brand-muted">
                {formatFullDate(item.scheduledFor)} · {item.channel || platform.label} · by {item.sourceAgent}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-brand-muted transition-colors hover:bg-brand-bg hover:text-brand-primary"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {feedback && (
            <p className={`mt-2 text-xs ${feedback.startsWith("Error") ? "text-red-600" : "text-brand-primary"}`}>
              {feedback}
            </p>
          )}
        </div>

        <div className="flex-1 space-y-6 px-6 py-5">
          {/* Copy actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton label="Copy caption" text={item.caption} />
            <CopyButton label="Copy hashtags" text={hashtags.join(" ")} />
            <CopyButton label="Copy all" text={buildCopyAll(item)} />
            {platform.url && (
              <a href={item.platformUrl || platform.url} target="_blank" rel="noreferrer">
                <Button variant="secondary" size="sm">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open {platform.label}
                </Button>
              </a>
            )}
          </div>

          {/* Publish to X — only with tokens + full approval chain (Part 5) */}
          {item.platform === "x" && item.status === "ready_to_publish" && (
            <div className="rounded-xl border border-brand-border bg-brand-bg p-4">
              {canPublishToX ? (
                <>
                  <p className="mb-2 text-sm text-brand-muted">
                    Sage approved · Gate approved · Sprout queued. Publishing requires this final human click.
                  </p>
                  <Button
                    disabled={pending}
                    onClick={() => run(() => publishCalendarItemToX(item.id))}
                  >
                    <Rocket className="h-4 w-4" />
                    {pending ? "Publishing..." : "Publish to X"}
                  </Button>
                </>
              ) : (
                <p className="text-sm text-brand-muted">
                  {xPublishConfigured
                    ? "This item is not linked to the X publish queue — publish manually and mark as posted."
                    : "X publish tokens not configured (X_ACCESS_TOKEN / X_ACCESS_TOKEN_SECRET) — use manual copy/post, then mark as posted."}
                </p>
              )}
            </div>
          )}

          {/* Hook / Caption / CTA */}
          {item.hook && (
            <Section title="Hook">
              <p className="rounded-xl bg-brand-bg p-3 text-sm text-brand-primary">{item.hook}</p>
            </Section>
          )}
          <Section title="Full caption">
            <p className="whitespace-pre-wrap rounded-xl bg-brand-bg p-3 text-sm text-brand-primary">
              {item.caption || "No caption"}
            </p>
          </Section>
          {script && (
            <Section title="Script / body">
              <p className="whitespace-pre-wrap rounded-xl bg-brand-bg p-3 text-sm text-brand-primary">{script}</p>
            </Section>
          )}
          {item.cta && (
            <Section title="CTA">
              <p className="rounded-xl bg-brand-bg p-3 text-sm text-brand-primary">{item.cta}</p>
            </Section>
          )}
          {hashtags.length > 0 && (
            <Section title="Hashtags">
              <div className="flex flex-wrap gap-1.5">
                {hashtags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-0.5 rounded-full bg-brand-primary/10 px-2 py-0.5 text-xs text-brand-primary">
                    <Hash className="h-3 w-3" />
                    {tag.replace(/^#/, "")}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Upload checklist */}
          {checklist.length > 0 && (
            <Section title="Upload checklist">
              <ul className="space-y-1.5">
                {checklist.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-brand-primary">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" />
                    {step}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Assets */}
          <Section title="Assets">
            {itemNeedsAsset(item) && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Asset needed ({item.assetType}) — generate or upload before publishing.
              </p>
            )}
            {item.assetUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.assetUrl} alt="Asset" className="max-h-48 rounded-xl border border-brand-border object-cover" />
            )}
            {itemAssets.map((asset) => (
              <div key={asset.id} className="flex items-center gap-3 rounded-xl border border-brand-border p-3">
                {asset.thumbnailUrl || asset.assetUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.thumbnailUrl || asset.assetUrl} alt={asset.assetType} className="h-12 w-12 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-bg">
                    <ImageIcon className="h-5 w-5 text-brand-muted" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-brand-primary">{asset.assetType}</p>
                  {asset.assetPrompt && <p className="truncate text-xs text-brand-muted">{asset.assetPrompt}</p>}
                </div>
                <Badge variant={asset.status === "ready" || asset.status === "attached" ? "success" : "warning"}>
                  {asset.status}
                </Badge>
              </div>
            ))}
            {item.assetPrompt && (
              <div className="rounded-xl bg-brand-bg p-3">
                <p className="mb-1 text-xs font-medium text-brand-muted">Asset prompt</p>
                <p className="text-sm text-brand-primary">{item.assetPrompt}</p>
                <div className="mt-2">
                  <CopyButton label="Copy prompt" text={item.assetPrompt} />
                </div>
              </div>
            )}
            {!item.assetUrl && !item.assetPrompt && itemAssets.length === 0 && !itemNeedsAsset(item) && (
              <p className="text-sm text-brand-muted">No assets required.</p>
            )}
          </Section>

          {/* Status + mark posted */}
          <Section title="Status">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={item.status}
                disabled={pending}
                onChange={(e) => run(() => updateCalendarItemStatus(item.id, e.target.value as CalendarStatus))}
                className="rounded-lg border border-brand-border bg-white px-3 py-1.5 text-sm text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/40"
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </select>
              {item.status !== "published" && (
                <Button
                  variant="success"
                  size="sm"
                  disabled={pending}
                  onClick={() => run(() => markCalendarItemPosted(item.id, publishedUrl || undefined))}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark as posted
                </Button>
              )}
            </div>
          </Section>

          {/* Published URL */}
          <Section title="Published URL">
            <div className="flex gap-2">
              <input
                value={publishedUrl}
                onChange={(e) => setPublishedUrl(e.target.value)}
                placeholder="Paste the live post URL"
                className="flex-1 rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-primary placeholder:text-brand-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40"
              />
              <Button
                variant="secondary"
                size="sm"
                disabled={pending}
                onClick={() => run(() => saveCalendarItemPublishedUrl(item.id, publishedUrl))}
              >
                <Link2 className="h-3.5 w-3.5" />
                Save
              </Button>
            </div>
            {item.platformUrl && (
              <a
                href={item.platformUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-brand-primary underline"
              >
                <ExternalLink className="h-3 w-3" />
                {item.platformUrl}
              </a>
            )}
          </Section>

          {/* Notes */}
          <Section title="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Internal notes about this post"
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-primary placeholder:text-brand-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40"
            />
            <Button
              variant="secondary"
              size="sm"
              disabled={pending || notes === item.notes}
              onClick={() => run(() => saveCalendarItemNotes(item.id, notes))}
            >
              <StickyNote className="h-3.5 w-3.5" />
              Save notes
            </Button>
          </Section>

          {/* Approval history + publish log */}
          <Section title="Approval history">
            {approvalHistory.length === 0 && itemLogs.length === 0 ? (
              <p className="text-sm text-brand-muted">No history yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {approvalHistory.map((entry, i) => (
                  <li key={`h-${i}`} className="flex items-center gap-2 text-sm text-brand-primary">
                    <History className="h-3.5 w-3.5 text-brand-muted" />
                    <span className="font-medium capitalize">{entry.stage ?? "stage"}</span>
                    <span className="text-brand-muted">{entry.status ?? ""}</span>
                    {entry.at && (
                      <span className="text-xs text-brand-muted">
                        {new Date(entry.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </span>
                    )}
                  </li>
                ))}
                {itemLogs.map((log) => (
                  <li key={log.id} className="flex items-center gap-2 text-sm text-brand-primary">
                    <History className="h-3.5 w-3.5 text-brand-muted" />
                    <span className="font-medium">{log.status.replace("_", " ")}</span>
                    {log.publishedUrl && <span className="truncate text-xs text-brand-muted">{log.publishedUrl}</span>}
                    {log.errorMessage && <span className="truncate text-xs text-red-600">{log.errorMessage}</span>}
                    <span className="text-xs text-brand-muted">
                      {new Date(log.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </aside>
    </div>
  );
}
