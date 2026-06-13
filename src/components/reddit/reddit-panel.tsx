"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, Loader2, MessageSquare, RefreshCw, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  approveAndPostRedditReply,
  checkRedditAccountConnection,
  draftRedditReply,
  draftRedditReplyFromIntelligence,
  rejectRedditDraft,
  scanRedditOpportunities,
  updateRedditDraft,
  updateRedditEngagement,
} from "@/lib/actions/reddit";
import type { RedditPageData } from "@/lib/db/reddit-queries";
import { DataSourceBadge } from "@/components/shared/source-context";
import { formatDate } from "@/lib/utils";

function EngagementEditor({ logId, upvotes, note }: { logId: string; upvotes: number; note: string }) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(upvotes));
  const [noteValue, setNoteValue] = useState(note);

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="rounded-full bg-orange-50 px-2 py-0.5 text-orange-700 hover:bg-orange-100">
        ▲ {upvotes}{note ? ` · ${note.slice(0, 30)}` : ""}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
        className="w-14 rounded border border-brand-border px-1.5 py-0.5 text-xs"
        placeholder="upvotes"
      />
      <input
        value={noteValue}
        onChange={(e) => setNoteValue(e.target.value)}
        className="w-32 rounded border border-brand-border px-1.5 py-0.5 text-xs"
        placeholder="engagement note"
      />
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await updateRedditEngagement(logId, Number(value) || 0, noteValue);
            setEditing(false);
          })
        }
        className="rounded bg-brand-primary px-1.5 py-0.5 text-white"
      >
        Save
      </button>
    </span>
  );
}

const STATUS_VARIANTS: Record<string, "success" | "warning" | "danger" | "info" | "muted"> = {
  connected: "success",
  not_connected: "muted",
  warming_up: "warning",
  restricted: "danger",
  error: "danger",
  found: "info",
  drafting: "warning",
  drafted: "warning",
  answered: "success",
  skipped: "muted",
  draft: "muted",
  pending_approval: "warning",
  approved: "info",
  rejected: "danger",
  posted: "success",
  failed: "danger",
};

