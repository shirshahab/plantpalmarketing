"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, Loader2, X } from "lucide-react";
import { ScheduleCard } from "@/components/sprout/schedule-card";
import { Button } from "@/components/ui/button";
import { approveSproutSchedule, rejectSproutSchedule } from "@/lib/actions/sprout-agent";
import type { SproutScheduledPost } from "@/lib/types";

export function QueueManagement({ queue }: { queue: SproutScheduledPost[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleApprove(id: string) {
    startTransition(async () => {
      await approveSproutSchedule(id);
      router.refresh();
    });
  }

  function handleReject(id: string) {
    startTransition(async () => {
      await rejectSproutSchedule(id);
      router.refresh();
    });
  }

  if (queue.length === 0) {
    return <p className="text-sm text-brand-muted">Publish queue is empty. Run Sprout scan to pull approved content.</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-brand-muted">
        Approval required before scheduling. Sprout recommends times — you confirm before anything goes live. No auto-publishing.
      </p>
      {queue.map((post) => (
        <ScheduleCard
          key={post.id}
          post={post}
          actions={
            <>
              <Button size="sm" disabled={pending} onClick={() => handleApprove(post.id)}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
                Approve Schedule
              </Button>
              <Button size="sm" variant="secondary" disabled={pending} onClick={() => handleReject(post.id)}>
                <X className="h-4 w-4" />
                Hold
              </Button>
            </>
          }
        />
      ))}
    </div>
  );
}
