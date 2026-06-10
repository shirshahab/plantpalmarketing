"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2, AlertCircle, Loader2, Plug, RefreshCw, XCircle, WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import {
  runAllIntegrationHealthChecks,
  testIntegrationConnection,
} from "@/lib/actions/integrations";
import type { IntegrationLog, IntegrationProvider, IntegrationStatus } from "@/lib/types";

interface ProviderView {
  provider: IntegrationProvider;
  label: string;
  description: string;
  envVars: string[];
  uses: string[];
  status: IntegrationStatus;
  configured: boolean;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastErrorMessage: string;
  lastHealthCheckAt: string | null;
}

function StatusIcon({ status, configured }: { status: IntegrationStatus; configured: boolean }) {
  if (!configured) return <WifiOff className="h-4 w-4 text-brand-muted" />;
  if (status === "connected") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (status === "degraded") return <AlertCircle className="h-4 w-4 text-amber-500" />;
  return <XCircle className="h-4 w-4 text-rose-500" />;
}

function statusLabel(status: IntegrationStatus, configured: boolean) {
  if (!configured) return "Not configured";
  if (status === "connected") return "Connected";
  if (status === "degraded") return "Degraded";
  if (status === "error") return "Error";
  return "Disconnected";
}

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
                  <StatusIcon status={s.status} configured={s.configured} />
                  <h3 className="font-heading font-semibold text-brand-primary">{s.label}</h3>
                </div>
                <p className="mt-1 text-sm text-brand-muted">{s.description}</p>
              </div>
              <span className="shrink-0 rounded-full bg-brand-bg px-2.5 py-1 text-xs font-medium text-brand-muted">
                {statusLabel(s.status, s.configured)}
              </span>
            </div>

            <div className="mt-4 space-y-2 text-xs text-brand-muted">
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
