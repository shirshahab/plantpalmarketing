import { Database } from "lucide-react";

export function ConfigBanner() {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-brand-border bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
        <Database className="h-6 w-6" />
      </div>
      <h2 className="font-heading text-xl font-bold text-brand-primary">
        Supabase not configured
      </h2>
      <p className="mt-2 text-sm text-brand-muted">
        Copy <code className="rounded bg-brand-bg px-1.5 py-0.5 text-xs">.env.local.example</code> to{" "}
        <code className="rounded bg-brand-bg px-1.5 py-0.5 text-xs">.env.local</code> and add your Supabase URL and anon key.
        Then run the SQL migrations in the Supabase SQL Editor.
      </p>
      <ol className="mt-4 space-y-1 text-left text-sm text-brand-muted">
        <li>1. Create a project at supabase.com</li>
        <li>2. Run <code className="text-xs">001_marketing_os_schema.sql</code></li>
        <li>3. Run <code className="text-xs">002_marketing_os_seed.sql</code></li>
        <li>4. Paste API keys into <code className="text-xs">.env.local</code></li>
        <li>5. Restart <code className="text-xs">npm run dev</code></li>
      </ol>
    </div>
  );
}
