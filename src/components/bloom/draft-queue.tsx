"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { ContentPieceCard } from "@/components/bloom/content-piece-card";
import { Button } from "@/components/ui/button";
import { updateBloomPieceStatus } from "@/lib/actions/bloom-agent";
import type { BloomContentPiece } from "@/lib/types";

export function DraftQueue({ pieces }: { pieces: BloomContentPiece[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleStatus(id: string, status: "approved" | "rejected") {
    startTransition(async () => {
      await updateBloomPieceStatus(id, status);
      router.refresh();
    });
  }

  if (pieces.length === 0) {
    return <p className="text-sm text-brand-muted">Draft queue is empty — all caught up.</p>;
  }

  return (
    <div className="space-y-4">
      {pieces.map((piece) => (
        <ContentPieceCard
          key={piece.id}
          piece={piece}
          actions={
            <>
              <Button size="sm" disabled={pending} onClick={() => handleStatus(piece.id, "approved")}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Approve
              </Button>
              <Button size="sm" variant="secondary" disabled={pending} onClick={() => handleStatus(piece.id, "rejected")}>
                <X className="h-4 w-4" />
                Reject
              </Button>
            </>
          }
        />
      ))}
    </div>
  );
}
