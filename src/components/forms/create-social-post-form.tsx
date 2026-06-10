"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { createSocialPost } from "@/lib/actions/social-posts";
import type { Platform } from "@/lib/types";

export function CreateSocialPostForm() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        New Post
      </Button>
    );
  }

  return (
    <form
      className="mb-6 rounded-2xl border border-brand-border bg-white p-5 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const hashtags = String(fd.get("hashtags"))
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        startTransition(async () => {
          const result = await createSocialPost({
            platform: String(fd.get("platform")) as Platform,
            caption: String(fd.get("caption")),
            hashtags,
            status: "draft",
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
      <h3 className="font-heading mb-4 font-semibold text-brand-primary">New social post</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Platform</Label>
          <Select name="platform" defaultValue="Instagram">
            {["TikTok", "Instagram", "X", "Threads", "Facebook", "LinkedIn", "YouTube"].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label>Caption</Label>
          <Textarea name="caption" rows={4} required />
        </div>
        <div className="sm:col-span-2">
          <Label>Hashtags (comma-separated)</Label>
          <Input name="hashtags" placeholder="#PlantCare, #PlantParent" />
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
