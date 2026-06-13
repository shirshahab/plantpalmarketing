"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { ActivityItem, AgentId, HQAgent } from "@/lib/hq/types";
import { hqIdToSlug } from "@/lib/agents/agent-slugs";
import type { AgentSlug, AgentTask, CollaborationPriority } from "@/lib/types";
import {
  pickNextWorkflowEvent,
  workflowToVisual,
  type ActiveWorkflowVisual,
  type WorkflowChoreography,
} from "@/lib/hq/activity-to-choreography";
import { applyIdleTick, resetAgentToStation } from "@/lib/hq/agent-idle-motion";
import {
  buildInitialMotions,
  DEMO_CHOREOGRAPHY,
  type AgentMotion,
  type ChoreographyStep,
} from "@/lib/hq/hq-movement-choreography";

const DEMO_IDLE_MS = 3 * 60 * 1000;
const IDLE_TICK_MS = 4500;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export interface HandoffBurst {
  label: string;
  x: number;
  y: number;
}

function processedKey(workflow: WorkflowChoreography): string {
  if (workflow.triggerType === "collab_message") return `msg:${workflow.triggerId}`;
  if (workflow.triggerType === "activity") return `activity:${workflow.triggerId}`;
  if (workflow.triggerType === "agent_event") return workflow.triggerId;
  if (workflow.triggerType === "task") return `task:${workflow.triggerId}`;
  return `demo:${workflow.triggerId}`;
}

