import { Clapperboard } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { DeleteButton } from "@/components/shared/delete-button";
import { ApprovalActions } from "@/components/shared/approval-actions";
import { VideoPackagePanel } from "@/components/assets/video-package-panel";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import { getVideoScripts } from "@/lib/db/queries";
import { getVideosByScript } from "@/lib/db/asset-queries";
import { getVideoProviderStatus } from "@/lib/video/video-provider";
import { getVideoQueueItems } from "@/lib/pipeline/video-queue";
import { VideoQueuePanel } from "@/components/video/video-queue-panel";
import { formatDate } from "@/lib/utils";

export default async function VideoScriptsPage({
  searchParams,
}: {
  searchParams: Promise<{ video?: string }>;
}) {
  const { video: highlightVideoId } = await searchParams;
  const { data, error, configured } = await fetchPageData(getVideoScripts);
  const videosByScript = configured ? await getVideosByScript().catch(() => new Map()) : new Map();
  const queueItems = configured ? await getVideoQueueItems(50).catch(() => []) : [];
  const showCleanup =
    process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_SHOW_DEMO_DATA === "true";
  const providerStatus = getVideoProviderStatus();

  if (!configured) {
    return (<div><PageHeader title="Video Script Generator" /><ConfigBanner /></div>);
  }

  return (
    <div>
      <PageHeader
        title="Video Studio"
        description="Video concepts from approved Bloom ideas. Raw internet signals stay in Intelligence until Bloom transforms them."
      />
      <div
        className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
          providerStatus.canGenerate
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-brand-border bg-brand-bg text-brand-muted"
        }`}
      >
        {providerStatus.canGenerate
          ? `Video generation: ${providerStatus.message}. Generated videos land in the review queue below.`
          : `Video generation: ${providerStatus.message}. Packages are still fully usable — attach the final video URL manually.`}{" "}
        <Link href="/admin/video-diagnostics" className="font-medium underline">
          Run diagnostics
        </Link>
      </div>
      {error && <ErrorBanner message={error} />}

      {configured && <VideoQueuePanel items={queueItems} showCleanup={showCleanup} />}

      {!data || data.length === 0 ? (
        <EmptyState icon={Clapperboard} title="No video scripts" description="Seed data or add scripts via Supabase." />
      ) : (
        <div className="space-y-6">
          {data.map((script) => {
            const video = videosByScript.get(script.id) ?? null;
            const highlighted = video?.id === highlightVideoId;
            return (
            <Card key={script.id} className={highlighted ? "ring-2 ring-brand-accent" : undefined}>
              <CardContent className="py-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{script.platform}</Badge>
                    <StatusBadge status={script.status} />
                    <span className="text-xs text-brand-muted">{formatDate(script.createdAt)}</span>
                  </div>
                  <div className="flex gap-2">
                    <ApprovalActions table="video_scripts" id={script.id} initialStatus={script.status} />
                    <DeleteButton table="video_scripts" id={script.id} />
                  </div>
                </div>
                <div className="mt-4 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary/8 text-brand-primary">
                    <Clapperboard className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading text-xl font-semibold text-brand-primary">{script.title}</h3>
                    <p className="mt-2 rounded-xl bg-brand-accent/10 px-4 py-3 text-sm font-medium text-brand-primary">🎣 Hook: {script.hook}</p>
                  </div>
                </div>
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-sage">Scene Breakdown</h4>
                    <div className="mt-3 space-y-2">
                      {script.scenes.map((scene) => (
                        <div key={scene.label} className="rounded-xl border border-brand-border p-3">
                          <p className="text-xs font-semibold text-brand-primary">{scene.label}</p>
                          <p className="mt-1 text-sm text-brand-muted">{scene.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-sage">On-Screen Text</h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {script.onScreenText.map((text) => (
                          <span key={text} className="rounded-lg bg-brand-bg px-3 py-1.5 text-xs font-medium">{text}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-sage">Voiceover</h4>
                      <p className="mt-2 text-sm leading-relaxed text-brand-muted">{script.voiceover}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-sage">CTA</h4>
                      <p className="mt-2 text-sm font-medium text-brand-accent">{script.cta}</p>
                    </div>
                  </div>
                </div>
                <VideoPackagePanel
                  scriptId={script.id}
                  scriptApproved={script.status === "approved"}
                  video={video}
                  canGenerate={providerStatus.canGenerate}
                  providerLabel={
                    providerStatus.canGenerate
                      ? `${providerStatus.provider} · ${providerStatus.model}`
                      : ""
                  }
                />
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
