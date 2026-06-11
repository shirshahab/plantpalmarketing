/**
 * Phase 33 — user-facing copy for incomplete backend setup.
 * Production users must never see raw table names, Supabase schema cache
 * errors, or migration filenames. Developer detail lives at /admin/setup-health.
 */
export const SETUP_PENDING_MESSAGE =
  "System setup is still finishing. This section will populate once the backend is ready.";

export const SETUP_PENDING_SHORT = "Setup still finishing. Check back soon.";

/** True when a Supabase error means an optional table/column isn't there yet. */
export function isSetupPendingError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("schema cache") ||
    m.includes("does not exist") ||
    m.includes("could not find the table") ||
    m.includes("relation") ||
    m.includes("column")
  );
}

/** Convert any raw backend error into safe user-facing copy. */
export function toUserFacingError(message: string): string {
  return isSetupPendingError(message) ? SETUP_PENDING_MESSAGE : message;
}
