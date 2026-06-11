import Link from "next/link";
import { AlertTriangle, CheckCircle2, Download, XCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { ConfigBanner } from "@/components/ui/config-banner";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { runVideoDiagnostics, type CheckStatus } from "@/lib/video/video-diagnostics";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_ICON: Record<CheckStatus, { icon: typeof CheckCircle2; tone: string }> = {
  ok: { icon: CheckCircle2, tone: "text-emerald-600" },
  warning: { icon: AlertTriangle, tone: "text-amber-600" },
  error: { icon: XCircle, tone: "text-red-600" },
};

const JOB_BADGE: Record<string, "success" | "warning" | "danger" | "info" | "muted"> = {
  generated: "success",
  approved: "success",
  scheduled: "success",
  generating: "warning",
  package_ready: "info",
  failed: "danger",
  provider_not_configured: "muted",
};

export default async function VideoDiagnosticsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <PageHeader title="Video Diagnostics" />
        <ConfigBanner />
      </div>
    );
  }

  const diagnostics = await runVideoDiagnostics();
  const failing = diagnostics.checks.filter((c) => c.status === "error").length;

  return (
    <div>
      <PageHeader
        title="Video Diagnostics"
        description="Every stage of the video pipeline — key, model, storage, persistence — with the exact failure point."
      />

      <div className="mb-6 rounded-2xl border border-brand-border bg-white p-4">
        <p className="text-sm font-semibold text-brand-primary">
          {failing === 0 ? "Pipeline healthy" : `${failing} blocking issue${failing > 1 ? "s" : ""} found`}
        </p>
        <div className="mt-3 space-y-3">
          {diagnostics.checks.map((check) => {
            const meta = STATUS_ICON[check.status];
            const Icon = meta.icon;
            return (
              <div key={check.id} className="flex items-start gap-3 rounded-xl border border-brand-border/50 bg-brand-bg/40 p-3">
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.tone}`} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-primary">{check.label}</p>
                  <p className="mt-0.5 text-xs text-brand-muted">{check.message}</p>
                  {check.fix && (
                    <p className="mt-1 text-xs font-medium text-amber-800">Fix: {check.fix}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-brand-border bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-brand-primary">Recent generation jobs</p>
          <Link href="/video" className="text-xs font-medium text-brand-accent hover:underline">
            Open Video Studio →
          </Link>
        </div>
        {diagnostics.recentJobs.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-brand-border p-4 text-center text-xs text-brand-muted">
            No video packages yet. Generate one from an approved script in the Video Studio.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {diagnostics.recentJobs.map((job) => (
              <div key={job.id} className="rounded-xl border border-brand-border/50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={JOB_BADGE[job.status] ?? "muted"}>{job.status}</Badge>
                  <span className="text-sm font-medium text-brand-primary">{job.title}</span>
                  <span className="ml-auto text-[11px] text-brand-muted">{formatDate(job.createdAt)}</span>
                </div>
                <p className="mt-1 text-xs text-brand-muted">
                  <span className="font-semibold">Failure point:</span> {job.failurePoint}
                  {job.jobId && <span className="ml-2 text-[10px]">job {job.jobId.slice(0, 18)}…</span>}
                </p>
                {job.errorMessage && (
                  <p className="mt-1 break-words rounded-lg bg-amber-50 px-2 py-1 text-[11px] text-amber-900">
                    {job.errorMessage.slice(0, 300)}
                  </p>
                )}
                {job.directDownload && (
                  <a
                    href={`/api/video/download/${job.id}`}
                    className="mt-1.5 inline-flex items-center gap-1 rounded-lg border border-brand-border bg-white px-2 py-1 text-[11px] font-medium text-brand-primary hover:bg-brand-bg"
                  >
                    <Download className="h-3 w-3" />
                    Download generated video
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
