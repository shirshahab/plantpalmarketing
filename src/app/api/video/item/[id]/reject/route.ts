import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: existing } = await supabase
    .from("video_generation_queue")
    .select("metadata")
    .eq("id", id)
    .maybeSingle();

  const metadata = (existing?.metadata && typeof existing.metadata === "object"
    ? existing.metadata
    : {}) as Record<string, unknown>;

  const { error } = await supabase
    .from("video_generation_queue")
    .update({
      status: "rejected",
      metadata: {
        ...metadata,
        rejected_reason: "Rejected by founder from video detail",
      } as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
