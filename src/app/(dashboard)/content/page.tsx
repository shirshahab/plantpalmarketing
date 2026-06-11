import { PageHeader } from "@/components/ui/page-header";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { CreativeEngine } from "@/components/creative/creative-engine";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import { getCreativeContentIdeas } from "@/lib/db/queries";
import { isOpenAIConfigured } from "@/lib/openai/config";

export default async function ContentEnginePage() {
  const { data, error, configured } = await fetchPageData(getCreativeContentIdeas);
  const openaiReady = isOpenAIConfigured();

  if (!configured) {
    return (
      <div>
        <PageHeader title="Creative Content Engine" />
        <ConfigBanner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Creative Content Engine"
        description="Story-driven, shareable PlantPal content — built like a top creator team, not a corporate blog."
      />

      {!openaiReady && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Add <code className="rounded bg-white px-1">OPENAI_API_KEY</code> to{" "}
          <code className="rounded bg-white px-1">.env.local</code> to enable AI generation.
        </div>
      )}

      {error && <ErrorBanner message={error} />}

      <CreativeEngine ideas={data ?? []} />
    </div>
  );
}
