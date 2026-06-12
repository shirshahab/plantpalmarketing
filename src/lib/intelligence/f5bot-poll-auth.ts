import type { NextRequest } from "next/server";
import { isAuthorizedCron } from "@/lib/cron/auth";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

/** Cron secret or authenticated dashboard session. */
export async function isAuthorizedF5BotPoll(request: NextRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret && isAuthorizedCron(request, cronSecret)) return true;

  const { user, configured } = await updateSupabaseSession(request);
  if (configured && user) return true;

  return false;
}
