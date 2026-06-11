"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Leaf, Menu, X } from "lucide-react";
import { isNavGroup, navMenu } from "@/components/layout/nav-items";
import { LogoutButton } from "@/components/auth/logout-button";
import { UserMenu } from "@/components/auth/user-menu";
import { cn } from "@/lib/utils";

export function MobileNav({ userEmail }: { userEmail?: string | null }) {
  const [open, setOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-brand-border bg-white px-4 py-3 lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary text-white">
            <Leaf className="h-4 w-4" />
          </div>
          <span className="font-heading text-sm font-bold text-brand-primary">
            PlantPal Marketing OS
          </span>
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 text-brand-muted hover:bg-brand-bg"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <nav className="absolute right-0 top-0 h-full w-72 overflow-y-auto bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-heading text-sm font-bold text-brand-primary">
                Navigation
              </span>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-brand-muted hover:bg-brand-bg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-0.5">
              {navMenu.map((entry) => {
                if (!isNavGroup(entry)) {
                  const isActive =
                    entry.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(entry.href);
                  const Icon = entry.icon;
                  return (
                    <Link
                      key={entry.href}
                      href={entry.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                        isActive
                          ? "bg-brand-primary text-white"
                          : "text-brand-muted hover:bg-brand-bg"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {entry.label}
                    </Link>
                  );
                }

                const GroupIcon = entry.icon;
                const groupOpen = openGroups[entry.label] ?? false;
                return (
                  <div key={entry.label} className="pt-1">
                    <button
                      onClick={() =>
                        setOpenGroups((prev) => ({ ...prev, [entry.label]: !groupOpen }))
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-muted hover:bg-brand-bg"
                    >
                      <GroupIcon className="h-4 w-4" />
                      <span className="flex-1 text-left">{entry.label}</span>
                      <ChevronDown
                        className={cn("h-3.5 w-3.5 transition-transform", groupOpen && "rotate-180")}
                      />
                    </button>
                    {groupOpen && (
                      <div className="ml-3 space-y-0.5 border-l border-brand-border pl-2">
                        {entry.items.map((item) => {
                          const isActive = pathname.startsWith(item.href);
                          const Icon = item.icon;
                          return (
                            <Link
                              key={`${entry.label}-${item.href}`}
                              href={item.href}
                              onClick={() => setOpen(false)}
                              className={cn(
                                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                                isActive
                                  ? "bg-brand-primary text-white"
                                  : "text-brand-muted hover:bg-brand-bg"
                              )}
                            >
                              <Icon className="h-4 w-4" />
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-6 space-y-3 border-t border-brand-border pt-4">
              <UserMenu email={userEmail} compact />
              <LogoutButton className="w-full justify-center" />
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
