"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { updateApprovalItem } from "@/lib/actions/approval-queue";
import type { ApprovalItem, Status } from "@/lib/types";

export function EditApprovalForm({ item }: { item: ApprovalItem }) {
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
          const result = await updateApprovalItem(item.id, {
            channel: String(fd.get("channel")),
            draft: String(fd.get("draft")),
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
      <Label>Type</Label>
      <Select name="type" defaultValue={item.type} disabled>
        <option value="content">Content Idea</option>
        <option value="reply">Reply Draft</option>
        <option value="image_prompt">Image Prompt</option>
        <option value="video_script">Video Script</option>
        <option value="social_post">Social Post</option>
      </Select>
      <Label>Channel</Label>
      <Input name="channel" defaultValue={item.channel} required />
      <Label>Status</Label>
      <Select name="status" defaultValue={item.status}>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="draft">Draft</option>
      </Select>
      <Label>Draft</Label>
      <Textarea name="draft" rows={3} defaultValue={item.draft} required />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>Save</Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
