"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { updateSocialPost } from "@/lib/actions/social-posts";
import type { Platform, SocialPost, Status } from "@/lib/types";

export function EditSocialPostForm({ post }: { post: SocialPost }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </Button>
    );
  }

  return (
    <form
      className="w-full min-w-[280px] space-y-3 rounded-xl border border-brand-border bg-brand-bg p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const hashtags = String(fd.get("hashtags"))
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        startTransition(async () => {
          const result = await updateSocialPost(post.id, {
            platform: String(fd.get("platform")) as Platform,
            caption: String(fd.get("caption")),
            hashtags,
            status: String(fd.get("status")) as Status,
          });
          if (result.ok) {
            setOpen(false);
            setError(null);
          } else {
            setError(result.error);
          }
        });
      }}
    >
      <Label>Platform</Label>
      <Select name="platform" defaultValue={post.platform}>
        {["TikTok", "Instagram", "X", "Threads", "Facebook", "LinkedIn", "YouTube"].map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </Select>
      <Label>Status</Label>
      <Select name="status" defaultValue={post.status}>
        <option value="draft">Draft</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </Select>
      <Label>Caption</Label>
      <Textarea name="caption" rows={4} defaultValue={post.caption} required />
      <Label>Hashtags (comma-separated)</Label>
      <Input name="hashtags" defaultValue={post.hashtags.join(", ")} />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>Save</Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
