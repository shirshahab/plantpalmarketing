"use client";

import { ScheduleCard } from "@/components/sprout/schedule-card";
import type { SproutScheduledPost } from "@/lib/types";

export function ContentSchedule({ posts }: { posts: SproutScheduledPost[] }) {
  if (posts.length === 0) {
    return <p className="text-sm text-brand-muted">No content scheduled.</p>;
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <ScheduleCard key={post.id} post={post} />
      ))}
    </div>
  );
}
