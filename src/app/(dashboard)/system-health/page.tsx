import { PageHeader } from "@/components/ui/page-header";
import { ConfigBanner } from "@/components/ui/config-banner";
import { SystemHealthPanel } from "@/components/system-health/system-health-panel";
import { SystemHealthActions } from "@/components/system-health/system-health-actions";
import { getSystemPipelineHealth, getDemoAuditCount } from "@/lib/pipeline/system-health";
import { getIntegrationTrafficLights } from "@/lib/pipeline/integration-traffic-lights";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function SystemHealthPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <PageHeader title="System Health" />
        <ConfigBanner />
      </div>
    );
  }

  const [pipelines, integrations, demoCount] = await Promise.all([
    getSystemPipelineHealth(),
    getIntegrationTrafficLights(),
    getDemoAuditCount(),
  ]);

  return (
    <div>
      <PageHeader
        title="System Health"
        description="HQ command center. Every pipeline from ideas to publish, with live status."
      />
      <SystemHealthPanel pipelines={pipelines} integrations={integrations} />
      <div className="mt-4">
        <SystemHealthActions demoCount={demoCount} />
      </div>
    </div>
  );
}
