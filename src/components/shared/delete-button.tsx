"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteRecord } from "@/lib/actions/shared";
import type { MarketingTable } from "@/lib/types";

export function DeleteButton({
  table,
  id,
  label = "Delete",
}: {
  table: MarketingTable;
  id: string;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="danger"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this record? This cannot be undone.")) return;
        startTransition(async () => {
          await deleteRecord(table, id);
        });
      }}
    >
      <Trash2 className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}
