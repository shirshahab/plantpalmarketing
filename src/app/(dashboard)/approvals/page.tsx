import { CheckSquare } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { CreateApprovalForm } from "@/components/forms/create-approval-form";
import { EditApprovalForm } from "@/components/forms/edit-approval-form";
import { ApprovalActions } from "@/components/shared/approval-actions";
import { ApprovalFeedbackActions } from "@/components/shared/approval-feedback-actions";
import { DataSourceBadge, SourceContext } from "@/components/shared/source-context";
import { DeleteButton } from "@/components/shared/delete-button";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import { getApprovalQueue } from "@/lib/db/queries";
import { formatDate } from "@/lib/utils";

const typeLabels: Record<string, string> = {
  content: "Content Idea", reply: "Reply Draft", image_prompt: "Image Prompt",
  video_script: "Video Script", social_post: "Social Post",
};

export default async function ApprovalQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ item?: string; status?: string }>;
}) {
  const { item: highlightId, status: statusFilter } = await searchParams;
  const { data, error, configured } = await fetchPageData(getApprovalQueue);

  if (!configured) {
    return (<div><PageHeader title="Approval Queue" /><ConfigBanner /></div>);
  }

  let pending = data?.filter((i) => i.status === "pending") ?? [];
  let reviewed = data?.filter((i) => i.status !== "pending") ?? [];

  // ?status= filter from brief actions / dashboard tiles
  if (statusFilter && statusFilter !== "pending") {
    reviewed = reviewed.filter((i) => i.status === statusFilter);
  }

  // ?item= deep link — surface the exact item first
  if (highlightId) {
    const sortFirst = <T extends { id: string }>(list: T[]) =>
      [...list].sort((a, b) => (a.id === highlightId ? -1 : b.id === highlightId ? 1 : 0));
    pending = sortFirst(pending);
    reviewed = sortFirst(reviewed);
  }

  return (
    <div>
      <PageHeader title="Approval Queue" description="Review, edit, approve, or reject before anything goes live." action={<CreateApprovalForm />} />
      <div className="mb-6 rounded-2xl border border-brand-primary/20 bg-brand-primary/5 px-4 py-3 text-sm text-brand-primary">
        <strong>{pending.length} items</strong> waiting for review. Approved items still require manual posting.
      </div>
      {error && <ErrorBanner message={error} />}

      <h2 className="font-heading mb-4 text-lg font-semibold text-brand-primary">Pending Review</h2>
      {pending.length === 0 ? (
        <p className="mb-8 text-sm text-brand-muted">No pending items.</p>
      ) : (
        <div className="mb-10 space-y-3">
          {pending.map((item) => (
            <Card
              key={item.id}
              className={item.id === highlightId ? "ring-2 ring-brand-accent" : undefined}
            >
              <CardContent className="py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{typeLabels[item.type] ?? item.type}</Badge>
                      <Badge variant="muted">{item.channel}</Badge>
                      <DataSourceBadge dataSource={item.dataSource} platform={item.sourcePlatform || item.channel} />
                      <span className="text-xs text-brand-muted">{formatDate(item.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed">{item.draft}</p>
                    <SourceContext
                      dataSource={item.dataSource}
                      sourcePlatform={item.sourcePlatform}
                      sourceUrl={item.sourceUrl}
                      sourceAuthor={item.sourceAuthor}
                      sourceAuthorUrl={item.sourceAuthorUrl}
                      sourceTitle={item.sourceTitle}
                      sourceExcerpt={item.sourceExcerpt}
                    />
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <ApprovalFeedbackActions id={item.id} initialStatus={item.status} />
                    <EditApprovalForm item={item} />
                    <DeleteButton table="approval_queue" id={item.id} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <h2 className="font-heading mb-4 text-lg font-semibold text-brand-primary">Recently Reviewed</h2>
      {reviewed.length === 0 ? (
        <EmptyState icon={CheckSquare} title="No reviewed items yet" description="Approve or reject pending items above." />
      ) : (
        <div className="space-y-3">
          {reviewed.map((item) => (
            <Card
              key={item.id}
              className={item.id === highlightId ? "ring-2 ring-brand-accent" : "opacity-80"}
            >
              <CardContent className="py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="muted">{typeLabels[item.type] ?? item.type}</Badge>
                      <Badge variant="muted">{item.channel}</Badge>
                      <DataSourceBadge dataSource={item.dataSource} platform={item.sourcePlatform || item.channel} />
                      <span className="text-xs text-brand-muted">{formatDate(item.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-brand-muted">{item.draft}</p>
                    <SourceContext
                      dataSource={item.dataSource}
                      sourcePlatform={item.sourcePlatform}
                      sourceUrl={item.sourceUrl}
                      sourceAuthor={item.sourceAuthor}
                      sourceAuthorUrl={item.sourceAuthorUrl}
                      sourceTitle={item.sourceTitle}
                      sourceExcerpt={item.sourceExcerpt}
                    />
                  </div>
                  <ApprovalActions table="approval_queue" id={item.id} initialStatus={item.status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
