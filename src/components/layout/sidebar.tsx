"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, FileText } from "lucide-react";
import { navItems } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-brand-border bg-white lg:flex">
      <div className="border-b border-brand-border px-5 py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary text-white">
            <Leaf className="h-5 w-5" />
          </div>
          <div>
            <p className="font-heading text-sm font-bold leading-tight text-brand-primary">
              PlantPal
            </p>
            <p className="text-[11px] text-brand-muted">Marketing OS</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-brand-muted hover:bg-brand-bg hover:text-brand-primary"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-brand-border p-4">
        <div className="rounded-xl bg-brand-bg p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-brand-primary">
            <FileText className="h-3.5 w-3.5" />
            PlantPal HQ
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-brand-muted">
            Living command center — human approval before any post goes live.
          </p>
        </div>
      </div>
    </aside>
  );
}
