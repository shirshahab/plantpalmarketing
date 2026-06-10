/**
 * Server-only production safety checks.
 * Never return secret values — only boolean/status flags.
 */

const SERVER_ONLY_KEYS = [
  "OPENAI_API_KEY",
  "OPENWEATHER_API_KEY",
  "PLANTNET_API_KEY",
  "PERENUAL_API_KEY",
  "SERPAPI_KEY",
  "X_BEARER_TOKEN",
  "X_API_KEY",
  "X_API_SECRET",
  "X_ACCESS_TOKEN",
  "X_ACCESS_TOKEN_SECRET",
  "CRON_SECRET",
  "APP_PASSWORD",
  "AUTH_SECRET",
] as const;

/** Keys that must never be exposed via NEXT_PUBLIC_ prefix */
const FORBIDDEN_PUBLIC_PREFIXES = [
  "OPENAI",
  "API_KEY",
  "SECRET",
  "TOKEN",
  "PASSWORD",
  "CRON",
  "SERPAPI",
  "PLANTNET",
  "PERENUAL",
  "OPENWEATHER",
];

export interface ProductionSafetyReport {
  environment: string;
  authEnabled: boolean;
  cronConfigured: boolean;
  supabaseConfigured: boolean;
  openaiConfigured: boolean;
  clientSecretLeak: boolean;
  leakDetails: string[];
  approvalGatesEnforced: boolean;
  autoPostDisabled: boolean;
  readyForDeploy: boolean;
  warnings: string[];
}

export function runProductionSafetyChecks(): ProductionSafetyReport {
  const warnings: string[] = [];
  const leakDetails: string[] = [];

  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith("NEXT_PUBLIC_")) continue;
    const upper = key.toUpperCase();
    for (const forbidden of FORBIDDEN_PUBLIC_PREFIXES) {
      if (upper.includes(forbidden)) {
        leakDetails.push(key);
      }
    }
    if (value && SERVER_ONLY_KEYS.some((sk) => value.length > 20 && process.env[sk] === value)) {
      leakDetails.push(`${key} may mirror a server secret`);
    }
  }

  const authEnabled = Boolean(process.env.APP_PASSWORD?.trim());
  const cronConfigured = Boolean(process.env.CRON_SECRET?.trim());
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  );
  const openaiConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());

  if (process.env.NODE_ENV === "production" && !authEnabled) {
    warnings.push("APP_PASSWORD not set — HQ is publicly accessible");
  }
  if (process.env.NODE_ENV === "production" && !cronConfigured) {
    warnings.push("CRON_SECRET not set — background agents will not run on cron");
  }
  if (!supabaseConfigured) {
    warnings.push("Supabase not configured — app runs in demo mode");
  }
  if (leakDetails.length > 0) {
    warnings.push("Potential client-side secret exposure detected");
  }

  const clientSecretLeak = leakDetails.length > 0;
  const readyForDeploy =
    supabaseConfigured &&
    authEnabled &&
    cronConfigured &&
    !clientSecretLeak;

  return {
    environment: process.env.NODE_ENV ?? "development",
    authEnabled,
    cronConfigured,
    supabaseConfigured,
    openaiConfigured,
    clientSecretLeak,
    leakDetails,
    approvalGatesEnforced: true,
    autoPostDisabled: true,
    readyForDeploy,
    warnings,
  };
}
