import { createServerClient } from "@/lib/supabase/server";
import { getOpenAIConfig, isOpenAIConfigured } from "@/lib/openai/config";
import { getVideoProviderStatus } from "@/lib/video/video-provider";
import { getOpenAIVideoModel } from "@/lib/video/openai-video-provider";

/**
 * Phase 34 — full video pipeline diagnostics.
 * Checks every stage (key → model → storage → table → jobs) and reports the
 * exact failure point so nobody is left guessing.
 */

export type CheckStatus = "ok" | "warning" | "error";

export interface VideoDiagnosticCheck {
  id: string;
  label: string;
  status: CheckStatus;
  message: string;
  fix: string;
}

export interface VideoJobRow {
  id: string;
  title: string;
  status: string;
  jobId: string;
  videoUrl: string;
  errorMessage: string;
  failurePoint: string;
  directDownload: boolean;
  createdAt: string;
}

export interface VideoDiagnostics {
  checks: VideoDiagnosticCheck[];
  recentJobs: VideoJobRow[];
}

async function checkModelAvailable(model: string): Promise<{ ok: boolean; message: string }> {
  const { apiKey } = getOpenAIConfig();
  try {
    const res = await fetch(`https://api.openai.com/v1/models/${encodeURIComponent(model)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (res.ok) return { ok: true, message: `Model ${model} is available on this key` };
    if (res.status === 404) return { ok: false, message: `Model ${model} not listed for this key (it may still work for video jobs)` };
    if (res.status === 401) return { ok: false, message: "Invalid OPENAI_API_KEY (401)" };
    return { ok: false, message: `OpenAI API responded ${res.status}` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Request failed" };
  }
}

/** Verifies the bucket exists AND is writable with a tiny test upload. */
async function checkStorageBucket(): Promise<{ ok: boolean; message: string }> {
  try {
    const supabase = createServerClient();
    const path = `diagnostics/write-test-${Date.now()}.txt`;
    const { error: uploadError } = await supabase.storage
      .from("generated-videos")
      .upload(path, Buffer.from("video diagnostics write test"), {
        contentType: "text/plain",
        upsert: true,
      });
    if (uploadError) {
      return { ok: false, message: `Upload to generated-videos failed: ${uploadError.message}` };
    }
    const { data } = supabase.storage.from("generated-videos").getPublicUrl(path);
    await supabase.storage.from("generated-videos").remove([path]).catch(() => undefined);
    if (!data?.publicUrl) {
      return { ok: false, message: "Bucket is writable but public URLs are unavailable" };
    }
    return { ok: true, message: "Bucket generated-videos is writable and serves public URLs" };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Storage check failed" };
  }
}

async function checkJobPersistence(): Promise<{ ok: boolean; message: string }> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("generated_videos")
      .select("id, job_id, error_message")
      .limit(1);
    if (!error) return { ok: true, message: "generated_videos has job_id + error_message columns" };
    if (/job_id|error_message|column/i.test(error.message)) {
      return { ok: false, message: "generated_videos is missing the job columns (migration 055)" };
    }
    if (/relation|does not exist|schema cache/i.test(error.message)) {
      return { ok: false, message: "generated_videos table is missing (migration 055)" };
    }
    return { ok: false, message: error.message };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Table check failed" };
  }
}

function classifyFailurePoint(row: {
  status: string;
  jobId: string;
  videoUrl: string;
  errorMessage: string;
  directDownload: boolean;
}): string {
  if (row.status === "generated" && row.videoUrl) return "Completed — stored";
  if (row.directDownload) return "Generated, storage upload failed — direct download available";
  if (row.status === "failed" && row.errorMessage) {
    if (/api key|401|unauthorized/i.test(row.errorMessage)) return "Failed at: OpenAI key";
    if (/model/i.test(row.errorMessage)) return "Failed at: model availability";
    if (/storage|upload|bucket/i.test(row.errorMessage)) return "Failed at: storage upload";
    if (/download/i.test(row.errorMessage)) return "Failed at: provider download";
    return "Failed at: generation (provider)";
  }
  if (row.status === "generating") return row.jobId ? "In progress — poll status" : "Submitted, no job id persisted";
  if (row.status === "provider_not_configured") return "Blocked at: provider not configured";
  if (row.status === "package_ready") return "Waiting — not generated yet";
  return "—";
}

export async function runVideoDiagnostics(): Promise<VideoDiagnostics> {
  const checks: VideoDiagnosticCheck[] = [];

  // 1. OpenAI key
  const keyOk = isOpenAIConfigured();
  checks.push({
    id: "openai_key",
    label: "OpenAI API key",
    status: keyOk ? "ok" : "error",
    message: keyOk ? "OPENAI_API_KEY is set" : "OPENAI_API_KEY is missing or a placeholder",
    fix: keyOk ? "" : "Add OPENAI_API_KEY to .env.local and Vercel env vars, then redeploy.",
  });

  // 2. Provider mode
  const provider = getVideoProviderStatus();
  checks.push({
    id: "provider",
    label: "Video provider",
    status: provider.canGenerate ? "ok" : "warning",
    message: provider.message,
    fix: provider.canGenerate
      ? ""
      : "Set VIDEO_PROVIDER=openai (and OPENAI_VIDEO_MODEL=sora-2 or sora-2-pro) to enable real generation.",
  });

  // 3. Sora model availability (live)
  if (keyOk && provider.provider === "openai") {
    const model = getOpenAIVideoModel();
    const modelCheck = await checkModelAvailable(model);
    checks.push({
      id: "model",
      label: `Sora model (${model})`,
      status: modelCheck.ok ? "ok" : "warning",
      message: modelCheck.message,
      fix: modelCheck.ok
        ? ""
        : "Verify your OpenAI account has access to Sora video models, or switch OPENAI_VIDEO_MODEL.",
    });
  }

  // 4. Storage bucket + signed/public URL + upload process
  const storage = await checkStorageBucket();
  checks.push({
    id: "storage",
    label: "Storage bucket (generated-videos)",
    status: storage.ok ? "ok" : "error",
    message: storage.message,
    fix: storage.ok
      ? ""
      : "Apply migration 055 (creates the generated-videos bucket + policies) in the Supabase SQL editor.",
  });

  // 5. Job persistence
  const persistence = await checkJobPersistence();
  checks.push({
    id: "persistence",
    label: "Generation job persistence",
    status: persistence.ok ? "ok" : "error",
    message: persistence.message,
    fix: persistence.ok ? "" : "Apply migration 055 to add job_id / error_message to generated_videos.",
  });

  // 6. Recent jobs with exact failure points
  let recentJobs: VideoJobRow[] = [];
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("generated_videos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    recentJobs = (data ?? []).map((video) => {
      const row = video as Record<string, unknown>;
      const meta = (video.metadata as Record<string, unknown>) ?? {};
      const base = {
        status: video.status,
        jobId: String(row.job_id ?? meta.jobId ?? ""),
        videoUrl: video.video_url ?? "",
        errorMessage: String(row.error_message ?? meta.lastError ?? ""),
        directDownload: meta.directDownloadOnly === true,
      };
      return {
        id: video.id,
        title: String(meta.title ?? video.hook?.slice(0, 60) ?? "Video"),
        ...base,
        failurePoint: classifyFailurePoint(base),
        createdAt: video.created_at,
      };
    });
  } catch {
    // table missing — already reported by the persistence check
  }

  return { checks, recentJobs };
}
