"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Loader2, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AGENT_SLUG_LABELS } from "@/lib/agents/agent-slugs";
import { completeAgentTask, startAgentTask } from "@/lib/actions/collaboration-agent";
import type { AgentTask } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const STATUS_ICON = {
  pending: Circle,
  in_progress: Play,
  completed: CheckCircle2,
  blocked: Circle,
  cancelled: Circle,
};

export function TaskBoard({ tasks, showCompleted = false }: { tasks: AgentTask[]; showCompleted?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const filtered = showCompleted
    ? tasks.filter((t) => t.status === "completed")
    : tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled");

  function handleStart(id: string) {
    startTransition(async () => {
      await startAgentTask(id);
      router.refresh();
    });
  }

  function handleComplete(id: string) {
    startTransition(async () => {
      await completeAgentTask(id);
      router.refresh();
    });
  }

  if (filtered.length === 0) {
    return (
      <p className="text-sm text-brand-muted">
        {showCompleted ? "No completed tasks yet." : "No active tasks."}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {filtered.map((task) => {
        const Icon = STATUS_ICON[task.status];
        return (
          <div
            key={task.id}
            className={`rounded-xl border p-4 ${
              task.status === "completed"
                ? "border-emerald-200 bg-emerald-50/30"
                : task.priority === "urgent"
                  ? "border-rose-200 bg-rose-50/30"
                  : "border-brand-border bg-white"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Icon className={`h-4 w-4 ${task.status === "completed" ? "text-emerald-600" : "text-brand-sage"}`} />
              <Badge variant={task.priority === "urgent" ? "danger" : task.priority === "high" ? "warning" : "muted"}>
                {task.priority}
              </Badge>
              <Badge variant="info">{task.taskType.replace(/_/g, " ")}</Badge>
              <Badge variant={task.status === "completed" ? "success" : "muted"}>{task.status}</Badge>
            </div>
            <p className="mt-2 text-sm text-brand-primary">{task.description}</p>
            <p className="mt-1 text-xs text-brand-muted">
              {AGENT_SLUG_LABELS[task.createdBy]} → {AGENT_SLUG_LABELS[task.assignedAgent]}
              {task.dueDate && ` · Due ${formatDate(task.dueDate)}`}
              {" · "}{formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
            </p>
            {!showCompleted && task.status !== "completed" && (
              <div className="mt-3 flex gap-2">
                {task.status === "pending" && (
                  <Button size="sm" variant="secondary" disabled={pending} onClick={() => handleStart(task.id)}>
                    {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                    Start
                  </Button>
                )}
                <Button size="sm" disabled={pending} onClick={() => handleComplete(task.id)}>
                  {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                  Complete
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
