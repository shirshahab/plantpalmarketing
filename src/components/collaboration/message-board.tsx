"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AGENT_SLUG_LABELS } from "@/lib/agents/agent-slugs";
import { acknowledgeAgentMessage, markMessageRead } from "@/lib/actions/collaboration-agent";
import type { AgentMessage } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

const PRIORITY_VARIANT: Record<string, "danger" | "warning" | "info" | "muted"> = {
  urgent: "danger",
  high: "warning",
  medium: "info",
  low: "muted",
};

export function MessageBoard({ messages }: { messages: AgentMessage[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleAck(id: string) {
    startTransition(async () => {
      await acknowledgeAgentMessage(id);
      router.refresh();
    });
  }

  function handleRead(id: string) {
    startTransition(async () => {
      await markMessageRead(id);
      router.refresh();
    });
  }

  if (messages.length === 0) {
    return <p className="text-sm text-brand-muted">No agent messages yet.</p>;
  }

  return (
    <div className="space-y-3">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`rounded-xl border p-4 ${
            msg.status === "unread" ? "border-sky-200 bg-sky-50/40" : "border-brand-border bg-white"
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <Mail className="h-4 w-4 text-sky-600" />
            <span className="text-xs font-semibold text-brand-primary">{AGENT_SLUG_LABELS[msg.fromAgent]}</span>
            <ArrowRight className="h-3 w-3 text-brand-sage" />
            <span className="text-xs font-semibold text-brand-primary">{AGENT_SLUG_LABELS[msg.toAgent]}</span>
            <Badge variant={PRIORITY_VARIANT[msg.priority]}>{msg.priority}</Badge>
            <Badge variant="muted">{msg.messageType}</Badge>
            {msg.status === "unread" && <Badge variant="info">unread</Badge>}
            <span className="ml-auto text-[10px] text-brand-sage">
              {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="mt-2 font-medium text-brand-primary">{msg.title}</p>
          <p className="mt-1 text-sm text-brand-muted">{msg.body}</p>
          {(msg.status === "unread" || msg.status === "read") && (
            <div className="mt-3 flex gap-2">
              {msg.status === "unread" && (
                <Button size="sm" variant="secondary" disabled={pending} onClick={() => handleRead(msg.id)}>
                  {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  Mark read
                </Button>
              )}
              <Button size="sm" disabled={pending} onClick={() => handleAck(msg.id)}>
                {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                Acknowledge
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
