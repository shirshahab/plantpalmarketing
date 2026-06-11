import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabasePublicConfig, isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Phase 38 — service-role Supabase client for server-side storage work.
 *
 * Storage uploads were failing because everything used the anon key, and the
 * RLS policies on storage.objects (migration 055) can silently fail to apply
 * on hosted Supabase ("must be owner of table objects" in the SQL editor).
 * The service-role key bypasses storage RLS entirely, so uploads work
 * regardless of policy state. SERVER-SIDE ONLY — never import from client
 * components.
 */

export function isServiceRoleConfigured(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  return key.length >= 20 && !key.toLowerCase().includes("your_service");
}

/**
 * Returns a service-role client when SUPABASE_SERVICE_ROLE_KEY is set,
 * otherwise falls back to the anon client (uploads then depend on storage
 * RLS policies existing).
 */
export function createServiceClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local"
    );
  }
  const { url, key: anonKey } = getSupabasePublicConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return createClient<Database>(url, isServiceRoleConfigured() && serviceKey ? serviceKey : anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
