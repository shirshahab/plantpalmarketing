"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Leaf, Mail, Lock, Loader2 } from "lucide-react";
import { login } from "@/lib/actions/auth";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await login(email, password, from);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#dceee3] via-[#f0f7f2] to-[#e8f5ec] px-4">
      <div
        className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full bg-brand-accent/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-12 h-72 w-72 rounded-full bg-brand-primary/15 blur-3xl"
        aria-hidden
      />

      <div className="relative w-full max-w-md rounded-3xl border border-white/70 bg-white/95 p-8 shadow-xl backdrop-blur-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-lg shadow-brand-primary/25">
            <Leaf className="h-8 w-8" />
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-brand-primary">
            PlantPal HQ
          </h1>
          <p className="mt-2 text-sm text-brand-muted">
            Sign in to your marketing command center
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-brand-primary">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@getplantpal.com"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-brand-border bg-brand-bg/80 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-brand-sage focus:ring-2 focus:ring-brand-sage/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-brand-primary">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-brand-border bg-brand-bg/80 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-brand-sage focus:ring-2 focus:ring-brand-sage/20"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
          )}

          <button
            type="submit"
            disabled={pending || !email || !password}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary py-3 text-sm font-semibold text-white shadow-md shadow-brand-primary/20 transition hover:bg-brand-primary/90 disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Sign in to PlantPal HQ
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-brand-muted">
          Approved team members only · No auto-posting · Human approval required for all outbound
          actions
        </p>
      </div>
    </div>
  );
}
