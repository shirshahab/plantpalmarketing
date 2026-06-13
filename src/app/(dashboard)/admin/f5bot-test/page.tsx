import { PageHeader } from "@/components/ui/page-header";
import { F5BotTestPanel } from "@/components/admin/f5bot-test-panel";
import { F5BotSetupCard } from "@/components/intelligence/f5bot-setup-card";
import { getF5BotSetupStatus } from "@/lib/intelligence/f5bot-setup-status";

export const dynamic = "force-dynamic";

export default function F5BotTestPage() {
  return (
    <div>
      <PageHeader
        title="F5Bot Test"
        description="Phase 1 to 3. Test the feed, classify alerts, and save to Supabase intelligence_alerts."
      />
      <F5BotSetupCard status={getF5BotSetupStatus()} />
      <F5BotTestPanel />
    </div>
  );
}
