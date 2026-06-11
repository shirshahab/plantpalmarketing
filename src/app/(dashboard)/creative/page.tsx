import { PageHeader } from "@/components/ui/page-header";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { CreativePanel } from "@/components/creative/creative-panel";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import { getCreativePageData } from "@/lib/db/creative-queries";

export const dynamic = "force-dynamic";

export default async function CreativePage() {
  const { data, error, configured } = await fetchPageData(getCreativePageData);

  if (!configured) {
    return (
      <div>
        <PageHeader title="Creative Department" />
        <ConfigBanner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Fern — Creative Department"
        description="Images, videos, thumbnails, carousels, UGC, ads, blog headers. Fern generates variants, you approve, it ships. Every rejection makes her better."
      />
      {error && <ErrorBanner message={error} />}
      {data && <CreativePanel data={data} />}
    </div>
  );
}
