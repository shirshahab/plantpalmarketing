import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { SystemPipelineStatus } from "@/lib/pipeline/system-health";
import { formatDate } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  healthy: "border-emerald-200 bg-emerald-50",
  stalled: "border-amber-200 bg-amber-50",
  broken: "border-rose-200 bg-rose-50",
};

const STATUS_BADGE: Record<string, "success" | "warning" | "danger"> = {
  healthy: "success",
  stalled: "warning",
  broken: "danger",
};

export function SystemHealthPanel({ pipelines }: { pipelines: SystemPipelineStatus[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {pipelines.map((p) => (
        <div key={p.id} className={`rounded-2xl border p-5 ${STATUS_STYLE[p.status] ?? STATUS_STYLE.stalled}`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-heading font-semibold text-brand-primary">{p.label}</h3>
              <p className="mt-0.5 text-xs text-brand-muted">{p.flow}</p>
            </div>
            <Badge variant={STATUS_BADGE[p.status]}>{p.status}</Badge>
          </div>
          <dl className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-brand-muted">Records waiting</dt>
              <dd className="font-semibold tabular-nums text-brand-primary">{p.waiting}</dd>
            </div>
            {p.lastSuccess && (
              <div className="flex justify-between gap-4">
                <dt className="text-brand-muted">Last success</dt>
                <dd className="text-xs">{formatDate(p.lastSuccess)}</dd>
              </div>
            )}
            {p.lastFailure && (
              <div className="flex justify-between gap-4">
                <dt className="text-brand-muted">Last failure</dt>
                <dd className="text-xs">{formatDate(p.lastFailure)}</dd>
              </div>
            )}
            {p.failureReason && (
              <p className="pt-1 text-xs text-rose-700">{p.failureReason}</p>
            )}
          </dl>
        </div>
      ))}

      <div className="md:col-span-2 rounded-2xl border border-brand-border bg-white p-4 text-sm text-brand-muted">
        Quick links:{" "}
        <Link href="/agent-operations" className="text-brand-accent underline">Agent Operations</Link>
        {" · "}
        <Link href="/intelligence" className="text-brand-accent underline">Intelligence</Link>
        {" · "}
        <Link href="/admin/setup-health" className="text-brand-accent underline">Setup Health</Link>
      </div>
    </div>
  );
}
