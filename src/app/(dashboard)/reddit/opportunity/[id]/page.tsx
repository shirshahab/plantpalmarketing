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

      <div className="mb-6 space-y-4 rounded-2xl border border-brand-border bg-white p-5">
        <div className="flex flex-wrap gap-2">
          {detail.subreddit && <Badge variant="muted">r/{detail.subreddit}</Badge>}
          <Badge variant="info">{detail.sourceLabel}</Badge>
          {detail.priority && <Badge variant="warning">{detail.priority}</Badge>}
          <Badge variant="muted">Confidence: {detail.confidenceScore}/10</Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Meta label="Author" value={detail.author ? `u/${detail.author}` : "Unknown"} />
          <Meta label="Timestamp" value={formatDate(detail.createdAt)} />
          <Meta label="Matched keyword" value={detail.matchedKeyword || "—"} />
          <Meta label="Why selected" value={detail.selectionReason} />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-brand-primary">Original post</h3>
          <p className="mt-1 whitespace-pre-wrap text-sm text-brand-muted">{detail.body}</p>
        </div>

        {detail.url && (
          <a href={detail.url} target="_blank" rel="noopener noreferrer" className="break-all text-sm text-brand-accent underline">
            Open source
          </a>
        )}

        {detail.draftReply && (
          <div>
            <h3 className="text-sm font-semibold text-brand-primary">Generated reply</h3>
            <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-brand-bg p-3 text-sm">{detail.draftReply}</pre>
          </div>
        )}
      </div>

      <RedditOpportunityActions
        opportunityId={detail.id}
        source={detail.source}
        draftId={detail.draftId}
        configured={detail.oauthConfigured}
      />
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">{label}</p>
      <p className="text-sm text-brand-primary">{value}</p>
    </div>
  );
}
