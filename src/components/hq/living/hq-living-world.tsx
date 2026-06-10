"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Leaf, Radio, Sparkles } from "lucide-react";
import { GARDEN_ZONES, AGENT_WORLD_POSITIONS } from "@/lib/hq/hq-world-layout";
import { HQInteractionPaths } from "@/components/hq/living/hq-interaction-paths";
import { HQWalkingAgent } from "@/components/hq/living/hq-walking-agent";
import { useAgentChoreography } from "@/components/hq/living/use-agent-choreography";
import { HQDepartmentBuilding } from "@/components/hq/living/hq-department-building";
import { HQEnvironmentLayer } from "@/components/hq/living/hq-environment-layer";
import { HQDayNightOverlay } from "@/components/hq/living/hq-day-night-overlay";
import { HQWorldControls } from "@/components/hq/living/hq-world-controls";
import { HQHandoffBurst } from "@/components/hq/living/hq-handoff-burst";
import { useWorldTime } from "@/components/hq/living/use-world-time";
import { useWorldViewport } from "@/components/hq/living/use-world-viewport";
import { useAmbientSound } from "@/components/hq/living/use-ambient-sound";
import { DailyReportGenerateButton } from "@/components/daily-report/daily-report-generate-button";
import { getSeasonAccent } from "@/lib/hq/world-time";
import type { AgentId, HQAgent } from "@/lib/hq/types";
import type { AgentSlug, CollaborationPriority } from "@/lib/types";

export function HQLivingWorld({
  agents,
  selectedId,
  onSelectAgent,
  messageLines = [],
  collaborationStats,
  liveActionLabel,
  onDailyReportGenerated,
}: {
  agents: HQAgent[];
  selectedId: AgentId | null;
  onSelectAgent: (id: AgentId) => void;
  messageLines?: { from: AgentSlug; to: AgentSlug; priority: CollaborationPriority; id: string }[];
  collaborationStats?: { unreadMessages: number; activeTasks: number };
  liveActionLabel?: string | null;
  onDailyReportGenerated?: () => void;
}) {
  const worldTime = useWorldTime();
  const viewport = useWorldViewport();
  const { enabled: soundEnabled, toggle: toggleSound } = useAmbientSound();
  const { motions, currentStep, activeWalk, handoffBurst } = useAgentChoreography(messageLines);

  const zoneAgentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const zone of GARDEN_ZONES) counts[zone.id] = 0;
    for (const [, config] of Object.entries(AGENT_WORLD_POSITIONS)) {
      counts[config.zone] = (counts[config.zone] ?? 0) + 1;
    }
    return counts;
  }, []);

  const highlightedZone = useMemo(() => {
    if (!handoffBurst) return null;
    return GARDEN_ZONES.find((z) => {
      const dx = Math.abs(z.center.x - handoffBurst.x);
      const dy = Math.abs(z.center.y - handoffBurst.y);
      return dx < z.width && dy < z.height;
    })?.id;
  }, [handoffBurst]);

  const actionLabel = liveActionLabel ?? currentStep?.label;
  const seasonAccent = getSeasonAccent(worldTime.season);

  return (
    <div
      className="relative flex h-full min-h-[48dvh] flex-col overflow-hidden rounded-2xl border border-brand-border/40 shadow-inner sm:min-h-[520px] sm:rounded-3xl"
      style={{ borderColor: `${seasonAccent}33` }}
    >
      {/* Header */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 border-b border-white/40 bg-white/30 px-3 py-3 backdrop-blur-md sm:px-5">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary text-white shadow-md"
          >
            <Leaf className="h-4 w-4" />
          </motion.div>
          <div>
            <h1 className="font-heading text-base font-bold text-brand-primary sm:text-lg">PlantPal Headquarters</h1>
            <p className="text-[10px] text-brand-muted sm:text-xs">
              {worldTime.label} · drag to pan · scroll to zoom
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          <DailyReportGenerateButton onGenerated={onDailyReportGenerated} />
          {collaborationStats && collaborationStats.unreadMessages > 0 && (
            <span className="hidden rounded-full bg-sky-100 px-2 py-1 text-[10px] font-medium text-sky-700 sm:inline">
              {collaborationStats.unreadMessages} msgs
            </span>
          )}
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-white/80 px-2 py-1 text-[10px] font-medium text-emerald-700 sm:px-2.5 sm:text-xs">
            <Radio className="h-3 w-3 animate-pulse text-emerald-500" />
            <span className="hidden sm:inline">12 agents living</span>
            <span className="sm:hidden">Live</span>
          </div>
        </div>
      </div>

      {/* Live action ticker */}
      {actionLabel && (
        <motion.div
          key={actionLabel}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 flex items-center gap-2 border-b border-amber-100/80 bg-amber-50/70 px-4 py-2 text-xs text-amber-900"
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-600" />
          <span className="font-medium">Live:</span>
          <span>{actionLabel}</span>
        </motion.div>
      )}

      {/* World viewport — zoom & pan */}
      <div
        className="relative min-h-0 flex-1 touch-none overflow-hidden"
        onWheel={viewport.onWheel}
        onPointerDown={viewport.onPointerDown}
        onPointerMove={viewport.onPointerMove}
        onPointerUp={viewport.onPointerUp}
        onPointerLeave={viewport.onPointerUp}
        style={{ cursor: "grab" }}
      >
        <div
          className="relative h-full min-h-[360px] w-full origin-center transition-transform duration-75 sm:min-h-[420px]"
          style={{ transform: viewport.transform }}
        >
          <HQDayNightOverlay worldTime={worldTime} />
          <HQEnvironmentLayer phase={worldTime.phase} season={worldTime.season} />
          <HQInteractionPaths messageLines={messageLines} activeWalk={activeWalk} />

          {GARDEN_ZONES.map((zone) => (
            <HQDepartmentBuilding
              key={zone.id}
              zone={zone}
              agentCount={zoneAgentCounts[zone.id] ?? 0}
              isHighlighted={highlightedZone === zone.id}
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
          zoom={viewport.zoom}
          onZoomIn={viewport.zoomIn}
          onZoomOut={viewport.zoomOut}
          onReset={viewport.resetView}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
        />
      </div>

      <div className="relative z-20 hidden border-t border-white/40 bg-white/40 px-4 py-2 text-center text-[10px] text-brand-sage backdrop-blur-sm sm:block">
        Hover agents for personality · Click for tasks · Watch handoffs flow across the garden
      </div>
    </div>
  );
}
