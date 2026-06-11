"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { addSeoKeyword, addSeoTopic, promoteSeoTopic, runSeoFactoryBatch, writeBlogDraft } from "@/lib/actions/seo-blog";
import type { SeoBlogPost, SeoCluster, SeoKeyword, SeoPublishLog, SeoRankRow, SeoTopic } from "@/lib/db/seo-queries";

interface Props {
  keywords: SeoKeyword[];
  posts: SeoBlogPost[];
  logs: SeoPublishLog[];
  topics?: SeoTopic[];
  clusters?: SeoCluster[];
  rankRows?: SeoRankRow[];
  stats: {
    totalKeywords: number;
    drafted: number;
    inReview: number;
    readyToPublish: number;
    published: number;
    backlinks: number;
  };
}

const KEYWORD_STATUS_STYLE: Record<string, string> = {
  new: "bg-blue-50 text-blue-700",
  queued: "bg-amber-50 text-amber-700",
  drafted: "bg-purple-50 text-purple-700",
  published: "bg-emerald-50 text-emerald-700",
  skipped: "bg-gray-100 text-gray-500",
};

function TopicForm({ onMessage }: { onMessage: (m: string) => void }) {
  const [pending, startTransition] = useTransition();
  const [topic, setTopic] = useState("");
  const [cluster, setCluster] = useState("plant care");

  function handleAdd() {
    startTransition(async () => {
      const result = await addSeoTopic(topic, cluster, "");
      onMessage(result.ok ? (result.message ?? "Added") : (result as { error: string }).error);
      if (result.ok) setTopic("");
    });
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <input
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="New topic idea"
        className="min-w-[180px] flex-1 rounded-lg border border-brand-border px-3 py-2 text-sm"
      />
      <input
        value={cluster}
        onChange={(e) => setCluster(e.target.value)}
        placeholder="Cluster"
        className="w-32 rounded-lg border border-brand-border px-3 py-2 text-sm"
      />
      <Button size="sm" variant="secondary" onClick={handleAdd} disabled={pending || topic.trim().length < 3}>
        Add
      </Button>
    </div>
  );
}

