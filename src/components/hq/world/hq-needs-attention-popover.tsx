"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FounderAttentionItem } from "@/lib/workflow/types";

export function HQNeedsAttentionPopover({
  items,
}: {
  items: FounderAttentionItem[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-950 hover:bg-amber-300"
      >
        {items.length} need you
      </button>

      {open && (
        <>
          {/* Mobile bottom sheet */}
          <div className="fixed inset-0 z-40 bg-black/20 sm:hidden" onClick={() => setOpen(false)} aria-hidden />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[70dvh] overflow-y-auto rounded-t-2xl border border-brand-border bg-white p-4 shadow-2xl sm:hidden">
            <PopoverContent items={items} onClose={() => setOpen(false)} />
          </div>

          {/* Desktop dropdown */}
          <div className="absolute right-0 top-full z-50 mt-2 hidden w-80 rounded-xl border border-brand-border bg-white p-4 shadow-xl sm:block">
            <PopoverContent items={items} onClose={() => setOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}

function PopoverContent({ items, onClose }: { items: FounderAttentionItem[]; onClose: () => void }) {
  return (
    <div>
      <h3 className="font-heading text-sm font-bold text-brand-primary">Needs Your Attention</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-xs text-brand-muted">Nothing needs you right now. Suspiciously peaceful.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.slice(0, 8).map((item, i) => (
            <li key={item.id} className="rounded-lg border border-brand-border/60 px-3 py-2">
              <p className="text-xs font-medium text-brand-primary">
                {i + 1}. {item.title}
              </p>
              <p className="mt-0.5 text-[10px] text-brand-muted">
                {item.type} · {item.priority} priority · Owner: {item.owner}
              </p>
              <p className="text-[10px] text-brand-muted">Action: {item.nextAction}</p>
              <Link
                href={item.href}
                onClick={onClose}
                className="mt-2 inline-block text-[11px] font-medium text-brand-accent hover:underline"
              >
                Open {item.type} →
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 border-t border-brand-border pt-3">
        <Link href="/inbox" onClick={onClose} className="text-xs font-medium text-brand-accent hover:underline">
          Open Founder Inbox →
        </Link>
      </div>
    </div>
  );
}
