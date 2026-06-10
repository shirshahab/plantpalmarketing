import { FileText } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { CreateSocialPostForm } from "@/components/forms/create-social-post-form";
import { EditSocialPostForm } from "@/components/forms/edit-social-post-form";
import { DeleteButton } from "@/components/shared/delete-button";
import { ApprovalActions } from "@/components/shared/approval-actions";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import { getSocialPosts } from "@/lib/db/queries";
import { formatDate } from "@/lib/utils";

export default async function SocialPostsPage() {
  const { data, error, configured } = await fetchPageData(getSocialPosts);

  if (!configured) {
    return (
      <div>
        <PageHeader title="Social Posts" />
        <ConfigBanner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Social Posts"
        description="Draft captions and hashtags for every platform. Approve before scheduling — nothing auto-posts."
        action={<CreateSocialPostForm />}
      />
      {error && <ErrorBanner message={error} />}

      {!data || data.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No social posts yet"
          description="Create your first post draft using the button above."
        />
      ) : (
        <div className="space-y-4">
          {data.map((post) => (
            <Card key={post.id}>
              <CardContent className="py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="info">{post.platform}</Badge>
                      <StatusBadge status={post.status} />
                      <span className="text-xs text-brand-muted">{formatDate(post.createdAt)}</span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed">{post.caption}</p>
                    {post.hashtags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {post.hashtags.map((tag) => (
                          <span key={tag} className="rounded-lg bg-brand-bg px-2 py-1 text-xs text-brand-muted">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <ApprovalActions table="social_posts" id={post.id} initialStatus={post.status} />
                    <EditSocialPostForm post={post} />
                    <DeleteButton table="social_posts" id={post.id} />
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
