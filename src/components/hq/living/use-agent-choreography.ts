"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { AgentId } from "@/lib/hq/types";
import type { AgentSlug, CollaborationPriority } from "@/lib/types";
import { AGENT_SLUG_LABELS } from "@/lib/agents/agent-slugs";
import { getPersonality } from "@/lib/hq/agent-personalities";
import {
  buildInitialMotions,
  DEMO_CHOREOGRAPHY,
  motionFromMessage,
  type AgentMotion,
  type ChoreographyStep,
} from "@/lib/hq/hq-movement-choreography";
import { AGENT_WORLD_POSITIONS } from "@/lib/hq/hq-world-layout";

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

export function useAgentChoreography(
  messageLines: { from: AgentSlug; to: AgentSlug; priority: CollaborationPriority; id: string }[] = []
) {
  const [motions, setMotions] = useState<Record<AgentId, AgentMotion>>(buildInitialMotions);
  const [currentStep, setCurrentStep] = useState<ChoreographyStep | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [activeWalk, setActiveWalk] = useState<{ from: AgentSlug; to: AgentSlug } | null>(null);
  const [handoffBurst, setHandoffBurst] = useState<HandoffBurst | null>(null);
  const processedMessages = useRef(new Set<string>());
  const demoPaused = useRef(false);
  const busyRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const runStep = useCallback((step: ChoreographyStep, onComplete?: () => void) => {
    cleanupRef.current?.();
    busyRef.current = true;
    setCurrentStep(step);

    const start = performance.now();
    const fromX = step.from.x;
    const fromY = step.from.y;
    const toX = step.to.x;
    const toY = step.to.y;

    setMotions((prev) => ({
      ...prev,
      [step.agentId]: {
        ...prev[step.agentId],
        state: step.state,
        facing: toX >= fromX ? "right" : "left",
        actionLabel: step.label,
      },
    }));

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
            x: lerp(fromX, toX, eased),
            y: lerp(fromY, toY, eased),
          },
          state: t < 1 ? step.state : step.state === "handoff" ? "handoff" : "working",
          facing: toX >= fromX ? "right" : "left",
          actionLabel: t < 1 ? step.label : step.state === "handoff" ? step.label : undefined,
        },
      }));

      if (t < 1) {
        frame = requestAnimationFrame(animate);
      }
    }

    frame = requestAnimationFrame(animate);

    const totalTime = step.durationMs + (step.pauseMs ?? 800);
    const timer = setTimeout(() => {
      cancelAnimationFrame(frame);
      busyRef.current = false;
      setCurrentStep(null);
      onComplete?.();
    }, totalTime);

    const cleanup = () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
    cleanupRef.current = cleanup;
    return cleanup;
  }, []);

  const runMessageHandoff = useCallback(
    (from: AgentSlug, to: AgentSlug) => {
      const walk = motionFromMessage(from, to);
      if (!walk) return;

      const fromPos = AGENT_WORLD_POSITIONS[walk.walker]?.home;
      if (!fromPos) return;

      demoPaused.current = true;
      setActiveWalk({ from, to });

      const fromName = AGENT_SLUG_LABELS[from];
      const toName = AGENT_SLUG_LABELS[to];
      const personality = getPersonality(walk.walker);

      const step: ChoreographyStep = {
        agentId: walk.walker,
        from: fromPos,
        to: walk.destination,
        durationMs: 3500,
        state: "handoff",
        label: `${fromName} → ${toName}: ${personality.handoffQuip}`,
        pauseMs: 2200,
      };

      setHandoffBurst({
        label: `${fromName} → ${toName}`,
        x: walk.destination.x,
        y: walk.destination.y - 6,
      });

      const burstTimer = setTimeout(() => setHandoffBurst(null), 4000);

      runStep(step, () => {
        demoPaused.current = false;
        setActiveWalk(null);
        setMotions((prev) => ({
          ...prev,
          [walk.walker]: {
            ...prev[walk.walker],
            position: { ...fromPos },
            state: "working",
            actionLabel: undefined,
          },
        }));
        setStepIndex((i) => (i + 1) % DEMO_CHOREOGRAPHY.length);
      });

      return () => clearTimeout(burstTimer);
    },
    [runStep]
  );

  useEffect(() => {
    if (busyRef.current || demoPaused.current) return;
    const pending = messageLines.find((line) => !processedMessages.current.has(line.id));
    if (!pending) return;
    processedMessages.current.add(pending.id);
    runMessageHandoff(pending.from, pending.to);
  }, [messageLines, runMessageHandoff, stepIndex]);

  useEffect(() => {
    if (busyRef.current || demoPaused.current) return;
    const step = DEMO_CHOREOGRAPHY[stepIndex];
    if (!step) return;
    return runStep(step, () => {
      setStepIndex((i) => (i + 1) % DEMO_CHOREOGRAPHY.length);
    });
  }, [stepIndex, runStep]);

  return { motions, currentStep, activeWalk, handoffBurst };
}
