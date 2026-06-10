"use client";

import { useTransition } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { logout } from "@/lib/actions/auth";

export function LogoutButton({ className = "" }: { className?: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => logout())}
      className={`inline-flex items-center gap-1.5 rounded-xl border border-brand-border px-3 py-2 text-xs font-medium text-brand-muted transition hover:bg-brand-bg hover:text-brand-primary disabled:opacity-60 ${className}`}
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
      Sign out
    </button>
  );
}
