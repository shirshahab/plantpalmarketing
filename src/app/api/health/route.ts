import { NextResponse } from "next/server";
import { runProductionSafetyChecks } from "@/lib/production/safety-checks";

/** Public health endpoint — no secrets exposed. Used for deploy verification. */
export async function GET() {
  const report = runProductionSafetyChecks();
  return NextResponse.json({
    ok: report.readyForDeploy || report.environment !== "production",
    service: "plantpal-marketing-os",
    environment: report.environment,
    checks: {
      auth: report.authEnabled,
      cron: report.cronConfigured,
      supabase: report.supabaseConfigured,
      openai: report.openaiConfigured,
      approvalGates: report.approvalGatesEnforced,
      autoPostDisabled: report.autoPostDisabled,
      clientSecretLeak: report.clientSecretLeak,
    },
    warnings: report.warnings,
    timestamp: new Date().toISOString(),
  });
}

export const dynamic = "force-dynamic";
