import { unstable_noStore as noStore } from "next/cache";
import { connection } from "next/server";
import { PageHeader } from "@/components/ui/page-header";
import { ConfigBanner } from "@/components/ui/config-banner";
import { DatabaseDebugPanel } from "@/components/debug/database-debug-panel";
import { probeHQLiveData, runDatabaseHealthChecks } from "@/lib/db/hq-debug";
import { isNextBuildPhase } from "@/lib/build-phase";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function DatabaseDebugPage() {
  await connection();
  noStore();

  const configured = isSupabaseConfigured();

  if (!configured) {
    return (
      <div>
        <PageHeader title="Database Debug" description="HQ live-mode table diagnostics" />
        <ConfigBanner />
      </div>
    );
  }

  if (isNextBuildPhase()) {
    return (
      <div>
        <PageHeader title="Database Debug" description="HQ live-mode table diagnostics" />
        <p className="text-sm text-brand-muted">Database probes run at request time after deploy.</p>
      </div>
    );
  }

  const [probe, checks] = await Promise.all([probeHQLiveData(), runDatabaseHealthChecks()]);

  return (
    <div>
      <PageHeader
        title="Database Debug"
        description="Checks every table/query required for HQ live mode (Scout, Roots, Sentinel, collaboration)."
      />
      <DatabaseDebugPanel probe={probe} checks={checks} />
    </div>
  );
}
