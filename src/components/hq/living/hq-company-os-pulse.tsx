"use client";

import { motion } from "framer-motion";
import { getZone } from "@/lib/hq/hq-world-layout";
import type { CompanyOsPulse } from "@/components/hq/living/use-company-os-pulse";

/**
 * Phase 31A — Company OS station visuals.
 * Gate turns amber when workflows are blocked, the Launch Gate lights up
 * green when content is ready to publish, and the Executive Garden pulses
 * violet when the founder has urgent actions waiting.
 */
export function HQCompanyOsPulse({ pulse }: { pulse: CompanyOsPulse }) {
  const launchGate = getZone("launch_gate");
  const executiveGarden = getZone("executive_garden");

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Gate station turns amber when work is blocked */}
      {pulse.gateBlocked && pulse.blockedWorkflows > 0 && (
        <motion.div
          className="absolute rounded-3xl"
          style={{
            left: `${launchGate.center.x - launchGate.width / 2}%`,
            top: `${launchGate.center.y - launchGate.height / 2}%`,
            width: `${launchGate.width}%`,
            height: `${launchGate.height}%`,
            boxShadow: "0 0 28px 10px rgba(245, 158, 11, 0.45)",
            backgroundColor: "rgba(245, 158, 11, 0.12)",
          }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-semibold text-white shadow">
            {pulse.blockedWorkflows} blocked
          </span>
        </motion.div>
      )}

      {/* Launch Gate lights up green when content is ready to publish */}
      {!pulse.gateBlocked && pulse.readyToPublish > 0 && (
        <motion.div
          className="absolute rounded-3xl"
          style={{
            left: `${launchGate.center.x - launchGate.width / 2}%`,
            top: `${launchGate.center.y - launchGate.height / 2}%`,
            width: `${launchGate.width}%`,
            height: `${launchGate.height}%`,
            boxShadow: "0 0 26px 8px rgba(101, 163, 13, 0.4)",
            backgroundColor: "rgba(101, 163, 13, 0.1)",
          }}
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-lime-600 px-2 py-0.5 text-[9px] font-semibold text-white shadow">
            {pulse.readyToPublish} ready to publish
          </span>
        </motion.div>
      )}

      {/* Executive Garden pulses when the founder has urgent actions */}
      {pulse.urgentFounderActions > 0 && (
        <motion.div
          className="absolute rounded-3xl"
          style={{
            left: `${executiveGarden.center.x - executiveGarden.width / 2}%`,
            top: `${executiveGarden.center.y - executiveGarden.height / 2}%`,
            width: `${executiveGarden.width}%`,
            height: `${executiveGarden.height}%`,
            boxShadow: "0 0 26px 9px rgba(91, 33, 182, 0.35)",
            backgroundColor: "rgba(91, 33, 182, 0.08)",
          }}
          animate={{ opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-violet-700 px-2 py-0.5 text-[9px] font-semibold text-white shadow">
            {pulse.urgentFounderActions} founder actions
          </span>
        </motion.div>
      )}
    </div>
  );
}
