"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/actions/notifications";
import type { NotificationFilter, NotificationRow } from "@/lib/notifications/types";
import { formatDate } from "@/lib/utils";

const FILTERS: { key: NotificationFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "founder_action", label: "Founder Action" },
  { key: "agent_updates", label: "Agent Updates" },
  { key: "failures", label: "Failures" },
  { key: "calendar", label: "Calendar" },
  { key: "content", label: "Content" },
];

export function NotificationBell({ initialCount = 0 }: { initialCount?: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState(initialCount);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    fetchNotifications(filter).then(setItems);
  }, [open, filter]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function handleClick(n: NotificationRow) {
    await markNotificationRead(n.id);
    setUnread((c) => Math.max(0, c - 1));
    setOpen(false);
    router.push(n.targetRoute);
  }

  async function markAll() {
    await markAllNotificationsRead();
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-xl border border-brand-border p-2.5 text-brand-muted transition hover:bg-brand-bg hover:text-brand-primary"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-accent px-0.5 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,380px)] rounded-2xl border border-brand-border bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-brand-border px-4 py-3">
            <p className="font-heading text-sm font-semibold text-brand-primary">Notification Center</p>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={markAll}>
                <CheckCheck className="mr-1 h-3.5 w-3.5" /> Mark all read
              </Button>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-brand-muted hover:bg-brand-bg">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 border-b border-brand-border px-3 py-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  filter === f.key ? "bg-brand-primary text-white" : "bg-brand-bg text-brand-muted"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-brand-muted">No notifications yet.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClick(n)}
                  className={`flex w-full flex-col gap-0.5 border-b border-brand-border/50 px-4 py-3 text-left transition hover:bg-brand-bg/60 ${
                    !n.readAt ? "bg-brand-accent/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {!n.readAt && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent" />}
                    <span className="text-sm font-medium text-brand-primary">{n.title}</span>
                    <Badge variant="muted" className="ml-auto text-[9px]">
                      {n.type.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  {n.message && <p className="text-xs text-brand-muted">{n.message}</p>}
                  <span className="text-[10px] text-brand-muted">{formatDate(n.createdAt)}</span>
                </button>
              ))
            )}
          </div>

          <div className="border-t border-brand-border px-4 py-2">
            <Link href="/inbox" className="text-xs font-medium text-brand-accent hover:underline" onClick={() => setOpen(false)}>
              Open Founder Inbox →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
