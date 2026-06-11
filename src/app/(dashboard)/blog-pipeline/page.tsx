import { PageHeader } from "@/components/ui/page-header";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { BlogPipelinePanel } from "@/components/seo/blog-pipeline-panel";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import { getSeoPageData } from "@/lib/db/seo-queries";

export const dynamic = "force-dynamic";

export default async function BlogPipelinePage() {
  const { data, error, configured } = await fetchPageData(getSeoPageData);

  if (!configured) {
    return (
      <div>
        <PageHeader title="Blog Pipeline" />
        <ConfigBanner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Blog Pipeline"
        description="Draft queue → brand voice check → founder approval → publish. Nothing goes live without your click unless auto-publishing is explicitly enabled for low-risk posts."
      />
      {error && <ErrorBanner message={error} />}
      {data && <BlogPipelinePanel posts={data.posts} cmsConfigured={data.cmsConfigured} />}
    </div>
  );
}
