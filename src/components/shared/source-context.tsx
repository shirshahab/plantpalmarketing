import { ExternalLink, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Phase 33 — source context for reply/opportunity/approval cards.
 * Shows a Demo Data / Live badge plus Open Original / View Author buttons.
 * Never pretend fake data is live.
 */

const LIVE_LABEL: Record<string, string> = {
  reddit: "Live Reddit",
  x: "Live X",
  twitter: "Live X",
  youtube: "Live YouTube",
  facebook: "Live Facebook",
  threads: "Live Threads",
  instagram: "Live Instagram",
  tiktok: "Live TikTok",
};

export function DataSourceBadge({
  dataSource,
  platform,
}: {
  dataSource?: string;
  platform?: string;
}) {
  const src = (dataSource ?? "").toLowerCase();
  if (src === "demo" || src === "seed") {
    return <Badge variant="warning">Demo Data</Badge>;
  }
  if (src === "live_api") {
    const label = LIVE_LABEL[(platform ?? "").toLowerCase()] ?? "Live";
    return <Badge variant="success">{label}</Badge>;
  }
  if (src === "imported") return <Badge variant="info">Imported</Badge>;
  if (src === "manual") return <Badge variant="muted">Manual</Badge>;
  return null;
}

export function SourceContext({
  dataSource,
  sourcePlatform,
  sourceUrl,
  sourceAuthor,
  sourceAuthorUrl,
  sourceTitle,
  sourceExcerpt,
}: {
  dataSource?: string;
  sourcePlatform?: string;
  sourceUrl?: string;
  sourceAuthor?: string;
  sourceAuthorUrl?: string;
  sourceTitle?: string;
  sourceExcerpt?: string;
}) {
  const isDemo = dataSource === "demo" || dataSource === "seed";
  const hasContext = Boolean(sourceUrl || sourceAuthor || sourceTitle || sourceExcerpt || isDemo);
  if (!hasContext) return null;

  return (
    <div className="mt-2 rounded-xl border border-brand-border/40 bg-brand-bg/40 p-2.5">
      {isDemo && (
        <p className="text-[11px] text-amber-700">
          Demo Data. Connect API to use real conversations.
        </p>
      )}
      {(sourceTitle || sourceAuthor) && (
        <p className="mt-0.5 text-[11px] text-brand-muted">
          {sourceTitle && <span className="font-medium text-brand-primary">{sourceTitle}</span>}
          {sourceTitle && sourceAuthor && " · "}
          {sourceAuthor && <span>by {sourceAuthor}</span>}
          {sourcePlatform && <span> on {sourcePlatform}</span>}
        </p>
      )}
      {sourceExcerpt && (
        <p className="mt-1 line-clamp-2 text-[11px] italic text-brand-muted">“{sourceExcerpt}”</p>
      )}
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-brand-border bg-white px-2 py-1 text-[11px] font-medium text-brand-primary hover:bg-brand-bg"
          >
            <ExternalLink className="h-3 w-3" />
            Open Original
          </a>
        ) : (
          <span
            className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-brand-border/50 bg-brand-bg/60 px-2 py-1 text-[11px] text-brand-muted"
            title="No source link available."
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
            View Author
          </a>
        )}
      </div>
    </div>
  );
}
