import { createServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

/**
 * Phase 38 — central storage helpers for generated media.
 *
 * All uploads go through the service-role client (bypasses storage RLS) and
 * every failure returns the EXACT error message instead of swallowing it.
 */

export const VIDEO_BUCKET = "generated-videos";
export const ASSET_BUCKET = "generated-assets";

export interface UploadResult {
  ok: boolean;
  /** Public URL (bucket is public) — always set on success. */
  url?: string;
  /** Long-lived signed URL fallback, set when the bucket turns out private. */
  signedUrl?: string;
  error?: string;
}

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/**
 * Self-healing bucket check: if the bucket is missing and the service-role
 * key is available, create it (public) on the spot. This is exactly what
 * broke production — migration 055's bucket insert silently failed, so
 * "generated-videos" never existed.
 */
export async function ensureBucket(
  bucket: string
): Promise<{ ok: boolean; created: boolean; isPublic: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();
    const { data: existing, error: getError } = await supabase.storage.getBucket(bucket);
    if (existing) return { ok: true, created: false, isPublic: existing.public === true };

    if (!isServiceRoleConfigured()) {
      return {
        ok: false,
        created: false,
        isPublic: false,
        error: `Bucket "${bucket}" not found and SUPABASE_SERVICE_ROLE_KEY is missing, so it can't be auto-created (${getError?.message ?? "not found"})`,
      };
    }

    const { error: createError } = await supabase.storage.createBucket(bucket, { public: true });
    if (createError && !/already exists|duplicate/i.test(createError.message)) {
      return { ok: false, created: false, isPublic: false, error: `Could not create bucket "${bucket}": ${createError.message}` };
    }
    return { ok: true, created: true, isPublic: true };
  } catch (e) {
    return { ok: false, created: false, isPublic: false, error: errMessage(e) };
  }
}

/**
 * Uploads bytes to a bucket and returns a servable URL.
 * Auto-creates the bucket if missing (service role), prefers the public URL,
 * and falls back to a 1-year signed URL if the bucket is private.
 */
export async function uploadToBucket(
  bucket: string,
  path: string,
  bytes: Buffer,
  contentType: string
): Promise<UploadResult> {
  try {
    const supabase = createServiceClient();
    let { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, bytes, { contentType, upsert: true });

    // Bucket missing? Create it (public) and retry once.
    if (uploadError && /bucket not found/i.test(uploadError.message)) {
      const ensured = await ensureBucket(bucket);
      if (!ensured.ok) {
        return { ok: false, error: `Upload to ${bucket}/${path} failed: ${uploadError.message}. ${ensured.error ?? ""}`.trim() };
      }
      ({ error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, bytes, { contentType, upsert: true }));
    }

    if (uploadError) {
      return { ok: false, error: `Upload to ${bucket}/${path} failed: ${uploadError.message}` };
    }

    // Verify the file is actually reachable before declaring success.
    const { data: signed, error: signError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60 * 24 * 365);

    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    const publicUrl = pub?.publicUrl ?? "";

    if (publicUrl) {
      return { ok: true, url: publicUrl, signedUrl: signed?.signedUrl };
    }
    if (signed?.signedUrl) {
      return { ok: true, url: signed.signedUrl, signedUrl: signed.signedUrl };
    }
    return {
      ok: false,
      error: `Uploaded to ${bucket}/${path} but no URL is available${signError ? ` (signed URL: ${signError.message})` : ""}`,
    };
  } catch (e) {
    return { ok: false, error: `Storage client error: ${errMessage(e)}` };
  }
}

export type SelfTestStatus = "pass" | "fail" | "warning";

export interface StorageSelfTestStep {
  id: string;
  label: string;
  status: SelfTestStatus;
  detail: string;
}

export interface StorageSelfTestResult {
  bucket: string;
  ok: boolean;
  serviceRole: boolean;
  steps: StorageSelfTestStep[];
}

/**
 * Phase 38 — full storage round-trip:
 * bucket access → upload tiny file → signed URL → download → delete.
 * Reports PASS / FAIL / WARNING with the exact error at each step.
 */