export function RedditPanel({ data }: { data: RedditPageData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) => {
    startTransition(async () => {
      const res = await fn();
      setMessage(res.ok ? (res.message ?? "Done") : res.error ?? "Something went wrong");
      if (res.ok) {
        setEditingId(null);
        router.refresh();
      }
    });
  };

  const rules = data.safetyRules;
  const pendingDrafts = data.drafts.filter((d) => d.status === "pending_approval" || d.status === "draft");
  const postedDrafts = data.drafts.filter((d) => d.status === "posted");
  const f5botLive = data.f5botIntelligence.active && data.f5botIntelligence.totalRedditAlerts > 0;
  const hasRealConversations = data.configured || f5botLive;

  return (
    <div className="space-y-6">
      {message && (
        <div className="rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-sm text-brand-primary">
          {message}
        </div>
      )}

      {/* Setup status checklist */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading mr-2 text-sm font-semibold text-brand-primary">Setup status</h3>
            <Badge variant={data.configured ? "success" : "muted"}>
              {data.configured ? "Credentials present" : "Credentials missing"}
            </Badge>
            <Badge variant={data.account?.status === "connected" ? "success" : "muted"}>
              {data.account?.status === "connected" ? "Read test passed" : "Read test pending"}
            </Badge>
            <Badge variant="warning">Publish: founder approval required</Badge>
            <Badge variant="muted">
              Rate limit: {data.postedToday}/{data.safetyRules.maxRepliesPerDay} today
            </Badge>
            <Badge variant="muted">
              OAuth scanner: {data.account?.monitoredSubreddits.length ?? 0} subreddits monitored
            </Badge>
            {data.f5botIntelligence.active && (
              <Badge variant="success">F5Bot Reddit feed: active</Badge>
            )}
            {!data.configured && !f5botLive && <DataSourceBadge dataSource="demo" platform="reddit" />}
          </div>
          {!data.configured && (
            <p className="mt-2 text-xs text-amber-700">
              {f5botLive
                ? "Reddit OAuth not connected. F5Bot intelligence is active, so Reddit conversations are available in read-only mode."
                : "Reddit OAuth not connected. Connect credentials for posting. Draft-only mode until OAuth is set up."}
              {" "}Auto-posting stays off until founder approval and OAuth setup.
            </p>
          )}
        </CardContent>
      </Card>

      {data.f5botIntelligence.active && (
        <Card>
          <CardContent className="py-5">
            <h3 className="font-heading font-semibold text-brand-primary">F5Bot Reddit Intelligence</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <MiniStat label="Total Reddit alerts" value={data.f5botIntelligence.totalRedditAlerts} />
              <MiniStat label="High priority" value={data.f5botIntelligence.highPriorityRedditAlerts} />
              <MiniStat label="Community opportunities" value={data.f5botIntelligence.communityOpportunities} />
              <MiniStat
                label="Latest subreddit"
                value={data.f5botIntelligence.latestSubreddit ? `r/${data.f5botIntelligence.latestSubreddit}` : "—"}
              />
              <MiniStat
                label="Last ingested"
                value={
                  data.f5botIntelligence.lastIngestedAt
                    ? formatDate(data.f5botIntelligence.lastIngestedAt)
                    : "—"
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {data.f5botCommunityAlerts.length > 0 && (
        <Card>
          <CardContent className="py-5">
            <h3 className="font-heading font-semibold text-brand-primary">F5Bot community questions</h3>
            <p className="mt-1 text-xs text-brand-muted">Draft replies from intelligence alerts. Posting still requires OAuth and founder approval.</p>
            <div className="mt-3 space-y-2">
              {data.f5botCommunityAlerts.slice(0, 8).map((alert) => (
                <div key={alert.id} className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-brand-border p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {alert.subreddit && <Badge variant="muted">r/{alert.subreddit}</Badge>}
                      <Badge variant="info">F5Bot</Badge>
                      {alert.priority && <Badge variant="warning">{alert.priority}</Badge>}
                    </div>
                    <p className="mt-1 text-sm font-medium text-brand-primary">{alert.title}</p>
                    <p className="mt-0.5 line-clamp-2 break-words text-xs text-brand-muted">{alert.body}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() => run(() => draftRedditReplyFromIntelligence(alert.id))}
                  >
                    <MessageSquare className="mr-1 h-3.5 w-3.5" /> Draft reply
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection + safety status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="py-5">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold text-brand-primary">Account connection</h3>
              <Badge variant={data.configured ? (data.account?.status === "connected" ? "success" : "warning") : "muted"}>
                {data.configured
                  ? data.account?.status === "connected"
                    ? `Connected — u/${data.account.username}`
                    : "Credentials set — run check"
                  : "Not connected"}
              </Badge>
            </div>
            {data.account && data.account.status === "connected" && (
              <p className="mt-2 text-xs text-brand-muted">
                {data.account.karma} karma · account ~{data.account.accountAgeDays} days · rate limit remaining:{" "}
                {data.account.rateLimitRemaining}
              </p>
            )}
            {!data.configured && (
              <p className="mt-2 text-xs text-brand-muted">
                Set REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD, REDDIT_USER_AGENT in
                Vercel, then redeploy. See the setup guide below.
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" disabled={pending || !data.configured} onClick={() => run(checkRedditAccountConnection)}>
                {pending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1 h-3.5 w-3.5" />}
                Check connection (read-only)
              </Button>
              <Button size="sm" variant="secondary" disabled={pending || !data.configured} onClick={() => run(scanRedditOpportunities)}>
                Scan subreddits (read-only)
              </Button>
            </div>
            {data.account && data.account.monitoredSubreddits.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {data.account.monitoredSubreddits.map((s) => (
                  <Badge key={s} variant="muted">r/{s}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-5">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-brand-primary" />
              <h3 className="font-heading font-semibold text-brand-primary">Safety rules (enforced server-side)</h3>
            </div>
            <ul className="mt-3 space-y-1.5 text-xs text-brand-muted">
              <li>• Max {rules.maxRepliesPerDay} replies/day — {data.postedToday} used today</li>
              <li>• Max {rules.maxRepliesPerSubredditPerDay} reply per subreddit per day</li>
              <li>• Links in replies: {rules.allowLinks ? "allowed" : "blocked"}</li>
              <li>• Founder approval: {rules.requireFounderApproval ? "required for every reply" : "relaxed"}</li>
              <li>• Skip strict no-promo subreddits: {rules.skipNoPromoSubreddits ? "yes" : "no"}</li>
              <li>• Replies must directly answer the question</li>
              <li>• Every action is logged below</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Opportunities */}
      <Card>
        <CardContent className="py-5">
          <h3 className="font-heading font-semibold text-brand-primary">Community questions found</h3>
          {data.opportunities.length === 0 ? (
            <p className="mt-2 text-sm text-brand-muted">
              {data.opportunities.length === 0 && f5botLive
                ? "No OAuth scan results yet. Use F5Bot community questions above to draft replies."
                : "No opportunities yet. Run a read-only OAuth scan."}
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {data.opportunities.slice(0, 10).map((opp) => (
                <div key={opp.id} className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-brand-border p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="muted">r/{opp.subreddit}</Badge>
                      <Badge variant={STATUS_VARIANTS[opp.status] ?? "muted"}>{opp.status}</Badge>
                      <DataSourceBadge
                        dataSource={hasRealConversations ? "live_api" : "demo"}
                        platform="reddit"
                      />
                      <span className="text-[11px] text-brand-muted">risk {opp.riskScore}</span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-brand-primary">{opp.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-brand-muted">{opp.question}</p>
                  </div>
                  <div className="flex gap-2">
                    {opp.permalink && (
                      <a href={opp.permalink} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="ghost"><ExternalLink className="h-3.5 w-3.5" /></Button>
                      </a>
                    )}
                    {opp.status === "found" && (
                      <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => draftRedditReply(opp.id))}>
                        <MessageSquare className="mr-1 h-3.5 w-3.5" /> Draft reply
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drafts awaiting approval */}
      <Card>
        <CardContent className="py-5">
          <h3 className="font-heading font-semibold text-brand-primary">
            Reply drafts awaiting approval ({pendingDrafts.length})
          </h3>
          {pendingDrafts.length === 0 ? (
            <p className="mt-2 text-sm text-brand-muted">Nothing waiting. Draft a reply from an opportunity above.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {pendingDrafts.map((draft) => (
                <div key={draft.id} className="rounded-xl border border-brand-border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="muted">r/{draft.subreddit}</Badge>
                    <Badge variant={STATUS_VARIANTS[draft.status] ?? "muted"}>{draft.status}</Badge>
                    {draft.author && <span className="text-[11px] text-brand-muted">by u/{draft.author}</span>}
                    {draft.permalink && (
                      <a
                        href={draft.permalink.startsWith("http") ? draft.permalink : `https://www.reddit.com${draft.permalink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-accent hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open Original Post
                      </a>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-brand-muted">Q: {draft.question.slice(0, 200)}</p>
                  {editingId === draft.id ? (
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={6}
                      className="mt-2 w-full rounded-lg border border-brand-border bg-white px-2 py-1.5 text-xs"
                    />
                  ) : (
                    <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-brand-bg p-3 font-sans text-xs text-brand-primary">
                      {draft.draftReply}
                    </pre>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {editingId === draft.id ? (
                      <>
                        <Button size="sm" disabled={pending} onClick={() => run(() => updateRedditDraft(draft.id, editText))}>
                          Save edits
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          disabled={pending || !data.configured}
                          title={!data.configured ? "Connect the Reddit API to post. Draft-only mode is active." : undefined}
                          onClick={() => run(() => approveAndPostRedditReply(draft.id))}
                        >
                          <Check className="mr-1 h-3.5 w-3.5" />
                          {data.configured ? "Approve + post to Reddit" : "Posting disabled (demo)"}
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => { setEditingId(draft.id); setEditText(draft.draftReply); }}>
                          Edit
                        </Button>
                        <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => rejectRedditDraft(draft.id, "Not a fit"))}>
                          <X className="mr-1 h-3.5 w-3.5" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                  {draft.errorMessage && <p className="mt-1.5 text-xs text-red-600">{draft.errorMessage}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Posted + logs */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="py-5">
            <h3 className="font-heading font-semibold text-brand-primary">Posted replies ({postedDrafts.length})</h3>
            {postedDrafts.length === 0 ? (
              <p className="mt-2 text-sm text-brand-muted">Nothing posted yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {postedDrafts.slice(0, 8).map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-2 rounded-lg border border-brand-border px-3 py-2 text-xs">
                    <span className="min-w-0 truncate text-brand-primary">r/{d.subreddit}: {d.question.slice(0, 60)}</span>
                    {d.publishedUrl && (
                      <a href={d.publishedUrl} target="_blank" rel="noreferrer" className="text-brand-accent underline">
                        permalink
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-5">
            <h3 className="font-heading font-semibold text-brand-primary">Action log</h3>
            {data.logs.length === 0 ? (
              <p className="mt-2 text-sm text-brand-muted">No Reddit actions logged yet.</p>
            ) : (
              <div className="mt-3 space-y-1.5">
                {data.logs.map((log) => (
                  <div key={log.id} className="flex flex-wrap items-center gap-2 text-xs text-brand-muted">
                    <Badge variant={log.status === "success" ? "success" : log.status === "blocked" ? "warning" : "danger"}>
                      {log.status}
                    </Badge>
                    <span>{log.action}{log.subreddit ? ` · r/${log.subreddit}` : ""}</span>
                    {log.action === "post_reply" && log.status === "success" && (
                      <EngagementEditor logId={log.id} upvotes={log.upvotes} note={log.engagementNote} />
                    )}
                    {log.publishedUrl && (
                      <a href={log.publishedUrl} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline">
                        reply ↗
                      </a>
                    )}
                    {log.errorMessage && <span className="truncate text-red-600">{log.errorMessage.slice(0, 60)}</span>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-brand-border/60 bg-brand-bg/30 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums text-brand-primary">{value}</p>
    </div>
  );
}