export function SeoKeywordPanel({ keywords, posts, logs, topics = [], clusters = [], rankRows = [], stats }: Props) {
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState("");
  const [newCluster, setNewCluster] = useState("plant care");

  const published = posts.filter((p) => p.status === "published");

  const statCards = [
    { label: "Keywords", value: stats.totalKeywords },
    { label: "Drafts written", value: stats.drafted },
    { label: "In review", value: stats.inReview },
    { label: "Ready to publish", value: stats.readyToPublish },
    { label: "Published", value: stats.published },
    { label: "Internal backlinks", value: stats.backlinks },
  ];

  function handleAdd() {
    startTransition(async () => {
      const result = await addSeoKeyword(newKeyword, newCluster);
      setMessage(result.ok ? (result.message ?? "Added") : result.error);
      if (result.ok) setNewKeyword("");
    });
  }

  function handleDraft(keywordId: string) {
    setBusyId(keywordId);
    setMessage("Bloom is writing... this can take ~30 seconds.");
    startTransition(async () => {
      const result = await writeBlogDraft(keywordId);
      setMessage(result.ok ? (result.message ?? "Draft written") : result.error);
      setBusyId(null);
    });
  }

  function handleFactory(count: number) {
    setBusyId("factory");
    setMessage(`SEO Factory running — drafting up to ${count} posts. This takes a while...`);
    startTransition(async () => {
      const result = await runSeoFactoryBatch(count);
      setMessage(result.ok ? (result.message ?? "Factory done") : result.error);
      setBusyId(null);
    });
  }

  function handlePromote(topicId: string) {
    setBusyId(topicId);
    startTransition(async () => {
      const result = await promoteSeoTopic(topicId);
      setMessage(result.ok ? (result.message ?? "Promoted") : result.error);
      setBusyId(null);
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="py-4">
              <p className="text-2xl font-semibold text-brand-primary">{s.value}</p>
              <p className="text-xs text-brand-muted">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {message && (
        <div className="rounded-xl border border-brand-border bg-white px-4 py-2.5 text-sm text-brand-primary">
          {message}
        </div>
      )}

      {/* SEO Factory */}
      <Card>
        <CardContent className="py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-heading font-semibold text-brand-primary">SEO Factory</h3>
                <Link href="/seo/export" className="text-sm font-medium text-brand-accent hover:underline">
                  Website blog export →
                </Link>
              </div>
              <p className="mt-0.5 text-xs text-brand-muted">
                Batch-draft from the keyword queue. Target: 5-10 voice-checked drafts a day. Gate still approves everything.
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleFactory(5)} disabled={pending}>
                {busyId === "factory" ? "Factory running..." : "Draft 5 posts"}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => handleFactory(10)} disabled={pending}>
                Draft 10
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keyword list */}
      <Card>
        <CardContent className="py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-heading font-semibold text-brand-primary">Keyword list</h3>
            <Link href="/blog-pipeline" className="text-sm font-medium text-brand-accent hover:underline">
              Open blog pipeline →
            </Link>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Add a keyword, e.g. why is my fern crispy"
              className="min-w-[240px] flex-1 rounded-lg border border-brand-border px-3 py-2 text-sm"
            />
            <input
              value={newCluster}
              onChange={(e) => setNewCluster(e.target.value)}
              placeholder="Topic cluster"
              className="w-40 rounded-lg border border-brand-border px-3 py-2 text-sm"
            />
            <Button size="sm" variant="secondary" onClick={handleAdd} disabled={pending || newKeyword.trim().length < 3}>
              Add keyword
            </Button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-border text-xs uppercase tracking-wide text-brand-muted">
                  <th className="py-2 pr-4">Keyword</th>
                  <th className="py-2 pr-4">Cluster</th>
                  <th className="py-2 pr-4">Source</th>
                  <th className="py-2 pr-4">Priority</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {keywords.map((kw) => (
                  <tr key={kw.id} className="border-b border-brand-border/50 last:border-0">
                    <td className="py-2.5 pr-4 font-medium text-brand-primary">
                      {kw.keyword}
                      {kw.searchDemandNotes && (
                        <p className="text-xs font-normal text-brand-muted">{kw.searchDemandNotes}</p>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-brand-muted">{kw.topicCluster}</td>
                    <td className="py-2.5 pr-4 text-brand-muted">{kw.source}</td>
                    <td className="py-2.5 pr-4 text-brand-muted">{kw.priorityScore}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${KEYWORD_STATUS_STYLE[kw.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {kw.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <Button
                        size="sm"
                        onClick={() => handleDraft(kw.id)}
                        disabled={pending || kw.status === "published"}
                      >
                        {busyId === kw.id ? "Writing..." : kw.status === "drafted" ? "Write another" : "Write draft"}
                      </Button>
                    </td>
                  </tr>
                ))}
                {keywords.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-sm text-brand-muted">
                      No keywords yet. Run migration 050 to seed the starter topics, or add one above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Topic bank + clusters */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="py-5">
            <h3 className="font-heading font-semibold text-brand-primary">Topic bank</h3>
            <p className="mt-1 text-xs text-brand-muted">
              Ideas from Roots, Sentinel, and SerpAPI. Promote the good ones into the keyword queue.
            </p>
            <TopicForm onMessage={setMessage} />
            {topics.length === 0 ? (
              <p className="mt-3 text-sm text-brand-muted">No topics banked yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {topics.slice(0, 12).map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2 rounded-xl border border-brand-border p-2.5">
                    <div>
                      <p className="text-sm font-medium text-brand-primary">{t.topic}</p>
                      <p className="text-xs text-brand-muted">
                        {t.clusterName} · {t.source} · {t.status}
                      </p>
                    </div>
                    {t.status === "idea" && (
                      <Button size="sm" variant="secondary" onClick={() => handlePromote(t.id)} disabled={pending}>
                        {busyId === t.id ? "..." : "Promote"}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-5">
            <h3 className="font-heading font-semibold text-brand-primary">Clusters & rank tracking</h3>
            {clusters.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-sm">
                {clusters.map((c) => {
                  const clusterPosts = posts.filter((p) => keywords.find((k) => k.id === p.keywordId)?.topicCluster === c.name);
                  return (
                    <li key={c.id} className="flex items-center justify-between text-brand-muted">
                      <span className="font-medium text-brand-primary">{c.name}</span>
                      <span className="text-xs">
                        {clusterPosts.length}/{c.targetPosts} posts
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mt-4 border-t border-brand-border pt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-brand-muted">Rank tracking</p>
              {rankRows.length === 0 ? (
                <p className="mt-2 text-sm text-brand-muted">
                  Not Connected Yet — rankings appear here once SerpAPI checks run against published URLs.
                </p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm text-brand-muted">
                  {rankRows.slice(0, 8).map((r) => (
                    <li key={r.id} className="flex items-center justify-between">
                      <span>{r.keyword}</span>
                      <span className="text-xs">{r.position ? `#${r.position}` : "unranked"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backlink tracker */}
      <Card>
        <CardContent className="py-5">
          <h3 className="font-heading font-semibold text-brand-primary">Backlink tracker</h3>
          <p className="mt-1 text-xs text-brand-muted">
            Published posts, their live URLs, and internal links pointing at them.
          </p>
          {published.length === 0 ? (
            <p className="mt-3 text-sm text-brand-muted">Nothing published yet. Approve a draft, publish it, then mark it published with the live URL.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {published.map((post) => (
                <div key={post.id} className="rounded-xl border border-brand-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-brand-primary">{post.headline}</p>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      {post.backlinks.length} backlink{post.backlinks.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  {post.publishedUrl && (
                    <a href={post.publishedUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-accent hover:underline">
                      {post.publishedUrl}
                    </a>
                  )}
                  {post.backlinks.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5 text-xs text-brand-muted">
                      {post.backlinks.map((b, i) => (
                        <li key={i}>
                          “{b.anchor}” from {b.url}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Publish log */}
      <Card>
        <CardContent className="py-5">
          <h3 className="font-heading font-semibold text-brand-primary">Publish log</h3>
          {logs.length === 0 ? (
            <p className="mt-2 text-sm text-brand-muted">No publish actions yet.</p>
          ) : (
            <ul className="mt-3 space-y-1.5 text-sm">
              {logs.map((log) => (
                <li key={log.id} className="flex flex-wrap items-center gap-2 text-brand-muted">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${log.status === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    {log.status}
                  </span>
                  <span className="text-brand-primary">{log.action}</span>
                  {log.publishedUrl && <span className="text-xs">{log.publishedUrl}</span>}
                  {log.errorMessage && <span className="text-xs text-red-600">{log.errorMessage}</span>}
                  <span className="text-xs">{new Date(log.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