export function useAgentChoreography({
  messageLines = [],
  activityItems = [],
  agents = [],
  tasks = [],
  liveDataAvailable = true,
  onWorkflowStarted,
}: {
  messageLines?: { from: AgentSlug; to: AgentSlug; priority: CollaborationPriority; id: string }[];
  activityItems?: ActivityItem[];
  agents?: HQAgent[];
  tasks?: AgentTask[];
  liveDataAvailable?: boolean;
  onWorkflowStarted?: (workflow: WorkflowChoreography) => void;
}) {
  const [motions, setMotions] = useState<Record<AgentId, AgentMotion>>(buildInitialMotions);
  const [currentStep, setCurrentStep] = useState<ChoreographyStep | null>(null);
  const [activeWorkflow, setActiveWorkflow] = useState<ActiveWorkflowVisual | null>(null);
  const [activeWalk, setActiveWalk] = useState<{ from: AgentSlug; to: AgentSlug } | null>(null);
  const [handoffBurst, setHandoffBurst] = useState<HandoffBurst | null>(null);
  const [demoStepIndex, setDemoStepIndex] = useState(0);

  const processed = useRef(new Set<string>());
  const busyRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const lastRealEventAt = useRef(Date.now());
  const activityHeadId = useRef<string | null>(null);
  const idleTick = useRef(0);
  const activeWalkerId = useRef<AgentId | null>(null);

  const markRealEvent = useCallback(() => {
    lastRealEventAt.current = Date.now();
  }, []);

  const runStep = useCallback(
    (workflow: WorkflowChoreography, onComplete?: () => void) => {
      const step = workflow.step;
      cleanupRef.current?.();
      busyRef.current = true;
      activeWalkerId.current = step.agentId;
      setCurrentStep(step);
      setActiveWorkflow(workflowToVisual(workflow));
      setActiveWalk({
        from: hqIdToSlug(workflow.sourceAgentId),
        to: hqIdToSlug(workflow.targetAgentId),
      });

      if (workflow.triggerType !== "demo") {
        markRealEvent();
        onWorkflowStarted?.(workflow);
      }

      const samePosition = step.from.x === step.to.x && step.from.y === step.to.y;
      const start = performance.now();

      setMotions((prev) => ({
        ...prev,
        [step.agentId]: {
          ...prev[step.agentId],
          state: samePosition ? "working" : step.state,
          facing: step.to.x >= step.from.x ? "right" : "left",
          actionLabel: step.label,
        },
      }));

      setHandoffBurst({
        label: workflow.pathLabel,
        x: step.to.x,
        y: step.to.y - 5,
      });
      const burstTimer = setTimeout(() => setHandoffBurst(null), 4000);

      if (samePosition) {
        const timer = setTimeout(() => {
          busyRef.current = false;
          activeWalkerId.current = null;
          setCurrentStep(null);
          setActiveWorkflow(null);
          setActiveWalk(null);
          setMotions((prev) => resetAgentToStation(prev, step.agentId));
          onComplete?.();
        }, step.pauseMs ?? 2000);
        cleanupRef.current = () => {
          clearTimeout(timer);
          clearTimeout(burstTimer);
        };
        return cleanupRef.current;
      }

      let frame: number;
      function animate(now: number) {
        const elapsed = now - start;
        const t = Math.min(1, elapsed / step.durationMs);
        const eased = easeInOut(t);

        setMotions((prev) => ({
          ...prev,
          [step.agentId]: {
            ...prev[step.agentId],
            position: {
              x: lerp(step.from.x, step.to.x, eased),
              y: lerp(step.from.y, step.to.y, eased),
            },
            state: t < 1 ? step.state : step.state === "handoff" ? "handoff" : "working",
            facing: step.to.x >= step.from.x ? "right" : "left",
            actionLabel: t < 1 ? step.label : step.state === "handoff" ? step.label : undefined,
          },
        }));

        if (t < 1) frame = requestAnimationFrame(animate);
      }

      frame = requestAnimationFrame(animate);

      const totalTime = step.durationMs + (step.pauseMs ?? 800);
      const timer = setTimeout(() => {
        cancelAnimationFrame(frame);
        busyRef.current = false;
        activeWalkerId.current = null;
        setCurrentStep(null);
        setActiveWorkflow(null);
        setActiveWalk(null);
        setMotions((prev) => resetAgentToStation(prev, step.agentId));
        onComplete?.();
      }, totalTime);

      cleanupRef.current = () => {
        clearTimeout(timer);
        clearTimeout(burstTimer);
        cancelAnimationFrame(frame);
      };
      return cleanupRef.current;
    },
    [markRealEvent, onWorkflowStarted]
  );

  const tryRunNextRealEvent = useCallback(() => {
    if (busyRef.current) return false;

    const head = activityItems[0]?.id ?? null;
    if (head !== activityHeadId.current) {
      activityHeadId.current = head;
    }

    const workflow = pickNextWorkflowEvent({
      messageLines,
      activity: activityItems,
      agents,
      tasks,
      processed: processed.current,
      activityHeadId: activityHeadId.current,
    });

    if (!workflow) return false;

    processed.current.add(processedKey(workflow));
    runStep(workflow);
    return true;
  }, [activityItems, agents, messageLines, runStep, tasks]);

  const tryRunDemo = useCallback(() => {
    const demoAllowed =
      process.env.NODE_ENV !== "production" &&
      process.env.NEXT_PUBLIC_SHOW_DEMO_DATA === "true";
    if (!demoAllowed) return;
    if (busyRef.current) return;
    if (liveDataAvailable && Date.now() - lastRealEventAt.current < DEMO_IDLE_MS) return;

    const step = DEMO_CHOREOGRAPHY[demoStepIndex];
    if (!step) return;

    const workflow: WorkflowChoreography = {
      step,
      sourceAgentId: step.agentId,
      targetAgentId: step.agentId,
      sourceZoneId: "executive_garden",
      targetZoneId: "executive_garden",
      workflowName: `demo_${demoStepIndex}`,
      pathLabel: "Demo stroll",
      feedLabel: step.label,
      triggerType: "demo",
      triggerId: `demo-${demoStepIndex}-${Date.now()}`,
    };

    processed.current.add(processedKey(workflow));
    runStep(workflow, () => {
      setDemoStepIndex((i) => (i + 1) % DEMO_CHOREOGRAPHY.length);
    });
  }, [demoStepIndex, liveDataAvailable, runStep]);

  useEffect(() => {
    if (busyRef.current) return;
    tryRunNextRealEvent();
  }, [tryRunNextRealEvent, activityItems, messageLines, agents, tasks]);

  useEffect(() => {
    const id = setInterval(() => {
      if (busyRef.current) return;
      if (tryRunNextRealEvent()) return;
      tryRunDemo();
    }, 2500);
    return () => clearInterval(id);
  }, [tryRunNextRealEvent, tryRunDemo]);

  useEffect(() => {
    const id = setInterval(() => {
      if (busyRef.current) return;
      idleTick.current += 1;
      setMotions((prev) => applyIdleTick(prev, activeWalkerId.current, idleTick.current));
    }, IDLE_TICK_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    return () => cleanupRef.current?.();
  }, []);

  return {
    motions,
    currentStep,
    activeWalk,
    activeWorkflow,
    handoffBurst,
    isDemoDominant: !liveDataAvailable || Date.now() - lastRealEventAt.current >= DEMO_IDLE_MS,
  };
}
