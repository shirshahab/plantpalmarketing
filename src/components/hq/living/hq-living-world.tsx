"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { CloudRain, Leaf, Radio, Sparkles, Sun } from "lucide-react";
import { GARDEN_ZONES, AGENT_WORLD_POSITIONS } from "@/lib/hq/hq-world-layout";
import { getZoneHighlightIds } from "@/lib/hq/activity-to-choreography";
import { buildAgentActivityBubbles } from "@/lib/hq/agent-activity-bubbles";
import { HQInteractionPaths } from "@/components/hq/living/hq-interaction-paths";
import { HQWorkflowPath } from "@/components/hq/living/hq-workflow-path";
import { HQWalkingAgent } from "@/components/hq/living/hq-walking-agent";
import { useAgentChoreography } from "@/components/hq/living/use-agent-choreography";
import { HQDepartmentBuilding } from "@/components/hq/living/hq-department-building";
import { HQTerrainLayer } from "@/components/hq/living/hq-terrain-layer";
import { HQEnvironmentLayer } from "@/components/hq/living/hq-environment-layer";
import { HQDayNightOverlay } from "@/components/hq/living/hq-day-night-overlay";
import { HQWorldControls } from "@/components/hq/living/hq-world-controls";
import { HQHandoffBurst } from "@/components/hq/living/hq-handoff-burst";
import { HQActivityDock } from "@/components/hq/living/hq-activity-dock";
import { useWorldTime } from "@/components/hq/living/use-world-time";
import { useWorldViewport } from "@/components/hq/living/use-world-viewport";
import { useAmbientSound } from "@/components/hq/living/use-ambient-sound";
import { useHQWeather } from "@/components/hq/living/use-hq-weather";
import { HQAgentHealthCards } from "@/components/hq/living/hq-agent-health-cards";
import { DailyReportGenerateButton } from "@/components/daily-report/daily-report-generate-button";
import type { HQAgentScheduleHealth } from "@/lib/agent-worker/types";
import { getSeasonAccent } from "@/lib/hq/world-time";
import type { ActivityItem, AgentId, HQAgent } from "@/lib/hq/types";
import type { HQWeatherState } from "@/lib/hq/hq-weather";
import type { WorkflowChoreography } from "@/lib/hq/activity-to-choreography";
import type { AgentSlug, AgentTask, CollaborationPriority } from "@/lib/types";

