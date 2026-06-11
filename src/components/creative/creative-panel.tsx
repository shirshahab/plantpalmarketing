"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  attachProjectToCalendar,
  createCreativeProject,
  generateProjectVariants,
  renderAssetImage,
  reviewCreativeAsset,
} from "@/lib/actions/creative";
import type { CreativePageData, CreativeProjectRow } from "@/lib/db/creative-queries";

const PROJECT_TYPES = [
  { key: "image", label: "Image" },
  { key: "video", label: "Video" },
  { key: "thumbnail", label: "Thumbnail" },
  { key: "carousel", label: "Carousel" },
  { key: "ugc", label: "UGC concept" },
  { key: "ad", label: "Ad creative" },
  { key: "blog_header", label: "Blog header" },
];

const STATUS_STYLE: Record<string, string> = {
  queued: "bg-gray-100 text-gray-600",
  generating: "bg-blue-50 text-blue-700",
  in_review: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  attached: "bg-emerald-100 text-emerald-800",
};

const ASSET_STATUS_STYLE: Record<string, string> = {
  concept: "bg-gray-100 text-gray-600",
  generated: "bg-blue-50 text-blue-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  regenerate: "bg-purple-50 text-purple-700",
};

function ProjectCard({ project }: { project: CreativeProjectRow }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  function run(action: () => Promise<{ ok: boolean; message?: string; error?: string }>) {
    startTransition(async () => {
      const result = await action();
      setMessage(result.ok ? (result.message ?? "Done") : (result.error ?? "Failed"));
    });
  }

  const approvedAsset = project.assets.find((a) => a.status === "approved");

  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-heading font-semibold text-brand-primary">{project.title}</p>
            <p className="mt-0.5 text-xs text-brand-muted">
              {project.projectType}
              {project.platform ? ` · ${project.platform}` : ""} · {project.variantsRequested} variants
            </p>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[project.status] ?? STATUS_STYLE.queued}`}>
            {project.status.replace("_", " ")}
          </span>
        </div>

        <p className="mt-2 line-clamp-3 text-xs text-brand-muted">{project.brief}</p>

        {(project.status === "queued" || project.assets.length === 0) && (
          <Button size="sm" className="mt-3" onClick={() => run(() => generateProjectVariants(project.id))} disabled={pending}>
            {pending ? "Fern is working..." : "Generate variants"}
          </Button>
        )}

        {project.assets.length > 0 && (
          <div className="mt-4 space-y-3">
            {project.assets.map((asset) => (
              <div key={asset.id} className="rounded-xl border border-brand-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-brand-primary">Variant {asset.variantNumber}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ASSET_STATUS_STYLE[asset.status] ?? ASSET_STATUS_STYLE.concept}`}>
                    {asset.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-brand-primary">{asset.concept}</p>
                <p className="mt-1 line-clamp-2 text-xs text-brand-muted">{asset.prompt}</p>
                {asset.assetUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.assetUrl} alt={asset.concept} className="mt-2 max-h-56 rounded-lg border border-brand-border object-cover" />
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  {asset.assetType === "image" && !asset.assetUrl && asset.status !== "rejected" && (
                    <Button size="sm" variant="secondary" onClick={() => run(() => renderAssetImage(asset.id))} disabled={pending}>
                      Render image
                    </Button>
                  )}
                  {asset.status !== "approved" && (
                    <Button size="sm" variant="success" onClick={() => run(() => reviewCreativeAsset(asset.id, "approve", feedback))} disabled={pending}>
                      Approve
                    </Button>
                  )}
                  <Button size="sm" variant="danger" onClick={() => run(() => reviewCreativeAsset(asset.id, "reject", feedback))} disabled={pending}>
                    Reject
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => run(() => reviewCreativeAsset(asset.id, "regenerate", feedback))} disabled={pending}>
                    Regenerate
                  </Button>
                </div>
              </div>
            ))}
            <input
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Optional feedback — Fern remembers every note"
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm"
            />
          </div>
        )}

        {approvedAsset && project.calendarItemId && project.status !== "attached" && (
          <Button size="sm" className="mt-3" onClick={() => run(() => attachProjectToCalendar(project.id, approvedAsset.id))} disabled={pending}>
            Attach to calendar
          </Button>
        )}

        {message && <p className="mt-3 text-xs text-brand-primary">{message}</p>}
      </CardContent>
    </Card>
  );
}

export function CreativePanel({ data }: { data: CreativePageData }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [calendarItemId, setCalendarItemId] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [projectType, setProjectType] = useState("image");

  function handleCreate() {
    startTransition(async () => {
      const result = await createCreativeProject({
        calendarItemId: calendarItemId || undefined,
        title: manualTitle || undefined,
        brief: manualTitle || undefined,
        projectType,
      });
      setMessage(result.ok ? (result.message ?? "Created") : result.error);
      if (result.ok) {
        setManualTitle("");
        setCalendarItemId("");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-5">
          <h3 className="font-heading font-semibold text-brand-primary">New creative project</h3>
          <p className="mt-1 text-xs text-brand-muted">
            Pick an approved calendar item or write a manual brief. Fern generates multiple variants, you pick the winner.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <select
              value={calendarItemId}
              onChange={(e) => setCalendarItemId(e.target.value)}
              className="min-w-[220px] flex-1 rounded-lg border border-brand-border px-3 py-2 text-sm"
            >
              <option value="">No calendar item (manual brief)</option>
              {data.approvedCalendarItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} ({item.platform})
                </option>
              ))}
            </select>
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className="w-44 rounded-lg border border-brand-border px-3 py-2 text-sm"
            >
              {PROJECT_TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              placeholder="Manual brief (used when no calendar item selected)"
              className="min-w-[260px] flex-1 rounded-lg border border-brand-border px-3 py-2 text-sm"
            />
            <Button size="sm" onClick={handleCreate} disabled={pending || (!calendarItemId && manualTitle.trim().length < 4)}>
              {pending ? "Creating..." : "Queue for Fern"}
            </Button>
          </div>
          {message && <p className="mt-3 text-xs text-brand-primary">{message}</p>}
        </CardContent>
      </Card>

      {data.projects.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-brand-muted">
            No creative projects yet. Queue one above and Fern gets to work.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {data.reviews.length > 0 && (
        <Card>
          <CardContent className="py-5">
            <h3 className="font-heading font-semibold text-brand-primary">Review history (Fern&apos;s lessons)</h3>
            <ul className="mt-3 space-y-1.5 text-sm text-brand-muted">
              {data.reviews.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.decision === "approve" ? "bg-emerald-50 text-emerald-700" : r.decision === "reject" ? "bg-red-50 text-red-700" : "bg-purple-50 text-purple-700"
                    }`}
                  >
                    {r.decision}
                  </span>
                  {r.feedback && <span className="text-xs">{r.feedback}</span>}
                  <span className="text-xs">{new Date(r.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
