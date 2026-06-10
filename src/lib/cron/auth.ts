import type { NextRequest } from "next/server";

export function isAuthorizedCron(request: NextRequest, secret: string): boolean {
  const auth = request.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (bearer === secret) return true;
  const cronHeader = request.headers.get("x-vercel-cron-secret");
  if (cronHeader === secret) return true;
  return false;
}
