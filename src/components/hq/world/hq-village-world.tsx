"use client";

import { useCallback, useMemo, useState } from "react";
import { ZoomIn, ZoomOut, Maximize2, List } from "lucide-react";
import { HQVillageTerrain } from "@/components/hq/world/hq-village-terrain";
import { HQVillageBuilding } from "@/components/hq/world/hq-village-building";
import { HQVillageAgent, HQVillageMoss } from "@/components/hq/world/hq-village-agent";
import { HQWorkEnvelope } from "@/components/hq/world/hq-work-envelope";
import { HQPlantyWanderer } from "@/components/hq/world/hq-planty-wanderer";
import { HQBuildingPanel } from "@/components/hq/world/hq-building-panel";
import { HQBuildingInterior } from "@/components/hq/world/hq-building-interior";
import { useVillageEnvelopes } from "@/components/hq/world/use-village-envelopes";
import { useAgentChoreography } from "@/components/hq/living/use-agent-choreography";
import { useWorldViewport } from "@/components/hq/living/use-world-viewport";
import {
  VILLAGE_BUILDINGS,
  VILLAGE_SIZE,
  buildingForAgent,
  getBuilding,
  type VillageBuilding,
  type VillageBuildingId,
} from "@/lib/hq/hq-village-layout";
import { HQWorldControls } from "@/components/hq/living/hq-world-controls";
import { useWorldTime } from "@/components/hq/living/use-world-time";
import { useHQWeather } from "@/components/hq/living/use-hq-weather";
import type { ActivityItem, AgentId, HQAgent } from "@/lib/hq/types";
import type { HQWeatherState } from "@/lib/hq/hq-weather";
import type { WorkflowChoreography } from "@/lib/hq/activity-to-choreography";
import type { AgentSlug, AgentTask, CollaborationPriority } from "@/lib/types";
import { DailyReportGenerateButton } from "@/components/daily-report/daily-report-generate-button";
import { HQAgentHealthCards } from "@/components/hq/living/hq-agent-health-cards";
import type { HQAgentScheduleHealth } from "@/lib/agent-worker/types";

/**
 * Phase 42 — Game-inspired HQ village. Default HQ experience.
 * Districts · Buildings · Character agents · Postal envelopes · Wandering Planty.
 * No floating cards, no speech bubbles, no workflow diagram lines.
 */
