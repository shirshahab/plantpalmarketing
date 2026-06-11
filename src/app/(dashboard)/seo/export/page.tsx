import { PageHeader } from "@/components/ui/page-header";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { SeoExportPanel } from "@/components/seo/seo-export-panel";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import { getSeoExportPageData } from "@/lib/db/seo-queries";

export const dynamic = "force-dynamic";

export default async function SeoExportPage() {
  const { data, error, configured } = await fetchPageData(getSeoExportPageData);

  if (!configured) {
    return (
      <div>
        <PageHeader title="Website Blog Export" />
        <ConfigBanner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Website Blog Export"
        description="Approved SEO posts as drop-in TypeScript objects for the public site's src/lib/blog/posts.ts. Copy, paste, ship."
      />
      {error && <ErrorBanner message={error} />}
      {data && <SeoExportPanel posts={data.posts} stats={data.stats} cmsConfigured={data.cmsConfigured} />}
    </div>
  );
}
