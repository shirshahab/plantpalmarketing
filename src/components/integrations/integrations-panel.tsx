"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2, AlertCircle, HelpCircle, KeyRound, Loader2, Plug, RefreshCw, XCircle, WifiOff, Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import {
  runAllIntegrationHealthChecks,
  testIntegrationConnection,
} from "@/lib/actions/integrations";
import type { IntegrationLog, IntegrationProvider } from "@/lib/types";
import type { IntegrationViewStatus } from "@/lib/integrations/types";

interface ProviderView {
  provider: IntegrationProvider;
  label: string;
  description: string;
  envVars: string[];
  uses: string[];
  status: IntegrationViewStatus;
  configured: boolean;
  loggingAvailable: boolean;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastErrorMessage: string;
  lastHealthCheckAt: string | null;
  xReadConnected?: boolean;
  xPublishConnected?: boolean;
  xMissingPublishVars?: string[];
  openaiKeyPresent?: boolean;
  openaiKeyInvalid?: boolean;
}

function StatusIcon({ status }: { status: IntegrationViewStatus }) {
  if (status === "connected") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (status === "degraded") return <AlertCircle className="h-4 w-4 text-amber-500" />;
  if (status === "error") return <XCircle className="h-4 w-4 text-rose-500" />;
  if (status === "missing_key") return <KeyRound className="h-4 w-4 text-amber-500" />;
  if (status === "not_configured") return <WifiOff className="h-4 w-4 text-brand-muted" />;
  if (status === "logging_unavailable") return <Database className="h-4 w-4 text-sky-500" />;
  return <HelpCircle className="h-4 w-4 text-brand-muted" />;
}

const STATUS_LABELS: Record<IntegrationViewStatus, string> = {
  connected: "Connected",
  degraded: "Degraded",
  error: "Error",
  missing_key: "Missing key",
  not_configured: "Not configured",
  logging_unavailable: "Logging unavailable",
  unknown: "Unknown",
};