export function HQVillageWorld({
  agents,
  activity,
  selectedId,
  onSelectAgent,
  messageLines = [],
  collaborationTasks = [],
  weather,
  liveDataAvailable = true,
  onWorkflowStarted,
  onOpenActivityList,
  onDailyReportGenerated,
  collaborationStats,
  agentScheduleHealth = [],
}: {
  agents: HQAgent[];
  activity: ActivityItem[];
  selectedId: AgentId | null;
  onSelectAgent: (id: AgentId) => void;
  messageLines?: { from: AgentSlug; to: AgentSlug; priority: CollaborationPriority; id: string }[];
  collaborationTasks?: AgentTask[];
  weather: HQWeatherState;
  liveDataAvailable?: boolean;
  onWorkflowStarted?: (workflow: WorkflowChoreography) => void;
  onOpenActivityList?: () => void;
  onDailyReportGenerated?: () => void;
  collaborationStats?: { unreadMessages: number; activeTasks: number };
  agentScheduleHealth?: HQAgentScheduleHealth[];
}) {
  const viewport = useWorldViewport();
  const worldTime = useWorldTime();
  const { weather: liveWeather } = useHQWeather(weather);
  const { activeWalk } = useAgentChoreography({
    messageLines,
    activityItems: activity,
    agents,
    tasks: collaborationTasks,
    liveDataAvailable,
    onWorkflowStarted,
  });

  const envelopes = useVillageEnvelopes(messageLines, activeWalk);

  const [selectedBuildingId, setSelectedBuildingId] = useState<VillageBuildingId | null>(null);
  const [interiorBuilding, setInteriorBuilding] = useState<VillageBuilding | null>(null);

  const pendingByAgent = useMemo(() => {
    const map = new Map<AgentId, number>();
    for (const item of activity) {
      if (item.agentId && item.status === "pending") {
        map.set(item.agentId, (map.get(item.agentId) ?? 0) + 1);
      }
    }
    return map;
  }, [activity]);

  const totalPending = useMemo(
    () => activity.filter((a) => a.status === "pending").length,
    [activity]
  );

  const selectedBuilding = selectedBuildingId ? getBuilding(selectedBuildingId) : null;
  const panelAgent = selectedBuilding?.agentId
    ? agents.find((a) => a.id === selectedBuilding.agentId) ?? null
    : null;

  const handleBuildingClick = useCallback((building: VillageBuilding) => {
    setSelectedBuildingId(building.id);
    if (building.agentId) onSelectAgent(building.agentId);
  }, [onSelectAgent]);

  return (
    <div className="relative flex h-full min-h-[58dvh] flex-col overflow-hidden rounded-2xl border-2 border-[#74c365]/40 bg-[#a3d9a5] shadow-inner sm:rounded-3xl">
      {/* Minimal header — not corporate dashboard */}
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-2 border-b border-white/40 bg-[#2d6a4f]/90 px-3 py-2 text-white sm:px-4">
        <div>
          <h1 className="font-heading text-sm font-bold sm:text-base">PlantPal Village</h1>
          <p className="text-[10px] opacity-80">{worldTime.label} · drag to explore · click a building</p>
        </div>
        <div className="flex items-center gap-2">
          {collaborationStats && collaborationStats.unreadMessages > 0 && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium">
              {collaborationStats.unreadMessages} msgs
            </span>
          )}
          {totalPending > 0 && (
            <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-950">
              {totalPending} need you
            </span>
          )}
          {onDailyReportGenerated && (
            <DailyReportGenerateButton onGenerated={onDailyReportGenerated} />
          )}
          {onOpenActivityList && (
            <button
              type="button"
              onClick={onOpenActivityList}
              className="flex items-center gap-1 rounded-lg bg-white/15 px-2 py-1 text-[10px] font-medium hover:bg-white/25"
            >
              <List className="h-3.5 w-3.5" />
              Activity
            </button>
          )}
        </div>
      </div>

      {agentScheduleHealth.length > 0 && <HQAgentHealthCards agents={agentScheduleHealth} />}

      {/* World canvas */}
      <div
        className="relative min-h-0 flex-1 touch-none overflow-hidden"
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
          className="absolute left-1/2 top-1/2 origin-center will-change-transform"
          style={{
            width: VILLAGE_SIZE.width,
            height: VILLAGE_SIZE.height,
            transform: `translate(calc(-50% + ${viewport.pan.x}px), calc(-50% + ${viewport.pan.y}px)) scale(${viewport.zoom * 0.55})`,
          }}
        >
          <HQVillageTerrain />

          {VILLAGE_BUILDINGS.map((building) => (
            <HQVillageBuilding
              key={building.id}
              building={building}
              selected={selectedBuildingId === building.id}
              pendingCount={building.agentId ? pendingByAgent.get(building.agentId) ?? 0 : 0}
              onClick={() => handleBuildingClick(building)}
            />
          ))}

          {agents.map((agent) => {
            const building = buildingForAgent(agent.id);
            if (!building) return null;
            const charPos = { x: building.position.x, y: building.position.y + 72 };
            return (
              <HQVillageAgent
                key={agent.id}
                agent={agent}
                position={charPos}
                selected={selectedId === agent.id}
                onSelect={() => {
                  onSelectAgent(agent.id);
                  setSelectedBuildingId(building.id);
                }}
              />
            );
          })}

          <HQVillageMoss
            position={{ x: getBuilding("moss_hut").position.x, y: getBuilding("moss_hut").position.y + 72 }}
            selected={selectedBuildingId === "moss_hut"}
            onSelect={() => setSelectedBuildingId("moss_hut")}
          />

          {envelopes.map((env) => (
            <HQWorkEnvelope key={env.id} id={env.id} from={env.from} to={env.to} />
          ))}

          <HQPlantyWanderer
            activity={activity}
            pendingApprovals={totalPending}
            unreadMessages={collaborationStats?.unreadMessages ?? 0}
          />
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-3 left-3 z-20 flex flex-col gap-1">
          <button
            type="button"
            onClick={viewport.zoomIn}
            className="rounded-lg bg-white/90 p-2 shadow-md hover:bg-white"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4 text-brand-primary" />
          </button>
          <button
            type="button"
            onClick={viewport.zoomOut}
            className="rounded-lg bg-white/90 p-2 shadow-md hover:bg-white"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4 text-brand-primary" />
          </button>
          <button
            type="button"
            onClick={viewport.resetView}
            className="rounded-lg bg-white/90 p-2 shadow-md hover:bg-white"
            aria-label="Reset view"
          >
            <Maximize2 className="h-4 w-4 text-brand-primary" />
          </button>
        </div>

        <HQWorldControls
          worldTime={worldTime}
          weather={liveWeather}
          zoom={viewport.zoom}
          onZoomIn={viewport.zoomIn}
          onZoomOut={viewport.zoomOut}
          onReset={viewport.resetView}
          soundEnabled={false}
          onToggleSound={() => {}}
        />
      </div>

      {selectedBuilding && (
        <HQBuildingPanel
          building={selectedBuilding}
          agent={panelAgent}
          activity={activity}
          onClose={() => setSelectedBuildingId(null)}
          onEnterInterior={() => setInteriorBuilding(selectedBuilding)}
          onSelectAgent={() => selectedBuilding.agentId && onSelectAgent(selectedBuilding.agentId)}
        />
      )}

      {interiorBuilding && (
        <HQBuildingInterior
          building={interiorBuilding}
          agent={
            interiorBuilding.agentId
              ? agents.find((a) => a.id === interiorBuilding.agentId) ?? null
              : null
          }
          onClose={() => setInteriorBuilding(null)}
        />
      )}
    </div>
  );
}