export function HQLivingWorld({
  agents,
  activity,
  selectedId,
  onSelectAgent,
  onSelectActivity,
  onApproveActivity,
  onRejectActivity,
  messageLines = [],
  collaborationTasks = [],
  collaborationStats,
  weather,
  liveDataAvailable = true,
  liveActionLabel,
  onWorkflowStarted,
  onDailyReportGenerated,
  agentScheduleHealth = [],
}: {
  agents: HQAgent[];
  activity: ActivityItem[];
  selectedId: AgentId | null;
  onSelectAgent: (id: AgentId) => void;
  onSelectActivity: (id: string) => void;
  onApproveActivity?: (id: string) => void;
  onRejectActivity?: (id: string) => void;
  messageLines?: { from: AgentSlug; to: AgentSlug; priority: CollaborationPriority; id: string }[];
  collaborationTasks?: AgentTask[];
  collaborationStats?: { unreadMessages: number; activeTasks: number };
  weather: HQWeatherState;
  liveDataAvailable?: boolean;
  liveActionLabel?: string | null;
  onWorkflowStarted?: (workflow: WorkflowChoreography) => void;
  onDailyReportGenerated?: () => void;
  agentScheduleHealth?: HQAgentScheduleHealth[];
}) {
  const worldTime = useWorldTime();
  const viewport = useWorldViewport();
  const { weather: liveWeather } = useHQWeather(weather);
  const { enabled: soundEnabled, toggle: toggleSound } = useAmbientSound(liveWeather, worldTime.phase);
  const { motions, currentStep, activeWalk, activeWorkflow, handoffBurst } = useAgentChoreography({
    messageLines,
    activityItems: activity,
    agents,
    tasks: collaborationTasks,
    liveDataAvailable,
    onWorkflowStarted,
  });

  const activityBubbles = useMemo(
    () => buildAgentActivityBubbles(agents, activity),
    [agents, activity]
  );

  const zoneAgentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const zone of GARDEN_ZONES) counts[zone.id] = 0;
    for (const [, config] of Object.entries(AGENT_WORLD_POSITIONS)) {
      counts[config.zone] = (counts[config.zone] ?? 0) + 1;
    }
    return counts;
  }, []);

  const zoneHighlights = useMemo(() => getZoneHighlightIds(activeWorkflow), [activeWorkflow]);

  const actionLabel = liveActionLabel ?? currentStep?.label ?? activeWorkflow?.pathLabel;
  const seasonAccent = getSeasonAccent(worldTime.season);
  const WeatherIcon =
    weather.condition === "rain" || weather.condition === "storm" || weather.condition === "drizzle"
      ? CloudRain
      : Sun;

  return (
    <div
      className="relative flex h-full min-h-[58dvh] flex-col overflow-hidden rounded-2xl border-2 border-brand-border/30 shadow-[inset_0_2px_24px_rgba(45,106,79,0.08)] sm:min-h-0 sm:rounded-3xl"
      style={{ borderColor: `${seasonAccent}44` }}
    >
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 border-b border-white/30 bg-white/25 px-3 py-2.5 backdrop-blur-md sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 4, -4, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-primary text-white shadow-md sm:h-9 sm:w-9"
          >
            <Leaf className="h-4 w-4" />
          </motion.div>
          <div className="min-w-0">
            <h1 className="font-heading truncate text-sm font-bold text-brand-primary sm:text-base">
              PlantPal HQ
            </h1>
            <p className="truncate text-[9px] text-brand-muted sm:text-[10px]">
              {worldTime.label}
              <span className="hidden sm:inline"> · event-driven workflows · drag to explore</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <span className="hidden items-center gap-1 rounded-full border border-white/60 bg-white/80 px-2 py-1 text-[9px] font-medium text-brand-primary sm:flex">
            <WeatherIcon className="h-3 w-3 text-sky-600" />
            {liveWeather.label}
          </span>
          <DailyReportGenerateButton onGenerated={onDailyReportGenerated} />
          {collaborationStats && collaborationStats.unreadMessages > 0 && (
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-medium text-sky-700">
              {collaborationStats.unreadMessages} msgs
            </span>
          )}
          <div className="flex items-center gap-1 rounded-full border border-emerald-200/80 bg-white/80 px-2 py-0.5 text-[9px] font-medium text-emerald-700">
            <Radio className="h-3 w-3 animate-pulse text-emerald-500" />
            <span>{agents.length} agents</span>
          </div>
        </div>
      </div>

      {agentScheduleHealth.length > 0 && <HQAgentHealthCards agents={agentScheduleHealth} />}

      {actionLabel && (
        <motion.div
          key={actionLabel}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 flex items-center gap-2 border-b border-amber-100/70 bg-amber-50/75 px-3 py-1.5 text-[10px] text-amber-900 sm:px-4 sm:text-xs"
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-600" />
          <span className="font-medium">Live workflow:</span>
          <span className="truncate">{actionLabel}</span>
        </motion.div>
      )}

      <div
        className="relative min-h-0 flex-1 touch-none overflow-hidden bg-[#d4ead9]"
        onWheel={viewport.onWheel}
        onPointerDown={viewport.onPointerDown}
        onPointerMove={viewport.onPointerMove}
        onPointerUp={viewport.onPointerUp}
        onPointerLeave={viewport.onPointerUp}
        onTouchStart={viewport.onTouchStart}
        onTouchMove={viewport.onTouchMove}
        onTouchEnd={viewport.onTouchEnd}
        style={{ cursor: "grab" }}
      >
        <div
          className="relative h-full min-h-[320px] w-full origin-center will-change-transform sm:min-h-[400px]"
          style={{ transform: viewport.transform }}
        >
          <HQTerrainLayer />
          <HQDayNightOverlay worldTime={worldTime} />
          <HQEnvironmentLayer phase={worldTime.phase} season={worldTime.season} weather={liveWeather} />
          <HQInteractionPaths messageLines={messageLines} activeWalk={activeWalk} />
          <HQWorkflowPath workflow={activeWorkflow} />

          {GARDEN_ZONES.map((zone) => (
            <HQDepartmentBuilding
              key={zone.id}
              zone={zone}
              agentCount={zoneAgentCounts[zone.id] ?? 0}
              isHighlighted={false}
              highlightRole={
                zoneHighlights.target === zone.id
                  ? "target"
                  : zoneHighlights.source === zone.id
                    ? "source"
                    : null
              }
            />
          ))}

          {agents.map((agent) => {
            const motion = motions[agent.id];
            if (!motion) return null;
            return (
              <HQWalkingAgent
                key={agent.id}
                agent={agent}
                motion={motion}
                isSelected={selectedId === agent.id}
                onSelect={() => onSelectAgent(agent.id)}
                activityBubble={activityBubbles[agent.id]}
              />
            );
          })}

          {handoffBurst && (
            <HQHandoffBurst
              label={handoffBurst.label}
              x={handoffBurst.x}
              y={handoffBurst.y}
              visible
            />
          )}
        </div>

        <HQWorldControls
          worldTime={worldTime}
          weather={liveWeather}
          zoom={viewport.zoom}
          onZoomIn={viewport.zoomIn}
          onZoomOut={viewport.zoomOut}
          onReset={viewport.resetView}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
        />

        <HQActivityDock
          items={activity}
          onSelect={onSelectActivity}
          onApprove={onApproveActivity}
          onReject={onRejectActivity}
        />
      </div>
    </div>
  );
}
