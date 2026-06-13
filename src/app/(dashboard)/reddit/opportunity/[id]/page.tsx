import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { RedditOpportunityActions } from "@/components/reddit/reddit-opportunity-actions";
import { getRedditOpportunityDetail } from "@/lib/db/reddit-opportunity-detail";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RedditOpportunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ source?: string }>;
}) {
  const { id } = await params;
  const { source } = await searchParams;
  const detail = await getRedditOpportunityDetail(id, source ?? "oauth");
  if (!detail) notFound();

  return (
    <div>
      <PageHeader title={detail.title} description={`Reddit opportunity · ${detail.sourceLabel}`} />

      <Link href="/reddit" className="mb-4 inline-block text-sm text-brand-accent underline">
        Back to Reddit
      </Link>

      <div className="mb-6 flex flex-wrap gap-2">
        {detail.subreddit && <Badge variant="muted">r/{detail.subreddit}</Badge>}
        <Badge variant="info">{detail.sourceLabel}</Badge>
        {detail.priority && <Badge variant="warning">{detail.priority}</Badge>}
        <Badge variant="success">Relevance {detail.relevanceScore}/100</Badge>
        <Badge variant="info">Plant confidence {detail.plantConfidenceScore}/100</Badge>
      </div>

      <div className="mb-6 rounded-xl border border-brand-border bg-white p-4">
        <h3 className="text-sm font-semibold text-brand-primary">Why this matched</h3>
        <p className="mt-1 text-sm text-brand-muted">{detail.selectionReason}</p>
        {detail.matchedKeywords.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase text-brand-muted">Matched</p>
            <ul className="mt-1 list-inside list-disc text-sm text-brand-primary">
              {detail.matchedKeywords.map((kw) => (
                <li key={kw}>{kw}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-brand-border bg-white p-5">
          <h3 className="text-sm font-semibold text-brand-primary">Original Reddit post</h3>
          <p className="mt-0.5 text-xs text-brand-muted">
            {detail.author ? `u/${detail.author}` : "Unknown"} · {formatDate(detail.createdAt)}
          </p>
          <p className="mt-3 whitespace-pre-wrap text-sm text-brand-muted">{detail.body}</p>
          {detail.url && (
            <a href={detail.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-brand-accent underline">
              Open source
            </a>
          )}
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
          <h3 className="text-sm font-semibold text-brand-primary">PlantPal suggested reply</h3>
          {detail.draftReply ? (
            <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-white p-3 text-sm text-brand-primary">{detail.draftReply}</pre>
          ) : (
            <p className="mt-3 text-sm text-brand-muted">No draft yet. Use Draft Reply to generate one.</p>
          )}
        </div>
      </div>

      <RedditOpportunityActions
        opportunityId={detail.id}
        source={detail.source}
        draftId={detail.draftId}
        configured={detail.oauthConfigured}
        permalink={detail.url}
      />
    </div>
  );
}
