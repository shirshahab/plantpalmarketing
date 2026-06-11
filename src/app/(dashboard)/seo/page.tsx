import { PageHeader } from "@/components/ui/page-header";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { SeoKeywordPanel } from "@/components/seo/seo-keyword-panel";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import { getSeoPageData } from "@/lib/db/seo-queries";

export const dynamic = "force-dynamic";

export default async function SeoPage() {
  const { data, error, configured } = await fetchPageData(getSeoPageData);

  if (!configured) {
    return (
      <div>
        <PageHeader title="SEO Blog" />
        <ConfigBanner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="SEO Blog Automation"
        description="Roots finds questions → Bloom writes short funny answers → voice check → Gate approves → Sprout publishes. 500-900 words, zero fluff, zero em dashes."
      />
      {error && <ErrorBanner message={error} />}
      {data && (
        <SeoKeywordPanel
          keywords={data.keywords}
          posts={data.posts}
          logs={data.logs}
          topics={data.topics}
          clusters={data.clusters}
          rankRows={data.rankRows}
          stats={data.stats}
        />
      )}
    </div>
  );
}
