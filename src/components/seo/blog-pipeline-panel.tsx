"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  approveBlogPost,
  markBlogPublished,
  publishBlogToCms,
  rejectBlogPost,
  requestBlogRevision,
  rewriteBlogDraft,
} from "@/lib/actions/seo-blog";
import type { SeoBlogPost } from "@/lib/db/seo-queries";

interface Props {
  posts: SeoBlogPost[];
  cmsConfigured: boolean;
}

const STATUS_META: Record<string, { label: string; style: string }> = {
  draft: { label: "Draft", style: "bg-gray-100 text-gray-700" },
  voice_check_failed: { label: "Voice check failed", style: "bg-red-50 text-red-700" },
  gate_review: { label: "Awaiting approval", style: "bg-amber-50 text-amber-700" },
  approved: { label: "Approved", style: "bg-emerald-50 text-emerald-700" },
  ready_to_publish: { label: "Ready to publish", style: "bg-blue-50 text-blue-700" },
  published: { label: "Published", style: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Rejected", style: "bg-red-50 text-red-700" },
  needs_revision: { label: "Needs revision", style: "bg-purple-50 text-purple-700" },
};

const DEFAULT_STATUS_META = { label: "Unknown", style: "bg-gray-100 text-gray-500" };

function PostCard({ post, cmsConfigured }: { post: SeoBlogPost; cmsConfigured: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState("");
  const [publishUrl, setPublishUrl] = useState(post.publishedUrl);
  const [copied, setCopied] = useState<string | null>(null);

  const meta = STATUS_META[post.status] ?? DEFAULT_STATUS_META;
  const inReview = post.status === "gate_review";
  const failed = post.status === "voice_check_failed" || post.status === "needs_revision" || post.status === "rejected";
  const readyToPublish = post.status === "ready_to_publish" || post.status === "approved";

  function run(action: () => Promise<{ ok: boolean; message?: string; error?: string } | { ok: true; message?: string } | { ok: false; error: string }>) {
    startTransition(async () => {
      const result = await action();
      setMessage(result.ok ? ((result as { message?: string }).message ?? "Done") : (result as { error: string }).error);
    });
  }

  async function copy(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      setMessage("Copy failed — select and copy manually");
    }
  }

  const schemaJson = Object.keys(post.schemaMarkup).length > 0 ? JSON.stringify(post.schemaMarkup, null, 2) : "";

  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-heading font-semibold text-brand-primary">{post.headline || post.keyword}</p>
            <p className="mt-0.5 text-xs text-brand-muted">
              {post.keyword} · {post.wordCount} words · /blog/{post.slug}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${post.riskLevel === "low" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
              risk: {post.riskLevel}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.style}`}>{meta.label}</span>
          </div>
        </div>

        {/* Voice check */}
        {post.voiceCheck && (
          <div className={`mt-3 rounded-xl border px-3 py-2 text-xs ${post.voiceCheckPassed ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
            <span className="font-medium">
              Brand voice check: {post.voiceCheckPassed ? "passed" : "FAILED"} ({post.voiceCheck.score}/100)
            </span>
            {post.voiceCheck.violations.length > 0 && (
              <ul className="mt-1 list-disc pl-4">
                {post.voiceCheck.violations.map((v, i) => (
                  <li key={i}>
                    <span className="font-medium">{v.rule}:</span> {v.detail}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {post.reviewFeedback && (
          <p className="mt-2 rounded-lg bg-purple-50 px-3 py-2 text-xs text-purple-800">
            Founder feedback: {post.reviewFeedback}
          </p>
        )}

        {/* SEO package summary */}
        <div className="mt-3 grid gap-1.5 text-xs text-brand-muted">
          <p><span className="font-medium text-brand-primary">SEO title:</span> {post.seoTitle}</p>
          <p><span className="font-medium text-brand-primary">Meta description:</span> {post.metaDescription}</p>
          {post.internalLinks.length > 0 && (
            <p>
              <span className="font-medium text-brand-primary">Internal links:</span>{" "}
              {post.internalLinks.map((l) => `${l.anchor} (${l.url})`).join(", ")}
            </p>
          )}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-xs font-medium text-brand-accent hover:underline"
        >
          {expanded ? "Hide full post" : "Read full post"}
        </button>

        {expanded && (
          <div className="mt-3 rounded-xl border border-brand-border bg-brand-bg/40 p-4 text-sm text-brand-primary">
            <h4 className="font-heading text-base font-semibold">{post.headline}</h4>
            <p className="mt-2">{post.intro}</p>
            {post.sections.map((s, i) => (
              <div key={i} className="mt-3">
                <h5 className="font-semibold">{s.subhead}</h5>
                <p className="mt-1 text-brand-muted">{s.body}</p>
              </div>
            ))}
            {post.faq.length > 0 && (
              <div className="mt-3">
                <h5 className="font-semibold">FAQ</h5>
                {post.faq.map((f, i) => (
                  <div key={i} className="mt-1.5">
                    <p className="font-medium">{f.question}</p>
                    <p className="text-brand-muted">{f.answer}</p>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 font-medium">{post.cta}</p>
          </div>
        )}

        {/* Copy buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => copy("html", post.html)}>
            {copied === "html" ? "Copied!" : "Copy HTML"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => copy("title", post.seoTitle)}>
            {copied === "title" ? "Copied!" : "Copy SEO title"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => copy("meta", post.metaDescription)}>
            {copied === "meta" ? "Copied!" : "Copy meta description"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => copy("slug", post.slug)}>
            {copied === "slug" ? "Copied!" : "Copy slug"}
          </Button>
          {schemaJson && (
            <Button size="sm" variant="ghost" onClick={() => copy("schema", schemaJson)}>
              {copied === "schema" ? "Copied!" : "Copy schema markup"}
            </Button>
          )}
        </div>

        {/* Review actions */}
        {inReview && (
          <div className="mt-4 space-y-2 border-t border-brand-border pt-4">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="success" onClick={() => run(() => approveBlogPost(post.id))} disabled={pending}>
                Approve
              </Button>
              <Button size="sm" variant="danger" onClick={() => run(() => rejectBlogPost(post.id, note))} disabled={pending}>
                Reject
              </Button>
              <Button size="sm" variant="secondary" onClick={() => run(() => requestBlogRevision(post.id, note))} disabled={pending}>
                Request revision
              </Button>
            </div>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional feedback for reject / revision"
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm"
            />
          </div>
        )}

        {failed && (
          <div className="mt-4 border-t border-brand-border pt-4">
            <Button size="sm" onClick={() => run(() => rewriteBlogDraft(post.id))} disabled={pending}>
              {pending ? "Rewriting..." : "Rewrite draft"}
            </Button>
          </div>
        )}

        {/* Publish actions */}
        {readyToPublish && (
          <div className="mt-4 space-y-2 border-t border-brand-border pt-4">
            {cmsConfigured ? (
              <Button size="sm" onClick={() => run(() => publishBlogToCms(post.id))} disabled={pending}>
                {pending ? "Publishing..." : "Publish to website"}
              </Button>
            ) : (
              <p className="text-xs text-brand-muted">
                No CMS connected. Copy the HTML above, paste it into your site, then save the live URL here.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <input
                value={publishUrl}
                onChange={(e) => setPublishUrl(e.target.value)}
                placeholder="https://plantpal.app/blog/..."
                className="min-w-[260px] flex-1 rounded-lg border border-brand-border px-3 py-2 text-sm"
              />
              <Button
                size="sm"
                variant="success"
                onClick={() => run(() => markBlogPublished(post.id, publishUrl))}
                disabled={pending || publishUrl.trim().length < 8}
              >
                Mark as published
              </Button>
            </div>
          </div>
        )}

        {post.status === "published" && post.publishedUrl && (
          <p className="mt-3 text-xs text-brand-muted">
            Live at{" "}
            <a href={post.publishedUrl} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline">
              {post.publishedUrl}
            </a>
            {post.publishedAt && ` since ${new Date(post.publishedAt).toLocaleDateString()}`}
          </p>
        )}

        {message && <p className="mt-3 text-xs text-brand-primary">{message}</p>}
      </CardContent>
    </Card>
  );
}

export function BlogPipelinePanel({ posts, cmsConfigured }: Props) {
  const groups: { title: string; items: SeoBlogPost[] }[] = [
    { title: "Needs attention", items: posts.filter((p) => ["voice_check_failed", "needs_revision"].includes(p.status)) },
    { title: "Awaiting approval", items: posts.filter((p) => p.status === "gate_review") },
    { title: "Ready to publish", items: posts.filter((p) => ["approved", "ready_to_publish"].includes(p.status)) },
    { title: "Published", items: posts.filter((p) => p.status === "published") },
    { title: "Rejected", items: posts.filter((p) => p.status === "rejected") },
  ];

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-brand-muted">
          No drafts yet. Go to the SEO page and hit “Write draft” on a keyword.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {groups
        .filter((g) => g.items.length > 0)
        .map((group) => (
          <div key={group.title}>
            <h3 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wide text-brand-muted">
              {group.title} ({group.items.length})
            </h3>
            <div className="space-y-4">
              {group.items.map((post) => (
                <PostCard key={post.id} post={post} cmsConfigured={cmsConfigured} />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
