import { unstable_noStore as noStore } from "next/cache";
import { connection } from "next/server";
import { PlantPalHQ } from "@/components/hq/plantpal-hq";
import { ConfigBanner } from "@/components/ui/config-banner";
import { buildHQActivity, buildHQAgents } from "@/lib/hq/build-hq-data";
import { HQ_AGENTS, HQ_ACTIVITY } from "@/lib/hq/mock-data";
import Link from "next/link";
import { getHQAgentScheduleHealth } from "@/lib/db/agent-operations-queries";
import { getHQAgentData } from "@/lib/db/scout-roots-queries";
import { getAgentDecisions, getAgentMemories } from "@/lib/db/agent-brain-queries";
import { probeHQLiveData } from "@/lib/db/hq-debug";
import { isNextBuildPhase } from "@/lib/build-phase";
import { defaultHQWeatherState } from "@/lib/hq/hq-weather";
import { fetchHQWeather } from "@/lib/hq/hq-weather-service";
import { mergeWeatherActivity } from "@/lib/hq/weather-activity";
import { isSupabaseConfigured } from "@/lib/supabase/config";
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

  let agents = HQ_AGENTS;
  let activity = HQ_ACTIVITY;
  let liveData = false;
  let messageLines: MessageLine[] = [];
  let collaborationStats: { unreadMessages: number; activeTasks: number } | undefined;
  let collaborationMessages: AgentMessage[] = [];
  let collaborationTasks: AgentTask[] = [];
  let agentMemories: AgentMemory[] = [];
  let agentDecisions: AgentDecision[] = [];
  let hqLoadError: string | null = null;
  let hqDebugSummary: string | null = null;
  let weather = defaultHQWeatherState();
  let agentScheduleHealth: HQAgentScheduleHealth[] = [];

  if (!skipLiveFetch) {
    weather = await fetchHQWeather();
    activity = mergeWeatherActivity(activity, weather);
  }

  if (configured && !skipLiveFetch) {
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
      console.error("[HQ] getHQAgentData failed — demo mode active:", hqLoadError);
      const probe = await probeHQLiveData();
      hqDebugSummary = probe.summary;
      if (probe.failedStep) {
        console.error("[HQ] failed query:", probe.failedStep.label);
        console.error("[HQ] table:", probe.failedStep.table);
        console.error("[HQ] supabase code:", probe.failedStep.errorCode);
        console.error("[HQ] supabase error:", probe.failedStep.errorMessage);
      }
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
        <div className="mb-4 mx-4 sm:mx-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 space-y-2">
          <p>
            <strong>Demo mode active.</strong> Condition: <code className="rounded bg-white px-1">getHQAgentData()</code> threw — see error below (server console also logs details).
          </p>
          {hqLoadError && (
            <p className="font-mono text-xs text-rose-800 bg-white/80 rounded-lg px-2 py-1.5 break-all">
              Error: {hqLoadError}
            </p>
          )}
          {hqDebugSummary && <p>{hqDebugSummary}</p>}
          <p>
            <Link href="/debug/database" className="font-medium text-amber-900 underline">
              Open /debug/database
            </Link>{" "}
            for full table + column diagnostics.
          </p>
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
      />
    </div>
  );
}
