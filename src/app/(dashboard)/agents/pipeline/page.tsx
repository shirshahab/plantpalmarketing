import { PageHeader } from "@/components/ui/page-header";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { ContentRouterPanel } from "@/components/pipeline/content-router-panel";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import { getContentRouterData } from "@/lib/pipeline/content-router-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function ContentPipelinePage() {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <PageHeader title="Content Router" />
        <ConfigBanner />
      </div>
    );
  }

  const { data, error } = await fetchPageData(getContentRouterData);

  return (
    <div>
      <PageHeader
        title="Content Router"
        description="Content staging area — routes Bloom-approved concepts to Video, Image, SEO, and Calendar."
      />
      {error && <ErrorBanner message={error} />}
      {data && <ContentRouterPanel data={data} />}
    </div>
  );
}
