"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { shouldShowDemoData } from "@/lib/demo/shouldShowDemoData";
import { formatDate } from "@/lib/utils";

/**
 * Phase 34 — full source attribution block for opportunities and replies.
 * Open Original Post / Open Author / Copy Link, plus platform, title,
 * subreddit, post date and engagement metrics. Demo rows get a DEMO badge
 * and never show fake links.
 */

const ENGAGEMENT_LABELS: Record<string, string> = {
  upvotes: "upvotes",
  score: "points",
  comments: "comments",
  replies: "replies",
  likes: "likes",
  views: "views",
  shares: "shares",
};

export function SourceLinks({
  sourceUrl,
  sourceAuthor,
  sourceAuthorUrl,
  sourcePlatform,
  sourceTitle,
  sourceSubreddit,
  sourceCreatedAt,
  engagement,
  dataSource,
  compact = false,
}: {
  sourceUrl?: string;
  sourceAuthor?: string;
  sourceAuthorUrl?: string;
  sourcePlatform?: string;
  sourceTitle?: string;
  sourceSubreddit?: string;
  sourceCreatedAt?: string | null;
  engagement?: Record<string, number>;
  dataSource?: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const isDemo = shouldShowDemoData() && (dataSource === "demo" || dataSource === "seed");
  const engagementEntries = Object.entries(engagement ?? {}).filter(
    ([, value]) => typeof value === "number" && value > 0
  );

  async function copyLink() {
    if (!sourceUrl) return;
    try {
      await navigator.clipboard.writeText(sourceUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <div className={compact ? "mt-2" : "mt-2 rounded-xl border border-brand-border/40 bg-brand-bg/40 p-2.5"}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-brand-muted">
        {isDemo && <Badge variant="warning">DEMO</Badge>}
        {dataSource === "f5bot" && <Badge variant="success">Live F5Bot Source</Badge>}
        {sourceTitle && <span className="font-medium text-brand-primary">{sourceTitle}</span>}
        {sourceAuthor && <span>by {sourceAuthor}</span>}
        {sourceSubreddit && <span>in r/{sourceSubreddit.replace(/^r\//, "")}</span>}
        {sourcePlatform && <span>on {sourcePlatform}</span>}
        {sourceCreatedAt && <span>· {formatDate(sourceCreatedAt)}</span>}
        {engagementEntries.map(([key, value]) => (
          <span key={key} className="rounded-full bg-white px-1.5 py-px text-[10px] font-medium text-brand-primary">
            {value} {ENGAGEMENT_LABELS[key] ?? key}
          </span>
        ))}
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        {sourceUrl ? (
          <>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-brand-border bg-white px-2 py-1 text-[11px] font-medium text-brand-primary hover:bg-brand-bg"
            >
              <ExternalLink className="h-3 w-3" />
              Open Original Post
            </a>
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-1 rounded-lg border border-brand-border bg-white px-2 py-1 text-[11px] font-medium text-brand-primary hover:bg-brand-bg"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy Link"}
            </button>
          </>
        ) : (
          <span
            className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-brand-border/50 bg-brand-bg/60 px-2 py-1 text-[11px] text-brand-muted"
            title="No source link available — this is demo data."
          >
            <ExternalLink className="h-3 w-3" />
            No source link available
          </span>
        )}
        {sourceAuthorUrl && (
          <a
            href={sourceAuthorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-brand-border bg-white px-2 py-1 text-[11px] font-medium text-brand-primary hover:bg-brand-bg"
          >
            <User className="h-3 w-3" />
            Open Author
          </a>
        )}
      </div>
    </div>
  );
}
