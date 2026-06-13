"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LiveEmptyState({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: Array<{ label: string; href?: string; onClick?: () => void }>;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-border bg-brand-bg/40 px-6 py-10 text-center">
      <h3 className="font-heading text-lg font-semibold text-brand-primary">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-brand-muted">{description}</p>
      {actions && actions.length > 0 && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {actions.map((action) =>
            action.href ? (
              <Link key={action.label} href={action.href}>
                <Button size="sm" variant="secondary">
                  {action.label}
                </Button>
              </Link>
            ) : (
              <Button key={action.label} size="sm" variant="secondary" onClick={action.onClick}>
                {action.label}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}
