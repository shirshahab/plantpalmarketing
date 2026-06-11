import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getOpenAIClient } from "@/lib/openai/client";
import { isOpenAIConfigured } from "@/lib/openai/config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Phase 34 — direct video download proxy.
 * When a video generated successfully but the storage upload failed, this
 * route streams the MP4 straight from the provider (server-side, with the
 * API key) so a successful generation is never hidden from the founder.
 * Provider download links expire ~1 hour after completion.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params;

  if (!isOpenAIConfigured()) {
    return NextResponse.json({ ok: false, error: "OpenAI is not configured" }, { status: 503 });
  }

  const supabase = createServerClient();
  const { data: video, error } = await supabase
    .from("generated_videos")
    .select("*")
    .eq("id", videoId)
    .maybeSingle();
  if (error || !video) {
    return NextResponse.json({ ok: false, error: error?.message ?? "Video not found" }, { status: 404 });
  }

  const row = video as Record<string, unknown>;
  const meta = (video.metadata as Record<string, unknown>) ?? {};
  const jobId = String(row.job_id ?? meta.jobId ?? "");
  if (!jobId) {
    return NextResponse.json({ ok: false, error: "No generation job for this video" }, { status: 400 });
  }

  try {
    const client = getOpenAIClient();
    const res = await client.videos.downloadContent(jobId);
    if (!res.ok || !res.body) {
      return NextResponse.json(
        {
          ok: false,
          error: `Video download failed (${res.status}). Provider download links expire ~1 hour after generation — regenerate if needed.`,
        },
        { status: 502 }
      );
    }

    return new NextResponse(res.body, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="plantpal-video-${videoId.slice(0, 8)}.mp4"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Download failed" },
      { status: 502 }
    );
  }
}
