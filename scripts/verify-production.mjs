#!/usr/bin/env node
/**
 * Pre/post-deploy verification — reads env and prints a checklist.
 * Usage:
 *   node scripts/verify-production.mjs
 *   node scripts/verify-production.mjs https://your-app.vercel.app
 */
const baseUrl = process.argv[2]?.replace(/\/$/, "");

const required = [
  ["NEXT_PUBLIC_SUPABASE_URL", "Supabase project URL"],
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "Supabase anon key"],
  ["APP_PASSWORD", "Founder login password"],
  ["CRON_SECRET", "Vercel Cron auth"],
  ["OPENAI_API_KEY", "AI agents & daily report"],
];

const optional = [
  "AUTH_SECRET",
  "REQUIRE_APP_PASSWORD",
  "OPENWEATHER_API_KEY",
  "SERPAPI_KEY",
  "X_BEARER_TOKEN",
];

console.log("PlantPal Marketing OS — production env check\n");

let ok = true;
for (const [key, label] of required) {
  const val = process.env[key]?.trim();
  const pass = Boolean(val);
  if (!pass) ok = false;
  console.log(`${pass ? "✓" : "✗"} ${key} — ${label}`);
}

console.log("\nOptional:");
for (const key of optional) {
  const val = process.env[key]?.trim();
  console.log(`  ${val ? "✓" : "○"} ${key}`);
}

const forbidden = Object.keys(process.env).filter((k) => {
  if (!k.startsWith("NEXT_PUBLIC_")) return false;
  const u = k.toUpperCase();
  return ["SECRET", "PASSWORD", "TOKEN", "API_KEY", "CRON", "OPENAI"].some((f) => u.includes(f));
});
if (forbidden.length) {
  ok = false;
  console.log("\n✗ Forbidden NEXT_PUBLIC_ vars (remove from Vercel):");
  forbidden.forEach((k) => console.log(`  - ${k}`));
}

if (baseUrl) {
  console.log(`\nFetching ${baseUrl}/api/health ...`);
  try {
    const res = await fetch(`${baseUrl}/api/health`);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
    if (!data.ok) ok = false;
  } catch (e) {
    ok = false;
    console.error("Health check failed:", e.message);
  }
} else {
  console.log("\nTip: pass your deploy URL to verify live health:");
  console.log("  node scripts/verify-production.mjs https://your-app.vercel.app");
}

process.exit(ok ? 0 : 1);
