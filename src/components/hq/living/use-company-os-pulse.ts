"use client";

import { useEffect, useState } from "react";

export interface CompanyOsPulse {
  blockedWorkflows: number;
  gateBlocked: boolean;
  readyToPublish: number;
  urgentFounderActions: number;
  activeWorkflows: number;
}

const EMPTY: CompanyOsPulse = {
  blockedWorkflows: 0,
  gateBlocked: false,
  readyToPublish: 0,
  urgentFounderActions: 0,
  activeWorkflows: 0,
};

const REFRESH_MS = 60 * 1000;

/** Phase 31A — live Company OS state that drives HQ station visuals. */
export function useCompanyOsPulse(): CompanyOsPulse {
  const [pulse, setPulse] = useState<CompanyOsPulse>(EMPTY);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const res = await fetch("/api/hq/company-os", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as Partial<CompanyOsPulse>;
        if (!cancelled) {
          setPulse({
            blockedWorkflows: data.blockedWorkflows ?? 0,
            gateBlocked: data.gateBlocked ?? false,
            readyToPublish: data.readyToPublish ?? 0,
            urgentFounderActions: data.urgentFounderActions ?? 0,
            activeWorkflows: data.activeWorkflows ?? 0,
          });
        }
      } catch {
        // keep last good state
      }
    }

    refresh();
    const id = setInterval(refresh, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return pulse;
}
