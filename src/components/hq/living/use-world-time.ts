"use client";

import { useEffect, useState } from "react";
import { getWorldTimeState, type WorldTimeState } from "@/lib/hq/world-time";

export function useWorldTime(tickMs = 60_000) {
  const [worldTime, setWorldTime] = useState<WorldTimeState>(() => getWorldTimeState());

  useEffect(() => {
    setWorldTime(getWorldTimeState());
    const id = setInterval(() => setWorldTime(getWorldTimeState()), tickMs);
    return () => clearInterval(id);
  }, [tickMs]);

  return worldTime;
}
