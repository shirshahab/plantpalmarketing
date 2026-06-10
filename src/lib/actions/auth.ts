"use server";

import { redirect } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type AuthResult = { ok: true } | { ok: false; error: string };

export async function login(
  email: string,
  password: string,
  redirectTo?: string
): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured on the server" };
  }

  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail || !password) {
    return { ok: false, error: "Email and password are required" };
  }

  const supabase = await createAuthServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const target =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("/login")
      ? redirectTo
      : "/";

  redirect(target);
}

export async function logout() {
  if (isSupabaseConfigured()) {
    const supabase = await createAuthServerClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}

export async function getAuthStatus() {
  return { enabled: isSupabaseConfigured(), provider: "supabase" as const };
}
