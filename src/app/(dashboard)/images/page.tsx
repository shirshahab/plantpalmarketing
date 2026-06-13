import { ImageIcon } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { ImageStudioTabs } from "@/components/images/image-studio-tabs";
import { getImageStudioCounters } from "@/lib/actions/image-batch-actions";
import { isVisibleImagePromptRow } from "@/lib/pipeline/creative-routing-health";
import { DeleteButton } from "@/components/shared/delete-button";
import { ApprovalActions } from "@/components/shared/approval-actions";
import { ImageAssetPanel } from "@/components/assets/image-asset-panel";
import { imageCategories } from "@/components/layout/nav-items";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import { getImagePrompts } from "@/lib/db/queries";
import { getAssetsByPrompt } from "@/lib/db/asset-queries";
import { formatDate } from "@/lib/utils";

const categoryLabels: Record<string, string> = {
  social_graphic: "Social Graphic", app_screenshot: "App Screenshot",
  educational: "Educational Visual", before_after: "Before / After",
};

type ImageTab = "pending" | "approved" | "rejected" | "scheduled";

export default async function ImagePromptsPage({
  searchParams,
}: {
  searchParams: Promise<{ asset?: string; tab?: string }>;
}) {
  const { asset: highlightAssetId, tab: tabParam } = await searchParams;
  const activeTab = (["pending", "approved", "rejected", "scheduled"].includes(tabParam ?? "")
    ? tabParam
    : "pending") as ImageTab;

  const { data, error, configured } = await fetchPageData(getImagePrompts);
  const assetsByPrompt = configured ? await getAssetsByPrompt().catch(() => new Map()) : new Map();
  const counters = configured ? await getImageStudioCounters().catch(() => ({
    pendingReview: 0, approvedToday: 0, rejectedToday: 0, scheduled: 0, published: 0,
  })) : { pendingReview: 0, approvedToday: 0, rejectedToday: 0, scheduled: 0, published: 0 };

  const filtered = (data ?? []).filter((p) => {
    if (activeTab === "scheduled") return p.status === "approved";
    if (p.status !== activeTab) return false;
    if (activeTab === "pending") {
      return isVisibleImagePromptRow({
        title: p.title,
        status: p.status,
        sourceTable: p.sourceTable,
        metadata: p.metadata as Record<string, unknown> | undefined,
      });
    }
    return true;
  });

  if (!configured) {
    return (<div><PageHeader title="Image Prompt Generator" /><ConfigBanner /></div>);
  }

  return (
    <div>
      <PageHeader
        title="Image Asset Studio"
        description="Image concepts from approved Bloom ideas. Raw internet signals stay in Intelligence until Bloom transforms them."
      />
      <ImageStudioTabs counters={counters} activeTab={activeTab} />
      {error && <ErrorBanner message={error} />}

      <div className="mb-8 flex flex-wrap gap-2">
        {imageCategories.map((cat) => (
          <Badge key={cat.key} variant="muted" className="px-3 py-1.5 text-sm">{cat.label}</Badge>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ImageIcon} title={`No ${activeTab} image concepts`} description="Send approved ideas from Bloom, SEO, or Trends. Raw F5Bot/Reddit never enters Image Studio directly." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((prompt) => {
            const asset = assetsByPrompt.get(prompt.id) ?? null;
            const highlighted = asset?.id === highlightAssetId;
            return (
            <Card key={prompt.id} className={highlighted ? "ring-2 ring-brand-accent" : undefined}>
              <CardContent className="py-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-sage/20 text-brand-primary">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="info">{categoryLabels[prompt.category]}</Badge>
                      <StatusBadge status={prompt.status} />
                    </div>
                    <h3 className="font-heading mt-2 font-semibold text-brand-primary">{prompt.title}</h3>
                    <p className="mt-1 text-xs text-brand-muted">Style: {prompt.style} · {formatDate(prompt.createdAt)}</p>
                    <div className="mt-3 rounded-xl bg-brand-bg p-3">
                      <p className="font-mono text-xs leading-relaxed">{prompt.prompt}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <ApprovalActions table="image_prompts" id={prompt.id} initialStatus={prompt.status} />
                      <DeleteButton table="image_prompts" id={prompt.id} />
                    </div>
                    <ImageAssetPanel
                      promptId={prompt.id}
                      promptText={prompt.prompt}
                      promptApproved={prompt.status === "approved"}
                      asset={asset}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
