import { createServerClient } from "@/lib/supabase";
import { isMissingTableError } from "@/lib/integrations/db-safe";

export interface CreativeAssetRow {
  id: string;
  projectId: string;
  variantNumber: number;
  assetType: string;
  prompt: string;
  concept: string;
  assetUrl: string;
  status: string;
  createdAt: string;
}

export interface CreativeProjectRow {
  id: string;
  title: string;
  brief: string;
  projectType: string;
  calendarItemId: string | null;
  platform: string;
  status: string;
  variantsRequested: number;
  createdAt: string;
  assets: CreativeAssetRow[];
}

export interface CreativeReviewRow {
  id: string;
  projectId: string | null;
  assetId: string | null;
  decision: string;
  feedback: string;
  createdAt: string;
}

export interface CreativePageData {
  projects: CreativeProjectRow[];
  reviews: CreativeReviewRow[];
  approvedCalendarItems: { id: string; title: string; platform: string }[];
}

export async function getCreativePageData(): Promise<CreativePageData> {
  const supabase = createServerClient();

  const [projectsRes, assetsRes, reviewsRes, calendarRes] = await Promise.all([
    supabase.from("creative_projects").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("creative_assets").select("*").order("variant_number", { ascending: true }).limit(300),
    supabase.from("creative_reviews").select("*").order("created_at", { ascending: false }).limit(30),
    supabase
      .from("content_calendar")
      .select("id, title, platform, status")
      .in("status", ["approved", "scheduled", "ready_to_publish"])
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  const safeRows = <T>(res: { data: T[] | null; error: { message?: string; code?: string } | null }): T[] => {
    if (res.error) {
      if (isMissingTableError(res.error)) return [];
      throw new Error(res.error.message ?? "Query failed");
    }
    return res.data ?? [];
  };

  const assets = safeRows(assetsRes).map((a) => ({
    id: a.id,
    projectId: a.project_id,
    variantNumber: a.variant_number,
    assetType: a.asset_type,
    prompt: a.prompt,
    concept: a.concept,
    assetUrl: a.asset_url,
    status: a.status,
    createdAt: a.created_at,
  }));

  const projects = safeRows(projectsRes).map((p) => ({
    id: p.id,
    title: p.title,
    brief: p.brief,
    projectType: p.project_type,
    calendarItemId: p.calendar_item_id,
    platform: p.platform,
    status: p.status,
    variantsRequested: p.variants_requested,
    createdAt: p.created_at,
    assets: assets.filter((a) => a.projectId === p.id),
  }));

  const reviews = safeRows(reviewsRes).map((r) => ({
    id: r.id,
    projectId: r.project_id,
    assetId: r.asset_id,
    decision: r.decision,
    feedback: r.feedback,
    createdAt: r.created_at,
  }));

  let approvedCalendarItems: CreativePageData["approvedCalendarItems"] = [];
  if (!calendarRes.error) {
    approvedCalendarItems = (calendarRes.data ?? []).map((c) => ({
      id: c.id,
      title: c.title,
      platform: c.platform,
    }));
  }

  return { projects, reviews, approvedCalendarItems };
}
