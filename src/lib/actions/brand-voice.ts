"use server";

import { runVoiceCheckWithAI, type AIVoiceCheckResult } from "@/lib/brand/voice-check";
import type { BrandPlatform } from "@/lib/brand/brand-brain";

export type VoiceTestResult =
  | { ok: true; result: AIVoiceCheckResult }
  | { ok: false; error: string };

/** Phase 35 — live voice tester: score any caption against the Brand Brain. */
export async function testBrandVoice(text: string, platform?: BrandPlatform): Promise<VoiceTestResult> {
  const clean = (text ?? "").trim();
  if (!clean) return { ok: false, error: "Paste a caption to score." };
  if (clean.length > 4000) return { ok: false, error: "Caption too long — keep it under 4000 characters." };

  const result = await runVoiceCheckWithAI(clean, platform);
  return { ok: true, result };
}
