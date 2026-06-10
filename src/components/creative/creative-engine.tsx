"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, Label } from "@/components/ui/input";
import { FrameworkGrid } from "@/components/creative/framework-grid";
import { GeneratePanel } from "@/components/creative/generate-panel";
import { CreativeIdeaCard } from "@/components/creative/creative-idea-card";
import { CONTENT_TYPES, FORMAT_LABELS } from "@/lib/creative/framework";
import type { CreativeContentIdea } from "@/lib/types";

export function CreativeEngine({ ideas }: { ideas: CreativeContentIdea[] }) {
  const [filterType, setFilterType] = useState("all");
  const [filterFormat, setFilterFormat] = useState("all");
  const [sortBy, setSortBy] = useState<"viral" | "difficulty" | "newest">("viral");

  const filtered = useMemo(() => {
    let list = [...ideas];
    if (filterType !== "all") {
      list = list.filter((i) => i.contentType === filterType);
    }
    if (filterFormat !== "all") {
      list = list.filter((i) => i.format === filterFormat);
    }
    if (sortBy === "viral") {
      list.sort((a, b) => b.viralScore - a.viralScore);
    } else if (sortBy === "difficulty") {
      list.sort((a, b) => a.difficultyScore - b.difficultyScore);
    } else {
      list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return list;
  }, [ideas, filterType, filterFormat, sortBy]);

  return (
    <div>
      <GeneratePanel />
      <FrameworkGrid />

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div>
          <Label>Filter type</Label>
          <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All types</option>
            {CONTENT_TYPES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Filter format</Label>
          <Select value={filterFormat} onChange={(e) => setFilterFormat(e.target.value)}>
            <option value="all">All formats</option>
            {Object.entries(FORMAT_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Sort by</Label>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          >
            <option value="viral">Viral score</option>
            <option value="difficulty">Easiest first</option>
            <option value="newest">Newest</option>
          </Select>
        </div>
        <p className="pb-2 text-sm text-brand-muted">
          {filtered.length} idea{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No creative ideas yet"
          description="Hit Generate 5 Ideas or Generate 100 Ideas to fill your pipeline."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((idea) => (
            <CreativeIdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}
    </div>
  );
}
