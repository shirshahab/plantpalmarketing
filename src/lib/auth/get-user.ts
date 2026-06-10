import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function getServerUser() {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createAuthServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

export function isSupabaseAuthEnabled(): boolean {
  return isSupabaseConfigured();
}
