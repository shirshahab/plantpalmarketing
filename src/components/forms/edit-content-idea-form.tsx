"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { updateContentIdea } from "@/lib/actions/content-ideas";
import type { ContentFormat, ContentIdea, Status } from "@/lib/types";

export function EditContentIdeaForm({ idea }: { idea: ContentIdea }) {
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
        startTransition(async () => {
          const result = await updateContentIdea(idea.id, {
            title: String(fd.get("title")),
            format: String(fd.get("format")) as ContentFormat,
            hook: String(fd.get("hook")),
            body: String(fd.get("body")),
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
      <Label>Title</Label>
      <Input name="title" defaultValue={idea.title} required />
      <Label>Format</Label>
      <Select name="format" defaultValue={idea.format}>
        <option value="tiktok">TikTok</option>
        <option value="reels">Reels</option>
        <option value="instagram">Instagram</option>
        <option value="x">X / Threads</option>
        <option value="carousel">Carousel</option>
        <option value="blog">Blog</option>
      </Select>
      <Label>Status</Label>
      <Select name="status" defaultValue={idea.status}>
        <option value="draft">Draft</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </Select>
      <Label>Hook</Label>
      <Input name="hook" defaultValue={idea.hook} required />
      <Label>Body</Label>
      <Textarea name="body" rows={3} defaultValue={idea.body} required />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>Save</Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
