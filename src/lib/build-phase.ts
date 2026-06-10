/**
 * True during `next build` page collection — skip live Supabase/network calls
 * so CI/Vercel does not hang on unreachable databases.
 */
export function isNextBuildPhase(): boolean {
  const phase = process.env.NEXT_PHASE;
  return phase === "phase-production-build" || phase === "phase-export";
}
