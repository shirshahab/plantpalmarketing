"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Leaf, Lock, Loader2 } from "lucide-react";
import { login } from "@/lib/actions/auth";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await login(password, from);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#e8f5ec] via-white to-[#dceee3] px-4">
      <div className="w-full max-w-md rounded-3xl border border-brand-border/60 bg-white p-8 shadow-lg">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-md">
            <Leaf className="h-7 w-7" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-brand-primary">PlantPal Marketing OS</h1>
          <p className="mt-2 text-sm text-brand-muted">Private HQ — founder access only</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Enter app password"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-brand-border bg-brand-bg py-3 pl-10 pr-4 text-sm outline-none transition focus:border-brand-sage focus:ring-2 focus:ring-brand-sage/20"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
          )}

          <button
            type="submit"
            disabled={pending || !password}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary py-3 text-sm font-semibold text-white transition hover:bg-brand-primary/90 disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Sign in to HQ
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] text-brand-muted">
          Agents run on Vercel Cron — no auto-posting · human approval required for all outbound actions
        </p>
      </div>
    </div>
  );
}
