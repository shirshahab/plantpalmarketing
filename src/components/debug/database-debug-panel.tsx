import Link from "next/link";
import type { DatabaseTableCheck, HQProbeResult } from "@/lib/db/hq-debug";
import { AGENT_ACTIVITY_LOG_FIX_SQL, HQ_DEMO_MODE_CONDITION } from "@/lib/db/hq-debug";

export function DatabaseDebugPanel({
  probe,
  checks,
}: {
  probe: HQProbeResult;
  checks: DatabaseTableCheck[];
}) {
  const requiredSteps = probe.steps.filter((s) =>
    ["scout_activity", "roots_activity", "scout_leads", "roots_opportunities", "roots_reply_drafts", "scout_partnerships"].includes(s.id)
  );

  return (
    <div className="space-y-8 p-4 sm:p-6">
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
        <h2 className="font-heading text-lg font-semibold text-rose-900">HQ demo mode — exact condition</h2>
        <p className="mt-2 text-sm text-rose-800 font-mono">{HQ_DEMO_MODE_CONDITION}</p>
        <p className="mt-3 text-sm text-rose-900">
          Source: <code className="rounded bg-white px-1">src/app/(dashboard)/page.tsx</code> lines 55–59
        </p>
        {!probe.configured && (
          <p className="mt-2 text-sm font-medium text-rose-900">Supabase is not configured — demo banner may also show ConfigBanner.</p>
        )}
        {probe.configured && (
          <p className="mt-2 text-sm font-medium text-rose-900">{probe.summary}</p>
        )}
        {probe.failedStep && (
          <div className="mt-4 rounded-xl border border-rose-300 bg-white p-4 text-sm">
            <p><strong>First required failure:</strong> {probe.failedStep.label}</p>
            <p><strong>Table:</strong> {probe.failedStep.table}</p>
            <p><strong>Error code:</strong> {probe.failedStep.errorCode ?? "—"}</p>
            <p><strong>Error:</strong> {probe.failedStep.errorMessage ?? "—"}</p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-brand-border bg-white p-5">
        <h2 className="font-heading text-lg font-semibold text-brand-primary">HQ live-mode probes</h2>
        <p className="mt-1 text-sm text-brand-muted">Mirrors getHQAgentData() — required steps must pass or demo mode activates.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs text-brand-muted">
                <th className="pb-2 pr-3">Required</th>
                <th className="pb-2 pr-3">Area</th>
                <th className="pb-2 pr-3">Query</th>
                <th className="pb-2 pr-3">Table</th>
                <th className="pb-2 pr-3">OK</th>
                <th className="pb-2 pr-3">Rows</th>
                <th className="pb-2">Error</th>
              </tr>
            </thead>
            <tbody>
              {probe.steps.map((s) => {
                const required = requiredSteps.some((r) => r.id === s.id);
                return (
                  <tr key={s.id} className={`border-b border-brand-border/50 ${!s.ok ? "bg-rose-50/50" : ""}`}>
                    <td className="py-2 pr-3">{required ? "YES" : "no"}</td>
                    <td className="py-2 pr-3">{s.area}</td>
                    <td className="py-2 pr-3 max-w-xs">{s.label}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{s.table}</td>
                    <td className={`py-2 pr-3 font-medium ${s.ok ? "text-emerald-700" : "text-rose-700"}`}>
                      {s.ok ? "yes" : "NO"}
                    </td>
                    <td className="py-2 pr-3">{s.rowCount ?? "—"}</td>
                    <td className="py-2 text-xs text-rose-700 max-w-md truncate" title={s.errorMessage ?? ""}>
                      {s.errorCode ? `${s.errorCode}: ` : ""}{s.errorMessage ?? ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-border bg-white p-5">
        <h2 className="font-heading text-lg font-semibold text-brand-primary">Table health checks</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs text-brand-muted">
                <th className="pb-2 pr-3">Area</th>
                <th className="pb-2 pr-3">Table</th>
                <th className="pb-2 pr-3">Exists</th>
                <th className="pb-2 pr-3">Rows</th>
                <th className="pb-2 pr-3">Columns OK</th>
                <th className="pb-2 pr-3">Missing</th>
                <th className="pb-2">Error</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((c) => (
                <tr key={`${c.area}-${c.tableName}`} className={`border-b border-brand-border/50 ${!c.queryOk ? "bg-amber-50/50" : ""}`}>
                  <td className="py-2 pr-3">{c.area}</td>
                  <td className="py-2 pr-3 font-mono text-xs">{c.tableName}</td>
                  <td className={`py-2 pr-3 ${c.exists ? "text-emerald-700" : "text-rose-700"}`}>{c.exists ? "yes" : "NO"}</td>
                  <td className="py-2 pr-3">{c.rowCount ?? "—"}</td>
                  <td className={`py-2 pr-3 ${c.columnsPresent ? "text-emerald-700" : "text-rose-700"}`}>
                    {c.columnsPresent ? "yes" : "NO"}
                  </td>
                  <td className="py-2 pr-3 text-xs">{c.missingColumns.join(", ") || "—"}</td>
                  <td className="py-2 text-xs text-rose-700 max-w-md truncate" title={c.errorMessage ?? ""}>
                    {c.errorCode ? `${c.errorCode}: ` : ""}{c.errorMessage ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <h2 className="font-heading text-lg font-semibold text-emerald-900">SQL fix (paste into Supabase SQL Editor)</h2>
        <p className="mt-1 text-sm text-emerald-800">
          Live probe against your project confirmed <code className="rounded bg-white px-1">agent_activity_log</code> is missing (PGRST205).
          Scout/Roots/Sentinel data tables otherwise respond OK.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-emerald-300 bg-white p-4 text-xs leading-relaxed">{AGENT_ACTIVITY_LOG_FIX_SQL}</pre>
      </div>

      <p className="text-sm text-brand-muted">
        <Link href="/" className="text-brand-primary underline">← Back to HQ</Link>
      </p>
    </div>
  );
}
