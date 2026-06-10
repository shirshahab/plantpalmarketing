import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function fetchPageData<T>(
  fetcher: () => Promise<T>
): Promise<{ data: T | null; error: string | null; configured: boolean }> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: null, configured: false };
  }

  try {
    const data = await fetcher();
    return { data, error: null, configured: true };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to load data",
      configured: true,
    };
  }
}
