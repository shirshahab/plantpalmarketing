/**
 * Supabase Edge Function — optional cron trigger for PlantPal agent workers.
 *
 * Deploy: supabase functions deploy agent-cron
 * Schedule: Supabase Dashboard → Edge Functions → Schedules (e.g. every hour)
 *
 * Set secrets:
 *   CRON_TARGET_URL=https://your-app.vercel.app/api/cron/agents
 *   CRON_SECRET=your-secret
 *
 * This function POSTs to the Next.js cron route — agents run server-side with full runner access.
 * No autonomous posting or outreach; approval gates remain in the Next.js app.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const TARGET = Deno.env.get("CRON_TARGET_URL");
const SECRET = Deno.env.get("CRON_SECRET");

Deno.serve(async () => {
  if (!TARGET || !SECRET) {
    return new Response(
      JSON.stringify({ ok: false, error: "CRON_TARGET_URL and CRON_SECRET must be set" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const res = await fetch(TARGET, {
    method: "GET",
    headers: { Authorization: `Bearer ${SECRET}` },
  });

  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
});
