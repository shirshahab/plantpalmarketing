"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Leaf, Menu, X } from "lucide-react";
import { navItems } from "@/components/layout/nav-items";
import { LogoutButton } from "@/components/auth/logout-button";
import { UserMenu } from "@/components/auth/user-menu";
import { cn } from "@/lib/utils";

export function MobileNav({ userEmail }: { userEmail?: string | null }) {
  const [open, setOpen] = useState(false);
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
