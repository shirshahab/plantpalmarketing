"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { createPartnership } from "@/lib/actions/partnerships";
import { partnershipTypes } from "@/components/layout/nav-items";
import type { PartnershipType } from "@/lib/types";

export function CreatePartnershipForm() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add Partner
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
          const result = await createPartnership({
            name: String(fd.get("name")),
            type: String(fd.get("type")) as PartnershipType,
            contact: String(fd.get("contact")),
            location: String(fd.get("location")),
            opportunity: String(fd.get("opportunity")),
            notes: String(fd.get("notes")),
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
      <h3 className="font-heading mb-4 font-semibold text-brand-primary">New partnership</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><Label>Name</Label><Input name="name" required /></div>
        <div>
          <Label>Type</Label>
          <Select name="type" defaultValue="nursery">
            {partnershipTypes.map((t) => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </Select>
        </div>
        <div><Label>Contact</Label><Input name="contact" /></div>
        <div><Label>Location</Label><Input name="location" /></div>
        <div className="sm:col-span-2"><Label>Opportunity</Label><Input name="opportunity" /></div>
        <div className="sm:col-span-2"><Label>Notes</Label><Textarea name="notes" rows={2} /></div>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <div className="mt-4 flex gap-2">
        <Button type="submit" disabled={pending}>Save</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
