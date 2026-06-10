import { Brain } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfigBanner } from "@/components/ui/config-banner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { AgentBrainPanel } from "@/components/agent-brain/agent-brain-panel";
import { fetchPageData } from "@/lib/db/fetch-page-data";
import {
  getAgentBrainStats,
  getAgentConversations,
  getAgentDecisions,
  getAgentMemories,
  getAgentProfiles,
} from "@/lib/db/agent-brain-queries";
import { getAgentBrainStatus } from "@/lib/actions/agent-brain";

async function loadAgentBrainData() {
  const [profiles, memories, conversations, decisions, stats, brainStatus] = await Promise.all([
    getAgentProfiles(),
    getAgentMemories(),
    getAgentConversations(),
    getAgentDecisions(),
    getAgentBrainStats(),
    getAgentBrainStatus(),
  ]);
  return { profiles, memories, conversations, decisions, stats, ...brainStatus };
}

export default async function AgentBrainPage() {
  const { data, error, configured } = await fetchPageData(loadAgentBrainData);

  if (!configured) {
    return (
      <div>
        <PageHeader title="Agent Brain" />
        <ConfigBanner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Agent Brain"
        description="Phase 16 — Real AI workers powered by OpenAI with memory, context, and collaboration."
      />
      {error && <ErrorBanner message={error} />}

      {data ? (
        <AgentBrainPanel
          profiles={data.profiles}
          memories={data.memories}
          conversations={data.conversations}
          decisions={data.decisions}
          stats={data.stats}
          openaiConfigured={data.configured}
          model={data.model}
        />
      ) : (
        !error && (
          <EmptyState
            icon={Brain}
            title="Agent Brain not initialized"
            description="Run migrations 027 + 028, then add OPENAI_API_KEY to .env.local."
          />
        )
      )}
    </div>
  );
}
