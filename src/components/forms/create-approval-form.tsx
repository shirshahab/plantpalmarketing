"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { createApprovalItem } from "@/lib/actions/approval-queue";
import type { ApprovalItemType } from "@/lib/types";

export function CreateApprovalForm() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add to Queue
      </Button>
    );
  }

  return (
    <form
      className="mb-6 rounded-2xl border border-brand-border bg-white p-5 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await createApprovalItem({
            type: String(fd.get("type")) as ApprovalItemType,
            channel: String(fd.get("channel")),
            draft: String(fd.get("draft")),
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
      <h3 className="font-heading mb-4 font-semibold text-brand-primary">Add to approval queue</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Type</Label>
          <Select name="type" defaultValue="social_post">
            <option value="content">Content Idea</option>
            <option value="reply">Reply Draft</option>
            <option value="image_prompt">Image Prompt</option>
            <option value="video_script">Video Script</option>
            <option value="social_post">Social Post</option>
          </Select>
        </div>
        <div><Label>Channel</Label><Input name="channel" placeholder="TikTok, Reddit…" required /></div>
        <div className="sm:col-span-2">
          <Label>Draft</Label>
          <Textarea name="draft" rows={3} required />
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
