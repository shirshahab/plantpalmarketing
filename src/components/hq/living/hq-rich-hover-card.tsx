"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Activity, Mail, ListTodo } from "lucide-react";
import { AgentStatusBadge } from "@/components/hq/agent-status-badge";
import { getPersonality } from "@/lib/hq/agent-personalities";
import type { HQAgent } from "@/lib/hq/types";
import type { AgentActivityLog } from "@/lib/types";

export function HQRichHoverCard({
  agent,
  visible,
}: {
  agent: HQAgent;
  visible: boolean;
}) {
  const recentActions = (agent.activity ?? []).slice(0, 3);
  const personality = getPersonality(agent.id);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-3 w-72 -translate-x-1/2 rounded-2xl border border-brand-border/80 bg-white/97 p-4 shadow-2xl backdrop-blur-md"
        >
          <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-brand-border/80 bg-white/97" />

          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-heading text-sm font-bold text-brand-primary">{agent.name}</p>
              <p className="text-xs text-brand-muted">{agent.role}</p>
              <p className="mt-0.5 text-[10px] text-brand-sage">{agent.station}</p>
            </div>
            <AgentStatusBadge status={agent.status} size="xs" />
          </div>

          <p className="mt-2 text-[10px] italic leading-relaxed text-brand-sage">
            &ldquo;{personality.greeting}&rdquo;
          </p>

          <div className="mt-2 rounded-xl bg-brand-bg/60 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-sage">Current task</p>
            <p className="mt-1 text-xs leading-relaxed text-brand-primary">{agent.currentTask}</p>
            <p className="mt-1.5 text-[10px] text-brand-muted">{personality.buildingRole}</p>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-brand-border/50 bg-white px-2 py-1.5">
              <p className="text-[9px] text-brand-muted">Productivity</p>
              <p className="font-heading text-sm font-bold text-brand-primary">{agent.progress}%</p>
            </div>
            <div className="rounded-lg border border-sky-100 bg-sky-50/50 px-2 py-1.5">
              <Mail className="mx-auto h-3 w-3 text-sky-600" />
              <p className="text-[10px] font-semibold text-sky-800">{agent.unreadMessages ?? 0}</p>
            </div>
            <div className="rounded-lg border border-violet-100 bg-violet-50/50 px-2 py-1.5">
              <ListTodo className="mx-auto h-3 w-3 text-violet-600" />
              <p className="text-[10px] font-semibold text-violet-800">{agent.activeTasks ?? 0}</p>
            </div>
          </div>

          {recentActions.length > 0 && (
            <div className="mt-3">
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-brand-sage">
                <Activity className="h-3 w-3" />
                Recent actions
              </p>
              <ul className="mt-1.5 space-y-1">
                {recentActions.map((log: AgentActivityLog) => (
                  <li key={log.id} className="text-[10px] leading-snug text-brand-muted">
                    • {log.detail.slice(0, 60)}{log.detail.length > 60 ? "…" : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-2 text-center text-[9px] text-brand-sage">Click for full detail · {agent.lastUpdate}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
