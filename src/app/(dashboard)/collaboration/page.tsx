import { GitBranch } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { CollaborationPanel } from "@/components/collaboration/collaboration-panel";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import {
  getAgentEvents,
  getAgentMessages,
  getActiveAgentTasks,
  getCompletedAgentTasks,
  getCollaborationStats,
} from "@/lib/db/collaboration-queries";

async function loadCollaborationData() {
  const [messages, activeTasks, completedTasks, events, stats] = await Promise.all([
    getAgentMessages(),
    getActiveAgentTasks(),
    getCompletedAgentTasks(),
    getAgentEvents(),
    getCollaborationStats(),
  ]);
  return { messages, activeTasks, completedTasks, events, stats };
}

export default async function CollaborationPage() {
  const { data, error, configured } = await fetchPageData(loadCollaborationData);

  if (!configured) {
    return (
      <div>
        <PageHeader title="Agent Collaboration" />
        <ConfigBanner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Agent Collaboration"
        description="Company-wide messaging, task delegation, and activity stream across all PlantPal agents."
      />
      <div className="mb-6 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
        Agents no longer operate independently. Scout hands off to Oak and Bloom. Roots feeds Echo and Bloom. Sentinel alerts Atlas. Echo informs Atlas. Atlas briefs Ivy. Ivy directs everyone. Gate clears content to Sprout.
      </div>
      {error && <ErrorBanner message={error} />}

      {data ? (
        <CollaborationPanel {...data} />
      ) : (
        !error && (
          <EmptyState
            icon={GitBranch}
            title="Collaboration system not initialized"
            description="Run migrations 025 + 026 to enable agent messaging, tasks, and events."
          />
        )
      )}
    </div>
  );
}
