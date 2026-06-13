"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import {
  fetchLatestF5BotAlertsAction,
  ignoreF5BotAlertAction,
  sendF5BotAlertToAgentAction,
  createContentIdeaFromAlertAction,
  createReplyDraftFromAlertAction,
} from "@/lib/actions/f5bot-intelligence";

export function F5BotFetchButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleFetch() {
    setMessage(null);
    startTransition(async () => {
      const result = await fetchLatestF5BotAlertsAction();
      if (!result.ok) {
        setMessage(result.error ?? "Fetch failed");
        return;
      }
      const c = result.counts;
      setMessage(
        c
          ? `Fetched ${c.fetched}, ${c.inserted} new, ${c.processed} processed`
          : "Fetch complete"
      );
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleFetch}
        disabled={pending}
        className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:opacity-60"
      >
        {pending ? "Fetching…" : "Fetch F5Bot Alerts"}
      </button>
      {message && <span className="text-sm text-brand-muted">{message}</span>}
    </div>
  );
}

export function F5BotAlertActions({ alertId, status }: { alertId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: boolean; error?: string }>, label: string) {
    setFeedback(null);
    startTransition(async () => {
      const result = await action();
      setFeedback(result.ok ? label : (result.error ?? "Failed"));
    });
  }

  if (status === "ignored") {
    return <Badge variant="muted">Ignored</Badge>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-1.5">
        <ActionBtn disabled={pending} onClick={() => run(() => sendF5BotAlertToAgentAction(alertId, "roots"), "Sent to Roots")}>
          Send to Roots
        </ActionBtn>
        <ActionBtn disabled={pending} onClick={() => run(() => sendF5BotAlertToAgentAction(alertId, "bloom"), "Sent to Bloom")}>
          Send to Bloom
        </ActionBtn>
        <ActionBtn disabled={pending} onClick={() => run(() => sendF5BotAlertToAgentAction(alertId, "sentinel"), "Sent to Sentinel")}>
          Send to Sentinel
        </ActionBtn>
        <ActionBtn disabled={pending} onClick={() => run(() => sendF5BotAlertToAgentAction(alertId, "atlas"), "Sent to Atlas")}>
          Send to Atlas
        </ActionBtn>
        <ActionBtn disabled={pending} onClick={() => run(() => sendF5BotAlertToAgentAction(alertId, "oak"), "Sent to Oak")}>
          Send to Oak
        </ActionBtn>
        <ActionBtn disabled={pending} onClick={() => run(() => createReplyDraftFromAlertAction(alertId), "Reply draft queued")}>
          Create Reply Draft
        </ActionBtn>
        <ActionBtn disabled={pending} onClick={() => run(() => createContentIdeaFromAlertAction(alertId), "Content idea created")}>
          Create Content Idea
        </ActionBtn>
        <ActionBtn disabled={pending} variant="muted" onClick={() => run(() => ignoreF5BotAlertAction(alertId), "Ignored")}>
          Ignore
        </ActionBtn>
      </div>
      {feedback && <span className="text-[11px] text-brand-muted">{feedback}</span>}
    </div>
  );
}

function ActionBtn({
  children,
  onClick,
  disabled,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "muted";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        variant === "muted"
          ? "rounded-lg border border-brand-border px-2 py-1 text-[11px] text-brand-muted hover:bg-brand-bg disabled:opacity-50"
          : "rounded-lg border border-brand-border bg-white px-2 py-1 text-[11px] font-medium text-brand-primary hover:bg-brand-bg disabled:opacity-50"
      }
    >
      {children}
    </button>
  );
}
