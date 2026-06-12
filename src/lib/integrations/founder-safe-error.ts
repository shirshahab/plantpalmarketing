/**
 * Phase 40 — Never leak Supabase/PostgREST jargon to founder-facing UI.
 */

const ADMIN_PATTERNS = [
  /migration/i,
  /postgrest/i,
  /supabase/i,
  /schema cache/i,
  /table not found/i,
  /could not find the table/i,
  /relation .* does not exist/i,
  /check constraint/i,
  /row-level security/i,
  /rls/i,
  /pgrst/i,
];

export function founderSafeError(raw: string | undefined | null): string {
  const msg = (raw ?? "").trim();
  if (!msg) return "Something went wrong. Try again in a moment.";

  for (const p of ADMIN_PATTERNS) {
    if (p.test(msg)) {
      if (/storage|bucket|upload/i.test(msg)) return "Storage needs attention. Check System diagnostics.";
      if (/provider|openai|api key/i.test(msg)) return "Source not connected yet.";
      return "Setup still finishing.";
    }
  }

  return msg.length > 200 ? `${msg.slice(0, 200)}…` : msg;
}

export const FOUNDER_SETUP_MESSAGE =
  "Setup still finishing. This section will populate once everything is connected.";

export const FOUNDER_STORAGE_MESSAGE =
  "Storage needs attention. Your content was generated but may need a manual download.";

export const FOUNDER_PROVIDER_MESSAGE = "Source not connected yet.";
