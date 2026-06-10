/**
 * @deprecated Replaced by Supabase Auth — see src/lib/auth/get-user.ts and AUTH.md
 */
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function isAuthEnabled(): boolean {
  return isSupabaseConfigured();
}
