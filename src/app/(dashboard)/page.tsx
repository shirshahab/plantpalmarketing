import { unstable_noStore as noStore } from "next/cache";
import { connection } from "next/server";
import { PlantPalHQ } from "@/components/hq/plantpal-hq";
import { ConfigBanner } from "@/components/ui/config-banner";
import { LiveEmptyState } from "@/components/shared/live-empty-state";
import { buildHQActivity, buildHQAgents } from "@/lib/hq/build-hq-data";
import { HQ_AGENTS, HQ_ACTIVITY } from "@/lib/hq/mock-data";
import { shouldShowDemoData } from "@/lib/demo/shouldShowDemoData";
import { getHQAgentScheduleHealth } from "@/lib/db/agent-operations-queries";
import { getHQAgentData } from "@/lib/db/scout-roots-queries";
import { getAgentDecisions, getAgentMemories } from "@/lib/db/agent-brain-queries";
import { probeHQLiveData } from "@/lib/db/hq-debug";
import { isNextBuildPhase } from "@/lib/build-phase";
import { defaultHQWeatherState } from "@/lib/hq/hq-weather";
import { fetchHQWeather } from "@/lib/hq/hq-weather-service";
import { mergeWeatherActivity } from "@/lib/hq/weather-activity";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getInternetPulseDashboard } from "@/lib/intelligence/intelligence-engine";
import type { InternetPulseDashboard } from "@/lib/intelligence/intelligence-engine";
import type { HQAgentScheduleHealth } from "@/lib/agent-worker/types";
import type { AgentDecision, AgentMemory, AgentMessage, AgentSlug, AgentTask, CollaborationPriority } from "@/lib/types";

type MessageLine = { from: AgentSlug; to: AgentSlug; priority: CollaborationPriority; id: string };

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function PlantPalHQPage() {
  await connection();
  noStore();

  const configured = isSupabaseConfigured();
  const skipLiveFetch = isNextBuildPhase();

  let agents = shouldShowDemoData() ? HQ_AGENTS : [];
  let activity = shouldShowDemoData() ? HQ_ACTIVITY : [];
  let liveData = false;
  let messageLines: MessageLine[] = [];
  let collaborationStats: { unreadMessages: number; activeTasks: number } | undefined;
  let collaborationMessages: AgentMessage[] = [];
  let collaborationTasks: AgentTask[] = [];
  let agentMemories: AgentMemory[] = [];
  let agentDecisions: AgentDecision[] = [];
  let hqLoadError: string | null = null;
  let weather = defaultHQWeatherState();
  let agentScheduleHealth: HQAgentScheduleHealth[] = [];
  let internetPulse: InternetPulseDashboard | null = null;

  if (!skipLiveFetch) {
    weather = await fetchHQWeather();
    if (activity.length > 0) {
      activity = mergeWeatherActivity(activity, weather);
    }
  }

  if (configured && !skipLiveFetch) {
    internetPulse = await getInternetPulseDashboard().catch(() => null);
    try {
      const [data, memories, decisions, scheduleHealth] = await Promise.all([
        getHQAgentData(),
        getAgentMemories(undefined, 40).catch(() => []),
        getAgentDecisions(undefined, 30).catch(() => []),
        getHQAgentScheduleHealth().catch(() => []),
      ]);
      agentScheduleHealth = scheduleHealth;
      agents = buildHQAgents(data);
      activity = mergeWeatherActivity(buildHQActivity(data), weather);
      messageLines = data.collaboration?.activeMessageLines ?? [];
      collaborationStats = data.collaboration
        ? { unreadMessages: data.collaboration.stats.unreadMessages, activeTasks: data.collaboration.stats.activeTasks }
        : undefined;
      collaborationMessages = data.collaboration?.messages ?? [];
      collaborationTasks = data.collaboration?.activeTasks ?? [];
      agentMemories = memories;
      agentDecisions = decisions;
      liveData = true;
    } catch (e) {
      hqLoadError = e instanceof Error ? e.message : String(e);
      console.error("[HQ] getHQAgentData failed:", hqLoadError);
      await probeHQLiveData();
    }
  }

  return (
    <div className="-mx-4 -my-6 sm:-mx-6 lg:-mx-8 lg:-my-8">
      {!configured && (
        <div className="mb-4 px-4 sm:px-6">
          <ConfigBanner />
        </div>
      )}
      {configured && !liveData && !skipLiveFetch && (
        <div className="mb-4 mx-4 sm:mx-6">
          {shouldShowDemoData() ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 space-y-2">
              <p>
                <strong>Demo mode active.</strong> Set <code className="rounded bg-white px-1">NEXT_PUBLIC_SHOW_DEMO_DATA=false</code> for live-only HQ.
              </p>
              {hqLoadError && (
                <p className="font-mono text-xs text-rose-800 bg-white/80 rounded-lg px-2 py-1.5 break-all">
                  Error: {hqLoadError}
                </p>
              )}
            </div>
          ) : (
            <LiveEmptyState
              title="HQ waiting for live data"
              description="Connect Supabase and run the daily engine to populate agents, activity, and intelligence."
              actions={[
                { label: "Run Daily Engine", href: "/agent-operations" },
                { label: "System Health", href: "/system-health" },
                { label: "Check Integrations", href: "/integrations" },
              ]}
            />
          )}
        </div>
      )}
      <PlantPalHQ
        initialAgents={agents}
        initialActivity={activity}
        messageLines={messageLines}
        collaborationStats={collaborationStats}
        collaborationMessages={collaborationMessages}
        collaborationTasks={collaborationTasks}
        agentMemories={agentMemories}
        agentDecisions={agentDecisions}
        weather={weather}
        liveDataAvailable={configured && liveData}
        agentScheduleHealth={agentScheduleHealth}
        internetPulse={internetPulse}
      />
    </div>
  );
}
