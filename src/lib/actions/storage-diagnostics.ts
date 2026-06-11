"use server";

import { runStorageSelfTest, VIDEO_BUCKET, type StorageSelfTestResult } from "@/lib/storage/media-storage";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type StorageTestResponse =
  | { ok: true; result: StorageSelfTestResult }
  | { ok: false; error: string };

/**
 * Phase 38 — "Test Storage Upload" button.
 * Creates a tiny test file → uploads → signed URL → downloads → deletes,
 * and reports the exact result of every step.
 */
export async function testStorageUpload(bucket?: string): Promise<StorageTestResponse> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY missing)" };
  }
  try {
    const result = await runStorageSelfTest(bucket || VIDEO_BUCKET);
    return { ok: true, result };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Storage test failed" };
  }
}
