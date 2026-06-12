"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FrameworkGrid } from "@/components/creative/framework-grid";
import { GeneratePanel } from "@/components/creative/generate-panel";
import { CreativeIdeaCard } from "@/components/creative/creative-idea-card";
import { CONTENT_TYPES, FORMAT_LABELS } from "@/lib/creative/framework";
import { LegacyWorkflowBadge } from "@/components/workflow/workflow-stage-badge";
import type { CreativeContentIdea } from "@/lib/types";

type ContentTab = "ideas" | "production" | "review" | "calendar" | "archived";

const TABS: { key: ContentTab; label: string; statuses: string[] }[] = [
  { key: "ideas", label: "Ideas", statuses: ["pending", "draft", "idea"] },
  { key: "production", label: "In Production", statuses: ["approved", "in_production", "generating"] },
  { key: "review", label: "Ready for Review", statuses: ["ready_for_review", "awaiting_review"] },
  { key: "calendar", label: "Sent to Calendar", statuses: ["scheduled", "calendar_ready"] },
  { key: "archived", label: "Archived", statuses: ["rejected", "archived", "killed"] },
];

function tabForStatus(status: string): ContentTab {
  for (const t of TABS) {
    if (t.statuses.includes(status)) return t.key;
  }
  if (status === "approved") return "production";
  return "ideas";
}

export function CreativeEngine({ ideas }: { ideas: CreativeContentIdea[] }) {
  const [tab, setTab] = useState<ContentTab>("ideas");
  const [filterType, setFilterType] = useState("all");
  const [filterFormat, setFilterFormat] = useState("all");
  const [sortBy, setSortBy] = useState<"viral" | "difficulty" | "newest">("viral");

  const filtered = useMemo(() => {
    let list = ideas.filter((i) => tabForStatus(i.status) === tab);
    if (filterType !== "all") list = list.filter((i) => i.contentType === filterType);
    if (filterFormat !== "all") list = list.filter((i) => i.format === filterFormat);
    if (sortBy === "viral") list.sort((a, b) => b.viralScore - a.viralScore);
    else if (sortBy === "difficulty") list.sort((a, b) => a.difficultyScore - b.difficultyScore);
    else list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }, [ideas, tab, filterType, filterFormat, sortBy]);

  const counts = useMemo(() => {
    const c: Record<ContentTab, number> = { ideas: 0, production: 0, review: 0, calendar: 0, archived: 0 };
    for (const i of ideas) c[tabForStatus(i.status)]++;
    return c;
  }, [ideas]);

  return (
    <div>
      <GeneratePanel />
      <FrameworkGrid />

      {/* Phase 40 — content flow tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
              tab === t.key
                ? "border-brand-primary bg-brand-primary text-white"
                : "border-brand-border bg-white text-brand-muted hover:text-brand-primary"
            }`}
          >
            {t.label}
            <Badge variant={tab === t.key ? "muted" : "info"} className={tab === t.key ? "bg-white/20 text-white" : ""}>
              {counts[t.key]}
            </Badge>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div>
          <Label>Filter type</Label>
          <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All types</option>
            {CONTENT_TYPES.map((t) => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Filter format</Label>
          <Select value={filterFormat} onChange={(e) => setFilterFormat(e.target.value)}>
            <option value="all">All formats</option>
            {Object.entries(FORMAT_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Sort by</Label>
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
            <option value="viral">Viral score</option>
            <option value="difficulty">Easiest first</option>
            <option value="newest">Newest</option>
          </Select>
        </div>
        <p className="pb-2 text-sm text-brand-muted">{filtered.length} in {TABS.find((t) => t.key === tab)?.label}</p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title={`No items in ${TABS.find((t) => t.key === tab)?.label}`}
          description="Approved ideas move to In Production. Nothing disappears without a destination."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((idea) => (
            <div key={idea.id}>
              <div className="mb-1 flex items-center gap-2">
                <LegacyWorkflowBadge status={idea.status} />
                {idea.status === "approved" && (
                  <span className="text-xs text-brand-muted">→ Bloom is building the content package</span>
                )}
              </div>
              <CreativeIdeaCard idea={idea} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
