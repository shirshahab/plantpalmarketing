"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { CheckCircle2, RefreshCw, XCircle, AlertTriangle, Radar, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { F5BotIngestResult } from "@/lib/intelligence/f5bot-ingest";
import type { F5BotTestResponse } from "@/lib/intelligence/f5bot-test";

const STATUS_META = {
  connected: { label: "Connected", variant: "success" as const, Icon: CheckCircle2, tone: "text-emerald-600" },
  disabled: { label: "Disabled", variant: "muted" as const, Icon: AlertTriangle, tone: "text-slate-500" },
  misconfigured: { label: "Misconfigured", variant: "warning" as const, Icon: AlertTriangle, tone: "text-amber-600" },
  error: { label: "Error", variant: "danger" as const, Icon: XCircle, tone: "text-red-600" },
};

const PRIORITY_VARIANT: Record<string, "success" | "warning" | "danger" | "info" | "muted"> = {
  high: "warning",
  medium: "info",
  low: "muted",
};

const CLASSIFICATION_LABELS: Record<string, string> = {
  community_opportunity: "Community",
  content_idea: "Content idea",
  seo_topic: "SEO topic",
  competitor_alert: "Competitor",
  creator_opportunity: "Creator",
  product_feedback: "Product feedback",
  ignore: "Ignore",
};

