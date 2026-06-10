import { ThumbsDown } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { EmptyState } from "@/components/ui/empty-state";
import { PipelineContentCard } from "@/components/agents/pipeline-content-card";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import { getPipelineContent } from "@/lib/db/agent-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function RejectedContentPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <PageHeader title="Rejected Content" />
        <ConfigBanner />
      </div>
    );
  }

  const { data, error } = await fetchPageData(() => getPipelineContent("rejected"));

  return (
    <div>
      <PageHeader
        title="Rejected Content"
        description="Pieces rejected by the Creative Director (failed after rewrites) or by human review."
      />
      {error && <ErrorBanner message={error} />}

      {data && data.length > 0 ? (
        <div className="grid gap-4">
          {data.map((item) => (
            <PipelineContentCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        !error && (
          <EmptyState
            icon={ThumbsDown}
            title="No rejected content"
            description="Rejected pieces will appear here after agent runs or human review."
          />
        )
      )}
    </div>
  );
}