export function IntegrationsPanel({
  statuses,
  logs,
}: {
  statuses: ProviderView[];
  logs: IntegrationLog[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [testing, setTesting] = useState<IntegrationProvider | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const connected = statuses.filter((s) => s.status === "connected").length;
  const configured = statuses.filter((s) => s.configured).length;
  const errors = statuses.filter((s) => s.status === "error").length;

  function handleTestAll() {
    setMessage(null);
    startTransition(async () => {
      const res = await runAllIntegrationHealthChecks();
      setMessage(res.ok ? res.message : res.error);
      router.refresh();
    });
  }

  function handleTestOne(provider: IntegrationProvider) {
    setMessage(null);
    setTesting(provider);
    startTransition(async () => {
      const res = await testIntegrationConnection(provider);
      setMessage(res.ok ? `${provider}: ${res.message}` : res.error);
      setTesting(null);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-sky-200/60 bg-gradient-to-br from-sky-50 to-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white">
              <Plug className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-brand-primary">Integrations Layer</h2>
              <p className="text-sm text-brand-muted">
                All API calls are server-side. Secrets never exposed to the client.
              </p>
            </div>
          </div>
          <Button disabled={pending} onClick={handleTestAll}>
            {pending && !testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Test All Connections
          </Button>
        </div>
        {message && <p className="mt-3 text-sm text-brand-primary">{message}</p>}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Configured" value={configured} icon={Plug} />
        <StatCard label="Connected" value={connected} icon={CheckCircle2} />
        <StatCard label="Errors" value={errors} icon={AlertCircle} />
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        {statuses.map((s) => (
          <div
            key={s.provider}
            className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <StatusIcon status={s.status} />
                  <h3 className="font-heading font-semibold text-brand-primary">{s.label}</h3>
                </div>
                <p className="mt-1 text-sm text-brand-muted">{s.description}</p>
              </div>
              <span className="shrink-0 rounded-full bg-brand-bg px-2.5 py-1 text-xs font-medium text-brand-muted">
                {STATUS_LABELS[s.status] ?? "Unknown"}
              </span>
            </div>

            {s.status === "logging_unavailable" && (
              <p className="mt-3 rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs text-sky-900">
                Logging not ready yet — status history is unavailable, but the API key may be fine.
                Use Test Connection to check it directly.
              </p>
            )}
            {s.status === "unknown" && (
              <p className="mt-3 rounded-lg bg-brand-bg px-2.5 py-1.5 text-xs text-brand-muted">
                Key present but not tested yet — run Test Connection.
              </p>
            )}

            <div className="mt-4 space-y-2 text-xs text-brand-muted">
              {s.provider === "openai" && (
                <div className="space-y-1.5 rounded-lg border border-brand-border/50 bg-brand-bg/40 p-2.5">
                  <p className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${s.openaiKeyPresent ? "bg-emerald-500" : "bg-rose-400"}`}
                    />
                    <span className="font-medium text-brand-primary">API key</span>
                    <span>{s.openaiKeyPresent ? "Present" : "Missing OPENAI_API_KEY"}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        !s.openaiKeyPresent ? "bg-rose-400" : s.openaiKeyInvalid ? "bg-rose-400" : "bg-emerald-500"
                      }`}
                    />
                    <span className="font-medium text-brand-primary">Key validity</span>
                    <span>
                      {!s.openaiKeyPresent
                        ? "Add the key, then test"
                        : s.openaiKeyInvalid
                          ? "Invalid — last call returned 401. Update OPENAI_API_KEY in Vercel."
                          : "No auth errors on the latest calls"}
                    </span>
                  </p>
                </div>
              )}
              {s.provider === "x" && (
                <div className="space-y-1.5 rounded-lg border border-brand-border/50 bg-brand-bg/40 p-2.5">
                  <p className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${s.xReadConnected ? "bg-emerald-500" : "bg-rose-400"}`}
                    />
                    <span className="font-medium text-brand-primary">Read access</span>
                    <span>{s.xReadConnected ? "Connected" : "Missing X_BEARER_TOKEN"}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${s.xPublishConnected ? "bg-emerald-500" : "bg-amber-400"}`}
                    />
                    <span className="font-medium text-brand-primary">Publish access</span>
                    <span>
                      {s.xPublishConnected
                        ? "Connected"
                        : `Missing ${(s.xMissingPublishVars ?? ["X_ACCESS_TOKEN", "X_ACCESS_TOKEN_SECRET"]).join(", ")}`}
                    </span>
                  </p>
                </div>
              )}
              <p>
                <span className="font-medium text-brand-primary">Env:</span>{" "}
                {s.envVars.join(", ")}
              </p>
              {s.lastSuccessAt && (
                <p>
                  Last success:{" "}
                  {formatDistanceToNow(new Date(s.lastSuccessAt), { addSuffix: true })}
                </p>
              )}
              {s.lastErrorMessage && (
                <p className="text-rose-700">Last error: {s.lastErrorMessage}</p>
              )}
              <p className="text-brand-muted/80">Used by: {s.uses.join(" · ")}</p>
            </div>

            <Button
              className="mt-4"
              variant="secondary"
              size="sm"
              disabled={pending && testing === s.provider}
              onClick={() => handleTestOne(s.provider)}
            >
              {pending && testing === s.provider ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Test Connection
            </Button>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-brand-border bg-white p-5">
        <h3 className="font-heading font-semibold text-brand-primary">Provider Logs</h3>
        <p className="mb-4 text-sm text-brand-muted">Recent API calls with rate limiting and retry audit trail</p>
        {logs.length === 0 ? (
          <p className="text-sm text-brand-muted">No integration logs yet. Run a health check to populate.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-border text-xs text-brand-muted">
                  <th className="pb-2 pr-4">Time</th>
                  <th className="pb-2 pr-4">Provider</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Message</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-brand-border/50">
                    <td className="py-2 pr-4 text-xs text-brand-muted whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </td>
                    <td className="py-2 pr-4 font-medium">{log.provider}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={
                          log.status === "success"
                            ? "text-emerald-600"
                            : log.status === "rate_limited"
                              ? "text-amber-600"
                              : "text-rose-600"
                        }
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2 text-xs text-brand-muted max-w-xs truncate">
                      {log.error || log.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
