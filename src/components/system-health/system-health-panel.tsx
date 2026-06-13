import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DailyEngineButton } from "@/components/hq/daily-engine-button";
import type { SystemPipelineStatus } from "@/lib/pipeline/system-health";
import type { IntegrationTrafficLight } from "@/lib/pipeline/integration-traffic-lights";
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

const LIGHT_DOT: Record<string, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-400",
  red: "bg-rose-500",
};

export function SystemHealthPanel({
  pipelines,
  integrations = [],
}: {
  pipelines: SystemPipelineStatus[];
  integrations?: IntegrationTrafficLight[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {integrations.length > 0 && (
        <div className="md:col-span-2 rounded-2xl border border-brand-border bg-white p-4">
          <h3 className="font-heading font-semibold text-brand-primary">Integration status</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {integrations.map((i) => (
              <div key={i.id} className="flex items-start gap-2 rounded-lg border border-brand-border/60 px-3 py-2">
                <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${LIGHT_DOT[i.status]}`} />
                <div>
                  <p className="text-sm font-medium text-brand-primary">{i.label}</p>
                  <p className="text-[10px] text-brand-muted">{i.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="md:col-span-2 rounded-2xl border border-brand-border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-heading font-semibold text-brand-primary">Daily engine</h3>
            <p className="text-xs text-brand-muted">Ingest F5Bot, build trends, draft blog/social/meme/video/image, queue approvals.</p>
          </div>
          <DailyEngineButton />
        </div>
      </div>

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
