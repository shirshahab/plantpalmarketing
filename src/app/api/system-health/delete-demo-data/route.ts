import { NextResponse } from "next/server";
import { deleteOrRejectDemoRows } from "@/lib/pipeline/demo-audit";

export async function POST() {
  const result = await deleteOrRejectDemoRows();
  return NextResponse.json({ ok: true, ...result });
}
