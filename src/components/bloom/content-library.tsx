"use client";

import { useMemo, useState } from "react";
import { ContentPieceCard } from "@/components/bloom/content-piece-card";
import type { BloomContentFormat, BloomContentPiece } from "@/lib/types";

const FORMATS: { id: BloomContentFormat | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "x_post", label: "X" },
  { id: "threads_post", label: "Threads" },
  { id: "tiktok_concept", label: "TikTok" },
  { id: "reels_concept", label: "Reels" },
  { id: "shorts_concept", label: "Shorts" },
  { id: "carousel", label: "Carousel" },
  { id: "blog_idea", label: "Blog" },
  { id: "email_idea", label: "Email" },
];

export function ContentLibrary({ pieces }: { pieces: BloomContentPiece[] }) {
  const [format, setFormat] = useState<BloomContentFormat | "all">("all");

  const filtered = useMemo(
    () => (format === "all" ? pieces : pieces.filter((p) => p.format === format)),
    [pieces, format]
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {FORMATS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFormat(f.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              format === f.id
                ? "bg-brand-primary text-white"
                : "bg-white text-brand-muted hover:bg-brand-bg"
            }`}
          >
            {f.label}
            {f.id !== "all" && ` (${pieces.filter((p) => p.format === f.id).length})`}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <p className="text-sm text-brand-muted">No content in this category.</p>
        ) : (
          filtered.map((piece) => <ContentPieceCard key={piece.id} piece={piece} />)
        )}
      </div>
    </div>
  );
}
