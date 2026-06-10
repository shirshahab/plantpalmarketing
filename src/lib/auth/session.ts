const SESSION_COOKIE = "plantpal_session";
const SESSION_VALUE = "plantpal-authenticated";

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function getAuthSecret(): string {
  return process.env.AUTH_SECRET?.trim() || process.env.APP_PASSWORD?.trim() || "";
}

export function isAuthEnabled(): boolean {
  return Boolean(process.env.APP_PASSWORD?.trim());
}

/** Constant signed marker — verified server/edge-side only; never expose APP_PASSWORD to client */
export function getExpectedSessionToken(): string {
  const secret = getAuthSecret();
  if (!secret) return "";
  return SESSION_VALUE;
}

export function createSessionCookieValue(): string {
  return getExpectedSessionToken();
}

export function isValidSession(cookieValue: string | undefined): boolean {
  if (!isAuthEnabled()) return true;
  const expected = getExpectedSessionToken();
  if (!expected) return false;
  return cookieValue === expected;
}

export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
