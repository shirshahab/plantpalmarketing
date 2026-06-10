"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { ScheduleCard } from "@/components/sprout/schedule-card";
import { Button } from "@/components/ui/button";
import { markSproutPublished } from "@/lib/actions/sprout-agent";
import type { SproutScheduledPost } from "@/lib/types";

export function ReadyQueue({ posts }: { posts: SproutScheduledPost[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handlePublished(id: string) {
    startTransition(async () => {
      await markSproutPublished(id);
      router.refresh();
    });
  }

  if (posts.length === 0) {
    return <p className="text-sm text-brand-muted">No posts ready for publish.</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-amber-800 rounded-lg bg-amber-50 px-3 py-2">
        Ready posts are schedule-approved. Mark as published after you manually post — Sprout never auto-publishes.
      </p>
      {posts.map((post) => (
        <ScheduleCard
          key={post.id}
          post={post}
          actions={
            <Button size="sm" disabled={pending} onClick={() => handlePublished(post.id)}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Mark Published
            </Button>
          }
        />
      ))}
    </div>
  );
}
