import { ThumbsUp } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { EmptyState } from "@/components/ui/empty-state";
import { PipelineContentCard } from "@/components/agents/pipeline-content-card";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import { getPipelineContent } from "@/lib/db/agent-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function ApprovedContentPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <PageHeader title="Approved Content" />
        <ConfigBanner />
      </div>
    );
  }

  const { data, error } = await fetchPageData(() => getPipelineContent("approved"));

  return (
    <div>
      <PageHeader
        title="Approved Content"
        description="Human-approved pipeline content ready for scheduling or publishing."
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
            icon={ThumbsUp}
            title="No approved content"
            description="Approve items from the Content Pipeline to see them here."
          />
        )
      )}
    </div>
  );
}
