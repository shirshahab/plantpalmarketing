import { NextResponse } from "next/server";
import { rejectBadImageRows } from "@/lib/pipeline/hq-cleanup";

export async function POST() {
  const result = await rejectBadImageRows();
  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, rejected: result.rejected });
}
