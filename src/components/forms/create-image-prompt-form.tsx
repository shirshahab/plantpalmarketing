"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { createImagePrompt } from "@/lib/actions/image-prompts";
import { imageCategories } from "@/components/layout/nav-items";
import type { ImagePromptCategory } from "@/lib/types";

export function CreateImagePromptForm() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        New Prompt
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
          const result = await createImagePrompt({
            title: String(fd.get("title")),
            category: String(fd.get("category")) as ImagePromptCategory,
            prompt: String(fd.get("prompt")),
            style: String(fd.get("style")),
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
      <h3 className="font-heading mb-4 font-semibold text-brand-primary">New image prompt</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><Label>Title</Label><Input name="title" required /></div>
        <div>
          <Label>Category</Label>
          <Select name="category" defaultValue="social_graphic">
            {imageCategories.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </Select>
        </div>
        <div><Label>Style</Label><Input name="style" /></div>
        <div className="sm:col-span-2">
          <Label>Prompt</Label>
          <Textarea name="prompt" rows={4} required />
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