export function F5BotTestPanel() {
  const [result, setResult] = useState<F5BotTestResponse | null>(null);
  const [ingestResult, setIngestResult] = useState<F5BotIngestResult | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [ingestError, setIngestError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [ingestPending, startIngestTransition] = useTransition();

  const runTest = useCallback(() => {
    setFetchError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/intelligence/f5bot/test", { method: "POST", cache: "no-store" });
        const data = (await res.json()) as F5BotTestResponse;
        setResult(data);
        if (!res.ok && !data.error) {
          setFetchError(`Request failed with HTTP ${res.status}`);
        }
      } catch (e) {
        setResult(null);
        setFetchError(e instanceof Error ? e.message : "Request failed");
      }
    });
  }, []);

  const runIngest = useCallback(() => {
    setIngestError(null);
    startIngestTransition(async () => {
      try {
        const res = await fetch("/api/intelligence/f5bot/ingest", { method: "POST", cache: "no-store" });
        const data = (await res.json()) as F5BotIngestResult;
        setIngestResult(data);
        if (!res.ok && data.error) {
          setIngestError(data.error);
        } else if (!res.ok) {
          setIngestError(`Ingest failed with HTTP ${res.status}`);
        }
      } catch (e) {
        setIngestResult(null);
        setIngestError(e instanceof Error ? e.message : "Ingest failed");
      }
    });
  }, []);

  useEffect(() => {
    runTest();
  }, [runTest]);

  const status = result?.connectionStatus ?? "error";
  const meta = STATUS_META[status];
  const StatusIcon = meta.Icon;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand-border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/8 text-brand-primary">
              <Radar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-primary">F5Bot JSON feed test</p>
              <p className="text-xs text-brand-muted">Phase 1 test · Phase 2 ingest · Phase 3 classifications</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={pending} onClick={runTest}>
              <RefreshCw className={`h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`} />
              {pending ? "Refreshing…" : "Refresh F5Bot Feed"}
            </Button>
            <Button size="sm" variant="success" disabled={ingestPending} onClick={runIngest}>
              <Database className="h-3.5 w-3.5" />
              {ingestPending ? "Saving…" : "Save Alerts to Supabase"}
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Connection" value={meta.label} />
          <Stat label="Total alerts" value={result ? String(result.totalAlerts) : pending ? "…" : "—"} />
          <Stat
            label="Last checked"
            value={result?.checkedAt ? formatDate(result.checkedAt) : pending ? "…" : "—"}
          />
          <Stat label="F5BOT_ENABLED" value={result?.enabled ? "true" : result ? "false" : "—"} />
        </div>

        {result && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusIcon className={`h-4 w-4 ${meta.tone}`} />
            <Badge variant={meta.variant}>{meta.label}</Badge>
            <Badge variant={result.feedUrlConfigured ? "success" : "danger"}>
              JSON feed URL {result.feedUrlConfigured ? "configured" : "missing"}
            </Badge>
            {result.httpStatus && <Badge variant="danger">HTTP {result.httpStatus}</Badge>}
          </div>
        )}

        {(result?.error || fetchError) && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {result?.error ?? fetchError}
          </div>
        )}

        {ingestResult && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <p className="font-semibold">Ingest complete</p>
            <ul className="mt-1 space-y-0.5 text-xs">
              <li>From feed: {ingestResult.totalFromFeed}</li>
              <li>Inserted: {ingestResult.inserted}</li>
              <li>Skipped duplicates: {ingestResult.skippedDuplicates}</li>
            </ul>
            {ingestResult.errors.length > 0 && (
              <p className="mt-2 text-xs text-amber-800">
                {ingestResult.errors.length} error(s): {ingestResult.errors.slice(0, 3).join("; ")}
              </p>
            )}
            {ingestResult.inserted > 0 && (
              <a href="/intelligence" className="mt-2 inline-block text-xs font-medium underline">
                View saved alerts →
              </a>
            )}
          </div>
        )}

        {ingestError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {ingestError}
          </div>
        )}
      </div>

      {result?.ok && result.alerts.length > 0 && (
        <div className="rounded-2xl border border-brand-border bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-brand-primary">
            First {result.alerts.length} alert{result.alerts.length === 1 ? "" : "s"}
            {result.totalAlerts > result.alerts.length && (
              <span className="ml-1 font-normal text-brand-muted">of {result.totalAlerts} total</span>
            )}
          </h2>
          <div className="space-y-2">
            {result.alerts.map((alert, i) => (
              <div
                key={`${alert.url}-${i}`}
                className="rounded-xl border border-brand-border/60 bg-brand-bg/30 px-4 py-3"
              >
                <p className="text-sm font-medium text-brand-primary">{alert.title}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant="info">{CLASSIFICATION_LABELS[alert.classification] ?? alert.classification}</Badge>
                  <Badge variant={PRIORITY_VARIANT[alert.priority] ?? "muted"}>{alert.priority}</Badge>
                  {alert.assignedAgent ? (
                    <Badge variant="success" className="capitalize">
                      → {alert.assignedAgent}
                    </Badge>
                  ) : (
                    <Badge variant="muted">no agent</Badge>
                  )}
                </div>
                <p className="mt-2 text-xs text-brand-muted">{alert.reason}</p>
                {alert.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {alert.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-brand-primary/8 px-1.5 py-0.5 text-[10px] font-medium text-brand-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-brand-muted">
                  <Badge variant="muted">{alert.source}</Badge>
                  {alert.date && <span>{formatDate(alert.date)}</span>}
                </div>
                {alert.url ? (
                  <a
                    href={alert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block break-all text-xs text-brand-accent underline"
                  >
                    {alert.url}
                  </a>
                ) : (
                  <p className="mt-2 text-xs text-amber-700">No URL on this alert</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {result?.ok && result.totalAlerts === 0 && (
        <div className="rounded-2xl border border-brand-border bg-white p-4 text-sm text-brand-muted">
          Feed connected successfully but returned zero alerts.
        </div>
      )}

      {result?.rawPreview && (
        <div className="rounded-2xl border border-brand-border bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-brand-primary">Raw JSON preview</h2>
          <p className="mb-3 text-xs text-brand-muted">First 10 parsed alert objects from the feed.</p>
          <pre className="max-h-[480px] overflow-auto rounded-xl bg-slate-950 p-4 text-[11px] leading-relaxed text-slate-100">
            {result.rawPreview}
          </pre>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-brand-border/60 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-brand-primary">{value}</p>
    </div>
  );
}
