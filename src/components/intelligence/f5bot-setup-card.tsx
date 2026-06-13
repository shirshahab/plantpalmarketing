"use client";

import { useCallback, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface F5BotSetupStatus {
  apiTokenSet: boolean;
  jsonFeedSet: boolean;
  rssFeedSet: boolean;
  cronSecretSet: boolean;
  webhookSecretSet: boolean;
  f5botEnabled: boolean;
  productionWebhookUrl: string;
  localWebhookUrl: string;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }, [value]);

  return (
    <Button type="button" size="sm" variant="secondary" onClick={copy} className="shrink-0">
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : label}
    </Button>
  );
}

function StatusRow({ label, set }: { label: string; set: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <span className="text-brand-muted">{label}</span>
      <Badge variant={set ? "success" : "muted"}>{set ? "set" : "not set"}</Badge>
    </div>
  );
}

export function F5BotSetupCard({ status }: { status: F5BotSetupStatus }) {
  const [showTechnical, setShowTechnical] = useState(false);
  const [showUrls, setShowUrls] = useState(false);

  return (
    <div className="mb-6 rounded-2xl border border-brand-border bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-sm font-semibold text-brand-primary">F5Bot setup</h2>
          <p className="mt-0.5 text-xs text-brand-muted">
            Secrets stay server-side. Only connection status is shown here.
          </p>
        </div>
        <Badge variant={status.f5botEnabled && status.jsonFeedSet ? "success" : "warning"}>
          {status.f5botEnabled && status.jsonFeedSet ? "Feed ready" : "Needs configuration"}
        </Badge>
      </div>

      <div className="mt-4 space-y-2 rounded-xl border border-brand-border/60 bg-brand-bg/40 p-3">
        <StatusRow label="F5BOT_ENABLED" set={status.f5botEnabled} />
        <StatusRow label="JSON feed URL" set={status.jsonFeedSet} />
        <StatusRow label="RSS feed URL" set={status.rssFeedSet} />
        <StatusRow label="API token" set={status.apiTokenSet} />
        <StatusRow label="Cron secret" set={status.cronSecretSet} />
        <StatusRow label="Webhook secret" set={status.webhookSecretSet} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={() => setShowTechnical((v) => !v)}>
          {showTechnical ? "Hide technical setup" : "Show technical setup"}
        </Button>
      </div>

      {showTechnical && (
        <div className="mt-3 space-y-3 border-t border-brand-border/60 pt-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-brand-primary">Production webhook</p>
              {!showUrls && <p className="text-[11px] text-brand-muted">URL hidden until expanded.</p>}
            </div>
            <CopyButton value={status.productionWebhookUrl} label="Copy URL" />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-brand-primary">Local webhook</p>
              {!showUrls && <p className="text-[11px] text-brand-muted">Use when testing on localhost.</p>}
            </div>
            <CopyButton value={status.localWebhookUrl} label="Copy URL" />
          </div>

          <Button type="button" size="sm" variant="secondary" onClick={() => setShowUrls((v) => !v)}>
            {showUrls ? "Hide URLs" : "Show URLs"}
          </Button>

          {showUrls && (
            <div className="space-y-2">
              <UrlBlock label="Production" url={status.productionWebhookUrl} />
              <UrlBlock label="Local" url={status.localWebhookUrl} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UrlBlock({ label, url }: { label: string; url: string }) {
  return (
    <div className="min-w-0 max-w-full">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-brand-muted">{label}</p>
      <code
        className={cn(
          "block w-full max-w-full overflow-x-auto rounded-lg bg-slate-950 px-3 py-2 text-[11px] leading-relaxed text-slate-100",
          "break-all [overflow-wrap:anywhere]"
        )}
      >
        {url}
      </code>
    </div>
  );
}
