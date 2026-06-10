"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreatorLeadActions } from "@/components/creators/creator-lead-actions";
import { ScoreBreakdown } from "@/components/creators/score-breakdown";
import type { CreatorLead, CreatorPartnership } from "@/lib/types";

export function CreatorLeadDrawer({
  lead,
  partnerships,
  onClose,
}: {
  lead: CreatorLead | null;
  partnerships: CreatorPartnership[];
  onClose: () => void;
}) {
  if (!lead) return null;

  const related = partnerships.filter((p) => p.creatorLeadId === lead.id);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-brand-primary/20 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <aside className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-lg flex-col border-l border-brand-border bg-white shadow-2xl sm:top-16">
        <div className="flex items-center justify-between border-b border-brand-border px-5 py-4">
          <h2 className="font-heading text-lg font-bold text-brand-primary">Creator Lead</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-brand-muted hover:bg-brand-bg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">{lead.platform}</Badge>
            <Badge variant={lead.priority === "high" ? "warning" : "muted"}>{lead.priority} priority</Badge>
            <Badge variant="success">Score {lead.partnershipScore}</Badge>
          </div>

          <h3 className="mt-3 font-heading text-xl font-bold text-brand-primary">{lead.name}</h3>
          <p className="text-sm text-brand-muted">{lead.handle}</p>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-brand-muted">Category</span><p className="font-medium">{lead.category}</p></div>
            <div><span className="text-brand-muted">Followers</span><p className="font-medium">{lead.followers.toLocaleString()}</p></div>
            <div><span className="text-brand-muted">Engagement</span><p className="font-medium">{lead.engagementRate}%</p></div>
            <div><span className="text-brand-muted">Avg Views</span><p className="font-medium">{lead.averageViews.toLocaleString()}</p></div>
            <div><span className="text-brand-muted">Location</span><p className="font-medium">{lead.location || "—"}</p></div>
            <div><span className="text-brand-muted">Source</span><p className="font-medium">{lead.source}</p></div>
          </div>

          {(lead.email || lead.website) && (
            <div className="mt-3 text-sm">
              {lead.email && <p><span className="text-brand-muted">Email:</span> {lead.email}</p>}
              {lead.website && <p><span className="text-brand-muted">Web:</span> {lead.website}</p>}
            </div>
          )}

          <div className="mt-6">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-brand-sage">Partnership score breakdown</h4>
            <ScoreBreakdown lead={lead} />
          </div>

          {lead.suggestedIdeas.length > 0 && (
            <div className="mt-6">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-brand-sage">Suggested ideas</h4>
              <ul className="mt-2 space-y-1">
                {lead.suggestedIdeas.map((idea) => (
                  <li key={idea} className="text-sm text-gray-700">• {idea}</li>
                ))}
              </ul>
            </div>
          )}

          {related.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-brand-sage">Partnership proposals</h4>
              {related.map((p) => (
                <div key={p.id} className="rounded-xl border border-brand-border p-3">
                  <p className="font-medium text-brand-primary">{p.title}</p>
                  <Badge variant="muted" className="mt-1 text-[10px]">{p.ideaType.replace(/_/g, " ")}</Badge>
                  <p className="mt-2 text-xs text-brand-muted">{p.description}</p>
                </div>
              ))}
            </div>
          )}

          {lead.notes && (
            <div className="mt-6 rounded-xl bg-brand-bg/50 p-3 text-sm text-brand-muted">{lead.notes}</div>
          )}

          <div className="mt-6">
            <CreatorLeadActions leadId={lead.id} status={lead.status} />
          </div>
        </div>

        <div className="border-t border-brand-border p-4">
          <Button variant="secondary" className="w-full" onClick={onClose}>Close</Button>
        </div>
      </aside>
    </>
  );
}
