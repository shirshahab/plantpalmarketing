import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ContentFactoryPanel } from "@/components/content-factory/content-factory-panel";
import { getContentFactoryStats } from "@/lib/pipeline/content-factory-stats";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function ContentFactoryPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <PageHeader title="Content Factory" />
        <ConfigBanner />
      </div>
    );
  }

  const stats = await getContentFactoryStats();

  return (
    <div>
      <PageHeader
        title="Content Factory"
        description="Daily production targets, weekly output, and pipeline health at a glance."
      />
      <ContentFactoryPanel stats={stats} />
      <p className="mt-6 text-sm text-brand-muted">
        Run the{" "}
        <Link href="/system-health" className="text-brand-accent underline">
          daily engine
        </Link>{" "}
        from System Health to fill all pipelines.
      </p>
    </div>
  );
}
