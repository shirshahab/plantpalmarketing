"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Leaf, FileText } from "lucide-react";
import { mainNavItems, navGroups, type NavItem } from "@/components/layout/nav-items";
import { LogoutButton } from "@/components/auth/logout-button";
import { cn } from "@/lib/utils";

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
  const Icon = item.icon;
  return (
    <Link
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
}

export function Sidebar({ userEmail }: { userEmail?: string | null }) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    // Auto-expand the group containing the current page
    const initial: Record<string, boolean> = {};
    for (const group of navGroups) {
      initial[group.label] = group.items.some(
        (i) => i.href !== "/" && pathname.startsWith(i.href)
      );
    }
    return initial;
  });

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
        {mainNavItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}

        {navGroups.map((group) => {
          const GroupIcon = group.icon;
          const open = openGroups[group.label] ?? false;
          return (
            <div key={group.label} className="pt-1">
              <button
                onClick={() =>
                  setOpenGroups((prev) => ({ ...prev, [group.label]: !open }))
                }
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-muted transition-colors hover:bg-brand-bg hover:text-brand-primary"
              >
                <GroupIcon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate text-left">{group.label}</span>
                <ChevronDown
                  className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
                />
              </button>
              {open && (
                <div className="ml-3 space-y-0.5 border-l border-brand-border pl-2">
                  {group.items.map((item) => (
                    <NavLink key={`${group.label}-${item.href}`} item={item} pathname={pathname} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-brand-border p-4 space-y-3">
        {userEmail && (
          <div className="rounded-xl border border-brand-border/60 bg-brand-bg p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-sage">
              Signed in
            </p>
            <p className="mt-1 truncate text-xs font-medium text-brand-primary">{userEmail}</p>
          </div>
        )}
        <div className="rounded-xl bg-brand-bg p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-brand-primary">
            <FileText className="h-3.5 w-3.5" />
            PlantPal HQ
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-brand-muted">
            Living command center — human approval before any post goes live.
          </p>
        </div>
        <LogoutButton className="w-full justify-center" />
      </div>
    </aside>
  );
}
