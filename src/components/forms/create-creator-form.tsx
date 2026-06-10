"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { createCreator } from "@/lib/actions/creators";
import type { Platform } from "@/lib/types";

export function CreateCreatorForm() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add Creator
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
          const result = await createCreator({
            name: String(fd.get("name")),
            platform: String(fd.get("platform")) as Platform,
            niche: String(fd.get("niche")),
            followers: Number(fd.get("followers")),
            engagementRate: Number(fd.get("engagementRate")),
            email: String(fd.get("email")),
            partnershipIdea: String(fd.get("partnershipIdea")),
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
      <h3 className="font-heading mb-4 font-semibold text-brand-primary">New creator</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><Label>Name</Label><Input name="name" required /></div>
        <div>
          <Label>Platform</Label>
          <Select name="platform" defaultValue="Instagram">
            {["TikTok", "Instagram", "X", "YouTube", "LinkedIn"].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
        </div>
        <div><Label>Niche</Label><Input name="niche" /></div>
        <div><Label>Email</Label><Input name="email" type="email" /></div>
        <div><Label>Followers</Label><Input name="followers" type="number" defaultValue={0} /></div>
        <div><Label>Engagement %</Label><Input name="engagementRate" type="number" step="0.1" defaultValue={0} /></div>
        <div className="sm:col-span-2"><Label>Partnership idea</Label><Input name="partnershipIdea" /></div>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <div className="mt-4 flex gap-2">
        <Button type="submit" disabled={pending}>Save</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