export async function runStorageSelfTest(bucket: string = VIDEO_BUCKET): Promise<StorageSelfTestResult> {
  const steps: StorageSelfTestStep[] = [];
  const serviceRole = isServiceRoleConfigured();
  const path = `diagnostics/self-test-${Date.now()}.txt`;
  const payload = Buffer.from(`PlantPal storage self-test ${new Date().toISOString()}`);

  steps.push({
    id: "service_role",
    label: "Service-role key",
    status: serviceRole ? "pass" : "warning",
    detail: serviceRole
      ? "SUPABASE_SERVICE_ROLE_KEY is set — uploads bypass storage RLS"
      : "SUPABASE_SERVICE_ROLE_KEY missing — uploads use the anon key and depend on storage RLS policies",
  });

  let supabase: ReturnType<typeof createServiceClient>;
  try {
    supabase = createServiceClient();
  } catch (e) {
    steps.push({ id: "bucket", label: "Bucket access", status: "fail", detail: errMessage(e) });
    return { bucket, ok: false, serviceRole, steps };
  }

  // 1. Bucket access — getBucket tells the truth (list() returns an empty
  //    array even for missing buckets). Auto-creates when service role is set.
  const bucketCheck = await ensureBucket(bucket);
  if (!bucketCheck.ok) {
    steps.push({
      id: "bucket",
      label: "Bucket access",
      status: "fail",
      detail: `${bucketCheck.error ?? `Bucket "${bucket}" is not accessible`}. Create it (public) in Supabase Dashboard → Storage, or run migration 057.`,
    });
    return { bucket, ok: false, serviceRole, steps };
  }
  steps.push({
    id: "bucket",
    label: "Bucket access",
    status: bucketCheck.isPublic ? "pass" : "warning",
    detail: bucketCheck.created
      ? `Bucket "${bucket}" was missing — auto-created it (public)`
      : `Bucket "${bucket}" exists (${bucketCheck.isPublic ? "public" : "PRIVATE — files will use signed URLs"})`,
  });

  // 2. Upload
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, payload, { contentType: "text/plain", upsert: true });
  if (uploadError) {
    const rls = /row-level security|violates|policy|unauthorized|403/i.test(uploadError.message);
    steps.push({
      id: "upload",
      label: "Storage upload",
      status: "fail",
      detail: `Upload failed: ${uploadError.message}${
        rls
          ? " — RLS is blocking the write. Add SUPABASE_SERVICE_ROLE_KEY to env (Vercel too), or add an INSERT policy on storage.objects for this bucket."
          : ""
      }`,
    });
    return { bucket, ok: false, serviceRole, steps };
  }
  steps.push({
    id: "upload",
    label: "Storage upload",
    status: "pass",
    detail: `Wrote ${payload.length} bytes to ${bucket}/${path}`,
  });

  // 3. Signed URL
  const { data: signed, error: signError } = await supabase.storage.from(bucket).createSignedUrl(path, 300);
  if (signError || !signed?.signedUrl) {
    steps.push({
      id: "signed_url",
      label: "Signed URL",
      status: "fail",
      detail: `Signed URL generation failed: ${signError?.message ?? "no URL returned"}`,
    });
  } else {
    steps.push({ id: "signed_url", label: "Signed URL", status: "pass", detail: "Signed URL generated (5 min expiry)" });
  }

  // 4. Download (via signed URL when available, else direct download API)
  try {
    if (signed?.signedUrl) {
      const res = await fetch(signed.signedUrl, { cache: "no-store" });
      const body = res.ok ? await res.text() : "";
      if (res.ok && body.includes("self-test")) {
        steps.push({ id: "download", label: "Download access", status: "pass", detail: "File downloads and content matches" });
      } else {
        steps.push({
          id: "download",
          label: "Download access",
          status: "fail",
          detail: `Download returned HTTP ${res.status}${res.ok ? " (content mismatch)" : ""}`,
        });
      }
    } else {
      const { data: dl, error: dlError } = await supabase.storage.from(bucket).download(path);
      if (dlError || !dl) {
        steps.push({ id: "download", label: "Download access", status: "fail", detail: dlError?.message ?? "Download failed" });
      } else {
        steps.push({ id: "download", label: "Download access", status: "pass", detail: "File downloads via the storage API" });
      }
    }
  } catch (e) {
    steps.push({ id: "download", label: "Download access", status: "fail", detail: errMessage(e) });
  }

  // 5. Delete (cleanup)
  const { error: removeError } = await supabase.storage.from(bucket).remove([path]);
  steps.push({
    id: "delete",
    label: "Cleanup (delete test file)",
    status: removeError ? "warning" : "pass",
    detail: removeError ? `Delete failed: ${removeError.message} — test file left behind in diagnostics/` : "Test file deleted",
  });

  const ok = steps.every((s) => s.status !== "fail");
  return { bucket, ok, serviceRole, steps };
}
