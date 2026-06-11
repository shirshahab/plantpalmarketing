"use client";

import { useMemo, useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { markBlogExported, markBlogPublished, saveBlogExportMeta } from "@/lib/actions/seo-blog";
import {
  buildWebsiteBlogObject,
  checkExportQuality,
  renderTsFileSnippet,
  renderTsSnippet,
  WEBSITE_SYNC_CHECKLIST,
} from "@/lib/seo/website-export";
import type { SeoBlogPost } from "@/lib/db/seo-queries";

const EXPORT_STYLE: Record<string, string> = {
  not_exported: "bg-amber-50 text-amber-700",
  exported: "bg-sky-50 text-sky-700",
  published: "bg-emerald-50 text-emerald-700",
};

function ExportPill({ value }: { value: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${EXPORT_STYLE[value] ?? EXPORT_STYLE.not_exported}`}>
      {value.replace(/_/g, " ")}
    </span>
  );
}

function PostCard({ post }: { post: SeoBlogPost }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [checked, setChecked] = useState<boolean[]>(() => WEBSITE_SYNC_CHECKLIST.map(() => false));
  const [publishUrl, setPublishUrl] = useState("");

  const [author, setAuthor] = useState(post.author);
  const [category, setCategory] = useState(post.category);
  const [tags, setTags] = useState(post.tags.length > 0 ? post.tags.join(", ") : post.keyword);
  const [featuredImage, setFeaturedImage] = useState(post.featuredImage);

  const previewPost: SeoBlogPost = useMemo(
    () => ({
      ...post,
      author: author.trim() || "PlantPal Team",
      category: category.trim() || "Plant Care",
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      featuredImage: featuredImage.trim(),
    }),
    [post, author, category, tags, featuredImage]
  );

  const blogObject = useMemo(() => buildWebsiteBlogObject(previewPost), [previewPost]);
  const snippet = useMemo(() => renderTsSnippet(blogObject), [blogObject]);
  const quality = useMemo(() => checkExportQuality(previewPost), [previewPost]);

  function run(fn: () => Promise<{ ok: boolean; message?: string; error?: string } | { ok: false; error: string }>) {
    startTransition(async () => {
      const result = await fn();
      setMessage(result.ok ? ((result as { message?: string }).message ?? "Done") : `Error: ${(result as { error: string }).error}`);
    });
  }

  async function copySnippet() {
    try {
      await navigator.clipboard.writeText(snippet);
      setMessage("TypeScript object copied. Paste it into src/lib/blog/posts.ts");
      run(() => markBlogExported(post.id));
    } catch {
      setMessage("Error: clipboard blocked. Use the download button instead.");
    }
  }

  function downloadSnippet() {
    const blob = new Blob([renderTsFileSnippet(blogObject)], { type: "text/typescript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${post.slug || "blog-post"}.ts`;
    a.click();
    URL.revokeObjectURL(url);
    run(() => markBlogExported(post.id));
  }

  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-heading font-semibold text-brand-primary">{post.headline || post.keyword}</h3>
            <p className="mt-0.5 text-xs text-brand-muted">
              /blog/{post.slug} · {post.wordCount} words · keyword: {post.keyword}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                quality.passed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              quality {quality.score}/100
            </span>
            <ExportPill value={post.status === "published" ? "published" : post.exportStatus} />
          </div>
        </div>

        {/* Quality checks */}
        <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {quality.checks.map((check) => (
            <div key={check.label} className="flex items-start gap-2 text-xs">
              <span className={check.passed ? "text-emerald-600" : "text-red-600"}>
                {check.passed ? "✓" : "✗"}
              </span>
              <span className="text-brand-primary">{check.label}</span>
              <span className="truncate text-brand-muted" title={check.detail}>
                {check.detail}
              </span>
            </div>
          ))}
        </div>

        {/* Website metadata */}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <label className="text-xs text-brand-muted">
            Author
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-border px-2.5 py-1.5 text-sm text-brand-primary"
            />
          </label>
          <label className="text-xs text-brand-muted">
            Category
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-border px-2.5 py-1.5 text-sm text-brand-primary"
            />
          </label>
          <label className="text-xs text-brand-muted">
            Tags (comma separated)
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-border px-2.5 py-1.5 text-sm text-brand-primary"
            />
          </label>
          <label className="text-xs text-brand-muted">
            Featured image URL (optional)
            <input
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              placeholder="/images/blog/..."
              className="mt-1 w-full rounded-lg border border-brand-border px-2.5 py-1.5 text-sm text-brand-primary"
            />
          </label>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={copySnippet} disabled={pending}>
            Copy TypeScript object
          </Button>
          <Button size="sm" variant="secondary" onClick={downloadSnippet} disabled={pending}>
            Download .ts snippet
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              run(() =>
                saveBlogExportMeta(post.id, {
                  author,
                  category,
                  tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
                  featuredImage,
                })
              )
            }
            disabled={pending}
          >
            Save details
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setShowPreview((v) => !v)}>
            {showPreview ? "Hide preview" : "TypeScript preview"}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setShowChecklist((v) => !v)}>
            {showChecklist ? "Hide checklist" : "Publish checklist"}
          </Button>
        </div>

        {message && (
          <p className={`mt-2 text-xs ${message.startsWith("Error") ? "text-red-600" : "text-brand-primary"}`}>
            {message}
          </p>
        )}

        {/* TypeScript preview */}
        {showPreview && (
          <pre className="mt-3 max-h-96 overflow-auto rounded-xl bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
            {snippet}
          </pre>
        )}

        {/* Website sync checklist */}
        {showChecklist && (
          <div className="mt-3 rounded-xl border border-brand-border p-4">
            <p className="text-sm font-medium text-brand-primary">Website sync checklist</p>
            <p className="mt-0.5 text-xs text-brand-muted">Work through these before calling it live.</p>
            <div className="mt-2 space-y-1.5">
              {WEBSITE_SYNC_CHECKLIST.map((step, i) => (
                <label key={step} className="flex cursor-pointer items-start gap-2 text-sm text-brand-primary">
                  <input
                    type="checkbox"
                    checked={checked[i]}
                    onChange={() => setChecked((prev) => prev.map((c, j) => (j === i ? !c : c)))}
                    className="mt-0.5"
                  />
                  <span className={checked[i] ? "text-brand-muted line-through" : ""}>{step}</span>
                </label>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-brand-border pt-3">
              <input
                value={publishUrl}
                onChange={(e) => setPublishUrl(e.target.value)}
                placeholder="https://plantpal.app/blog/your-slug"
                className="min-w-[240px] flex-1 rounded-lg border border-brand-border px-2.5 py-1.5 text-sm text-brand-primary"
              />
              <Button
                size="sm"
                disabled={pending || !publishUrl.trim() || !checked.every(Boolean)}
                onClick={() => run(() => markBlogPublished(post.id, publishUrl))}
                title={!checked.every(Boolean) ? "Finish the checklist first" : undefined}
              >
                Mark published
              </Button>
            </div>
            {!checked.every(Boolean) && (
              <p className="mt-1.5 text-xs text-brand-muted">All boxes checked unlocks the publish button.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SeoExportPanel({
  posts,
  stats,
  cmsConfigured,
}: {
  posts: SeoBlogPost[];
  stats: { total: number; notExported: number; exported: number; published: number };
  cmsConfigured: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Stats + CMS mode */}
      <Card>
        <CardContent className="py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-4">
              <div>
                <p className="text-2xl font-bold text-brand-primary">{stats.total}</p>
                <p className="text-xs text-brand-muted">Approved posts</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats.notExported}</p>
                <p className="text-xs text-brand-muted">Waiting for export</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-sky-600">{stats.exported}</p>
                <p className="text-xs text-brand-muted">Exported</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{stats.published}</p>
                <p className="text-xs text-brand-muted">Live on the site</p>
              </div>
            </div>
            <div className="rounded-xl border border-brand-border px-3 py-2 text-xs">
              {cmsConfigured ? (
                <p className="font-medium text-emerald-700">
                  CMS connected — Sprout can auto-publish low-risk posts.
                </p>
              ) : (
                <>
                  <p className="font-medium text-brand-primary">Manual export mode</p>
                  <p className="mt-0.5 text-brand-muted">
                    Copy the object into src/lib/blog/posts.ts. Connect a CMS later
                    (BLOG_CMS_WEBHOOK_URL) and Sprout publishes automatically.
                  </p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm font-medium text-brand-primary">Nothing to export yet.</p>
            <p className="mt-1 text-sm text-brand-muted">
              Approve a draft on /blog-pipeline and it shows up here as a ready-to-paste TypeScript object.
            </p>
          </CardContent>
        </Card>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
