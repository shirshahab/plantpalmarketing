"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { createContentIdea } from "@/lib/actions/content-ideas";
import type { ContentFormat } from "@/lib/types";

export function CreateContentForm() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add Idea
      </Button>
    );
  }

  return (
    <form
      className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await createContentIdea({
            title: String(fd.get("title")),
            format: String(fd.get("format")) as ContentFormat,
            hook: String(fd.get("hook")),
            body: String(fd.get("body")),
            status: "draft",
          });
          if (result.ok) {
            setOpen(false);
            setError(null);
            e.currentTarget.reset();
          } else {
            setError(result.error);
          }
        });
      }}
    >
      <h3 className="font-heading mb-4 font-semibold text-brand-primary">New content idea</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Title</Label>
          <Input name="title" required />
        </div>
        <div>
          <Label>Format</Label>
          <Select name="format" required defaultValue="tiktok">
            <option value="tiktok">TikTok</option>
            <option value="reels">Reels</option>
            <option value="instagram">Instagram</option>
            <option value="x">X / Threads</option>
            <option value="carousel">Carousel</option>
            <option value="blog">Blog</option>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label>Hook</Label>
          <Input name="hook" required />
        </div>
        <div className="sm:col-span-2">
          <Label>Body</Label>
          <Textarea name="body" rows={3} required />
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <div className="mt-4 flex gap-2">
        <Button type="submit" disabled={pending}>Save</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
