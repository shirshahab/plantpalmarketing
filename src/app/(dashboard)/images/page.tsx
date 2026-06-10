import { ImageIcon } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { CreateImagePromptForm } from "@/components/forms/create-image-prompt-form";
import { DeleteButton } from "@/components/shared/delete-button";
import { ApprovalActions } from "@/components/shared/approval-actions";
import { imageCategories } from "@/components/layout/nav-items";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import { getImagePrompts } from "@/lib/db/queries";
import { formatDate } from "@/lib/utils";

const categoryLabels: Record<string, string> = {
  social_graphic: "Social Graphic", app_screenshot: "App Screenshot",
  educational: "Educational Visual", before_after: "Before / After",
};

export default async function ImagePromptsPage() {
  const { data, error, configured } = await fetchPageData(getImagePrompts);

  if (!configured) {
    return (<div><PageHeader title="Image Prompt Generator" /><ConfigBanner /></div>);
  }

  return (
    <div>
      <PageHeader title="Image Prompt Generator" description="AI-ready prompts for social graphics and plant visuals." action={<CreateImagePromptForm />} />
      {error && <ErrorBanner message={error} />}

      <div className="mb-8 flex flex-wrap gap-2">
        {imageCategories.map((cat) => (
          <Badge key={cat.key} variant="muted" className="px-3 py-1.5 text-sm">{cat.label}</Badge>
        ))}
      </div>

      {!data || data.length === 0 ? (
        <EmptyState icon={ImageIcon} title="No image prompts" description="Create your first prompt to get started." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((prompt) => (
            <Card key={prompt.id}>
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
