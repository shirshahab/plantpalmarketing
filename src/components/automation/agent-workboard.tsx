import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AgentWorkboardEntry } from "@/lib/db/automation-queries";

const AGENT_NAMES: Record<string, string> = {
  scout: "Scout",
  roots: "Roots",
  bloom: "Bloom",
  sage: "Sage",
  gate: "Gate",
  sprout: "Sprout",
  sentinel: "Sentinel",
  oak: "Oak",
  ivy: "Ivy",
  atlas: "Atlas",
  echo: "Echo",
  fern: "Fern",
};

function nextRunLabel(iso: string | null): string {
  if (!iso) return "Not scheduled";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Not scheduled";
  if (d.getTime() < Date.now()) return "Due now";
  return d.toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" });
}

export function AgentWorkboard({
  entries,
  awaitingFounder,
}: {
  entries: AgentWorkboardEntry[];
  awaitingFounder: number;
}) {
  return (
    <Card className="mb-6">
      <CardContent className="py-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-heading font-semibold text-brand-primary">Agent workboard — today</h3>
          <Badge variant={awaitingFounder > 0 ? "warning" : "success"}>
            {awaitingFounder > 0 ? `${awaitingFounder} items awaiting founder` : "Nothing waiting on you"}
          </Badge>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <div key={entry.agentId} className="rounded-xl border border-brand-border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-brand-primary">
                  {AGENT_NAMES[entry.agentId] ?? entry.agentId}
                </span>
                <div className="flex items-center gap-1.5">
                  {entry.blockedTasks > 0 && <Badge variant="danger">{entry.blockedTasks} blocked</Badge>}
                  <Badge variant={entry.didToday > 0 ? "success" : "muted"}>{entry.didToday} today</Badge>
                </div>
              </div>
              <p className="mt-1.5 line-clamp-2 text-xs text-brand-muted">
                {entry.lastAction || "No activity yet today."}
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-brand-muted">
                <span className="min-w-0 truncate">{entry.doingNow}</span>
                <span className="shrink-0">Next: {nextRunLabel(entry.nextRunAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
