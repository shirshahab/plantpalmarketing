import { MessageSquare, Shield } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { ApprovalActions } from "@/components/shared/approval-actions";
import { DeleteButton } from "@/components/shared/delete-button";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import { getReplyDrafts } from "@/lib/db/queries";
import { formatDate } from "@/lib/utils";

export default async function SocialReplyDraftsPage() {
  const { data, error, configured } = await fetchPageData(getReplyDrafts);

  if (!configured) {
    return (<div><PageHeader title="Social Reply Drafts" /><ConfigBanner /></div>);
  }

  const pending = data?.filter((r) => r.status === "pending").length ?? 0;
  const approved = data?.filter((r) => r.status === "approved").length ?? 0;
  const rejected = data?.filter((r) => r.status === "rejected").length ?? 0;

  return (
    <div>
      <PageHeader title="Social Reply Drafts" description="AI-drafted replies. Nothing posts without your approval." />
      {error && <ErrorBanner message={error} />}

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-brand-border bg-white p-4">
          <MessageSquare className="h-5 w-5 text-amber-600" />
          <div><p className="text-2xl font-bold text-brand-primary">{pending}</p><p className="text-xs text-brand-muted">Pending</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-brand-border bg-white p-4">
          <Shield className="h-5 w-5 text-brand-accent" />
          <div><p className="text-2xl font-bold text-brand-primary">{approved}</p><p className="text-xs text-brand-muted">Approved (not posted)</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-brand-border bg-white p-4">
          <MessageSquare className="h-5 w-5 text-red-500" />
          <div><p className="text-2xl font-bold text-brand-primary">{rejected}</p><p className="text-xs text-brand-muted">Rejected</p></div>
        </div>
      </div>

      {!data || data.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No reply drafts" description="Seed data will populate reply drafts." />
      ) : (
        <div className="space-y-4">
          {data.map((reply) => (
            <Card key={reply.id}>
              <CardContent className="py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="info">{reply.platform}</Badge>
                      <span className="text-xs text-brand-muted">{formatDate(reply.createdAt)}</span>
                    </div>
                    <div className="mt-3 rounded-xl bg-brand-bg p-3">
                      <p className="text-xs font-semibold text-brand-sage">Original post</p>
                      <p className="mt-1 text-sm text-brand-muted">{reply.originalPost}</p>
                    </div>
                    <div className="mt-3 rounded-xl border border-brand-border p-3">
                      <p className="text-xs font-semibold text-brand-primary">Draft reply</p>
                      <p className="mt-1 text-sm leading-relaxed">{reply.draft}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <ApprovalActions table="reply_drafts" id={reply.id} initialStatus={reply.status} />
                    <DeleteButton table="reply_drafts" id={reply.id} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
