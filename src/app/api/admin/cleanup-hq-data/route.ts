import { NextResponse } from "next/server";
import { runHqCleanup } from "@/lib/pipeline/hq-cleanup";

export async function POST() {
  const result = await runHqCleanup();
  return NextResponse.json({ ok: true, ...result });
}
