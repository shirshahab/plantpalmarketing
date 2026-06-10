import { Workflow } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { EmptyState } from "@/components/ui/empty-state";
import { PipelineContentCard } from "@/components/agents/pipeline-content-card";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import { getPipelineContent } from "@/lib/db/agent-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function ContentPipelinePage() {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <PageHeader title="Content Pipeline" />
        <ConfigBanner />
      </div>
    );
  }

  const { data, error } = await fetchPageData(() => getPipelineContent("pending_review"));

  return (
    <div>
      <PageHeader
        title="Content Pipeline"
        description="Content that passed the Creative Director (≥80) and awaits human approval."
      />
      {error && <ErrorBanner message={error} />}

      {data && data.length > 0 ? (
        <div className="grid gap-4">
          {data.map((item) => (
            <PipelineContentCard key={item.id} item={item} showActions />
          ))}
        </div>
      ) : (
        !error && (
          <EmptyState
            icon={Workflow}
            title="Pipeline empty"
            description="Run the daily agent pipeline or check Content Scores for all generated pieces."
          />
        )
      )}
    </div>
  );
}
