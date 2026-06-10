"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { updatePartnership } from "@/lib/actions/partnerships";
import { partnershipTypes } from "@/components/layout/nav-items";
import type { Partnership, PartnershipType } from "@/lib/types";

export function EditPartnershipForm({ partnership }: { partnership: Partnership }) {
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
          const result = await updatePartnership(partnership.id, {
            name: String(fd.get("name")),
            type: String(fd.get("type")) as PartnershipType,
            contact: String(fd.get("contact")),
            location: String(fd.get("location")),
            status: String(fd.get("status")) as Partnership["status"],
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
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-heading mb-4 font-semibold text-brand-primary">Edit partnership</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label>Name</Label><Input name="name" defaultValue={partnership.name} required /></div>
          <div>
            <Label>Type</Label>
            <Select name="type" defaultValue={partnership.type}>
              {partnershipTypes.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select name="status" defaultValue={partnership.status}>
              <option value="lead">Lead</option>
              <option value="in_discussion">In Discussion</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </Select>
          </div>
          <div><Label>Contact</Label><Input name="contact" defaultValue={partnership.contact} /></div>
          <div><Label>Location</Label><Input name="location" defaultValue={partnership.location} /></div>
          <div className="sm:col-span-2"><Label>Opportunity</Label><Input name="opportunity" defaultValue={partnership.opportunity} /></div>
          <div className="sm:col-span-2"><Label>Notes</Label><Textarea name="notes" rows={2} defaultValue={partnership.notes} /></div>
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
