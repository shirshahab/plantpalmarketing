"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { updateCreator } from "@/lib/actions/creators";
import type { Creator, Platform } from "@/lib/types";

export function EditCreatorForm({ creator }: { creator: Creator }) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={() => setOpen(false)}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await updateCreator(creator.id, {
            name: String(fd.get("name")),
            platform: String(fd.get("platform")) as Platform,
            niche: String(fd.get("niche")),
            followers: Number(fd.get("followers")),
            engagementRate: Number(fd.get("engagementRate")),
            email: String(fd.get("email")),
            status: String(fd.get("status")) as Creator["status"],
            notes: String(fd.get("notes")),
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
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-heading mb-4 font-semibold text-brand-primary">Edit creator</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label>Name</Label><Input name="name" defaultValue={creator.name} required /></div>
          <div>
            <Label>Platform</Label>
            <Select name="platform" defaultValue={creator.platform}>
              {["TikTok", "Instagram", "X", "YouTube", "LinkedIn", "Threads", "Facebook", "Reddit"].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select name="status" defaultValue={creator.status}>
              <option value="prospect">Prospect</option>
              <option value="contacted">Contacted</option>
              <option value="negotiating">Negotiating</option>
              <option value="partnered">Partnered</option>
              <option value="declined">Declined</option>
            </Select>
          </div>
          <div><Label>Niche</Label><Input name="niche" defaultValue={creator.niche} /></div>
          <div><Label>Email</Label><Input name="email" type="email" defaultValue={creator.email} /></div>
          <div><Label>Followers</Label><Input name="followers" type="number" defaultValue={creator.followers} /></div>
          <div><Label>Engagement %</Label><Input name="engagementRate" type="number" step="0.1" defaultValue={creator.engagementRate} /></div>
          <div className="sm:col-span-2"><Label>Partnership idea</Label><Input name="partnershipIdea" defaultValue={creator.partnershipIdea} /></div>
          <div className="sm:col-span-2"><Label>Notes</Label><Input name="notes" defaultValue={creator.notes} /></div>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <div className="mt-4 flex gap-2">
          <Button type="submit" disabled={pending}>Save</Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </div>
    </form>
  );
}
