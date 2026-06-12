"use client";

import { useEffect, useState } from "react";
import { pointForAgentSlug } from "@/lib/hq/hq-village-layout";
import type { AgentSlug, CollaborationPriority } from "@/lib/types";

export interface ActiveEnvelope {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
}

export function useVillageEnvelopes(
  messageLines: { from: AgentSlug; to: AgentSlug; priority: CollaborationPriority; id: string }[],
  activeWalk?: { from: AgentSlug; to: AgentSlug } | null
) {
  const [envelopes, setEnvelopes] = useState<ActiveEnvelope[]>([]);

  useEffect(() => {
    const lines = [...messageLines];
    if (activeWalk) {
      lines.unshift({ from: activeWalk.from, to: activeWalk.to, priority: "high", id: `walk-${Date.now()}` });
    }
    if (lines.length === 0) return;

    const latest = lines[lines.length - 1];
    const env: ActiveEnvelope = {
      id: `${latest.id}-${Date.now()}`,
      from: pointForAgentSlug(latest.from),
      to: pointForAgentSlug(latest.to),
    };
    setEnvelopes((prev) => [...prev.slice(-2), env]);

    const t = setTimeout(() => {
      setEnvelopes((prev) => prev.filter((e) => e.id !== env.id));
    }, 3000);
    return () => clearTimeout(t);
  }, [messageLines, activeWalk]);

  return envelopes;
}
