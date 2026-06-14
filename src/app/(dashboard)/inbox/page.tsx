import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { ConfigBanner } from "@/components/ui/config-banner";
import { EmptyState } from "@/components/ui/empty-state";
import { FounderInboxPanel } from "@/components/inbox/founder-inbox-panel";
import { getFounderInbox } from "@/lib/workflow/inbox-queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Inbox } from "lucide-react";

export default async function FounderInboxPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <PageHeader title="Founder Inbox" />
        <ConfigBanner />
      </div>
    );
  }

  const inbox = await getFounderInbox();

  return (
    <div>
      <PageHeader
        title="Founder Inbox"
        description="Tabbed work queues — replies, ideas, creative reviews, SEO, creators, and intelligence."
      />

      <div className="mb-8 rounded-2xl border border-brand-primary/20 bg-brand-primary/5 px-4 py-3 text-sm text-brand-primary">
        <strong>{inbox.totalPending} items</strong> need founder action.
      </div>

      {inbox.totalPending === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Inbox clear"
          description="Nothing waiting on you right now. Run F5Bot ingest or Daily Engine for new opportunities."
        />
      ) : (
        <Suspense fallback={<p className="text-sm text-brand-muted">Loading inbox…</p>}>
          <FounderInboxPanel inbox={inbox} />
        </Suspense>
      )}
    </div>
  );
}
