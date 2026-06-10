"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSessionCookieValue,
  getSessionCookieName,
  isAuthEnabled,
  SESSION_MAX_AGE,
} from "@/lib/auth/session";

export type AuthResult = { ok: true } | { ok: false; error: string };

export async function login(password: string, redirectTo?: string): Promise<AuthResult> {
  const appPassword = process.env.APP_PASSWORD?.trim();
  if (!appPassword) {
    return { ok: false, error: "APP_PASSWORD not configured on server" };
  }

  if (password !== appPassword) {
    return { ok: false, error: "Incorrect password" };
  }

  const cookieStore = await cookies();
  cookieStore.set(getSessionCookieName(), createSessionCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  redirect(redirectTo && redirectTo.startsWith("/") ? redirectTo : "/");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(getSessionCookieName());
  redirect("/login");
}

export async function getAuthStatus() {
  return { enabled: isAuthEnabled() };
}
