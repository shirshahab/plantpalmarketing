"use client";

import { X } from "lucide-react";
import { PlantyAvatar } from "@/components/planty/planty-avatar";
import { AgentCharacter } from "@/components/hq/agent-character";
import { HQStatusPill, agentStatusToVillage } from "@/components/hq/world/hq-status-pill";
import type { VillageBuilding } from "@/lib/hq/hq-village-layout";
import type { HQAgent } from "@/lib/hq/types";

/** Stardew-style interior — desk, plants, agent at work. */
export function HQBuildingInterior({
  building,
  agent,
  onClose,
}: {
  building: VillageBuilding;
  agent: HQAgent | null;
  onClose: () => void;
}) {
  const status = agent ? agentStatusToVillage(agent.status) : "idle";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border-4 border-[#8b7355] bg-[#f5e6d3] shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-lg bg-white/80 p-1.5 text-brand-muted hover:bg-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Room */}
        <div className="relative h-64 bg-gradient-to-b from-[#e8d4bc] to-[#d4bc96]">
          {/* Floor planks */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-[#c4a574] opacity-60" />
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="absolute bottom-0 h-20 border-r border-[#a08050]/30"
              style={{ left: `${i * 20}%`, width: "20%" }}
            />
          ))}

          {/* Window */}
          <div className="absolute left-4 top-6 h-16 w-20 rounded border-4 border-[#8b7355] bg-sky-200/80">
            <div className="absolute inset-0 flex">
              <div className="w-1/2 border-r border-[#8b7355]/50" />
            </div>
            <div className="absolute inset-0 flex flex-col">
              <div className="h-1/2 border-b border-[#8b7355]/50" />
            </div>
          </div>

          {/* Desk */}
          <div className="absolute bottom-16 left-1/2 h-12 w-32 -translate-x-1/2 rounded-t-lg border-2 border-[#8b7355] bg-[#92400e]" />
          <div className="absolute bottom-24 left-1/2 h-8 w-16 -translate-x-1/2 rounded border border-[#64748b] bg-[#1e293b]" />

          {/* Plants */}
          <div className="absolute bottom-14 right-8 scale-75">
            <PlantyAvatar size="sm" />
          </div>
          <div className="absolute bottom-16 left-6 scale-[0.55] opacity-80">
            <PlantyAvatar size="sm" />
          </div>

          {/* Bookshelf */}
          <div className="absolute bottom-14 right-20 h-24 w-14 rounded border-2 border-[#78350f] bg-[#92400e]">
            {[0, 1, 2].map((row) => (
              <div key={row} className="mx-1 mt-2 flex gap-0.5">
                <div className="h-4 flex-1 rounded-sm bg-red-400/80" />
                <div className="h-4 flex-1 rounded-sm bg-blue-400/80" />
                <div className="h-4 flex-1 rounded-sm bg-green-400/80" />
              </div>
            ))}
          </div>

          {/* Agent */}
          {agent && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
              <div className="mb-1 flex justify-center">
                <HQStatusPill status={status} />
              </div>
              <div className="scale-90">
                <AgentCharacter agent={agent} floatDelay="" isActive />
              </div>
            </div>
          )}

          {building.id === "moss_hut" && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
              <p className="mb-1 text-3xl">🍀</p>
              <HQStatusPill status="reviewing" label="Reviewing voice" />
            </div>
          )}
        </div>

        <div className="border-t-2 border-[#8b7355]/40 bg-white/90 px-4 py-3">
          <h3 className="font-heading font-bold text-brand-primary">{building.name}</h3>
          <p className="text-sm text-brand-muted">
            {agent?.currentTask ?? building.description}
          </p>
        </div>
      </div>
    </div>
  );
}
