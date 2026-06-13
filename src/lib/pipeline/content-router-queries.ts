import { createServerClient } from "@/lib/supabase/server";
import { isStrictStudioReady, type CreativeQueueMetadata } from "@/lib/content/creative-routing-guard";
import type { ContentPipelineRow } from "@/lib/pipeline/content-pipeline";

export interface ContentRouterItem {
  id: string;
  title: string;
  status: string;
  destination: string;
  sourceTable: string;
  updatedAt: string;
  kind: "pipeline" | "video" | "image" | "seo";
}

export interface ContentRouterData {
  incomingFromBloom: ContentRouterItem[];
  readyForVideo: ContentRouterItem[];
  readyForImage: ContentRouterItem[];
  readyForSeo: ContentRouterItem[];
  recentlyRouted: ContentRouterItem[];
  workflowHistory: { at: string; event: string; title: string }[];
  totalWaiting: number;
}

function mapPipeline(row: ContentPipelineRow, kind: ContentRouterItem["kind"] = "pipeline"): ContentRouterItem {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    destination: row.destination,
    sourceTable: row.sourceTable,
    updatedAt: row.updatedAt,
    kind,
  };
}

function parseMeta(raw: unknown): CreativeQueueMetadata {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw as CreativeQueueMetadata;
  return {};
}

export async function getContentRouterData(): Promise<ContentRouterData> {
  const empty: ContentRouterData = {
    incomingFromBloom: [],
    readyForVideo: [],
    readyForImage: [],
    readyForSeo: [],
    recentlyRouted: [],
    workflowHistory: [],
    totalWaiting: 0,
  };

  try {
    const supabase = createServerClient();
    const [pipelineRes, videoRes, imageRes, seoRes, workflowRes] = await Promise.all([
      supabase
        .from("content_pipeline")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(40),
      supabase.from("video_generation_queue").select("*").eq("status", "pending").limit(50),
      supabase.from("image_prompts").select("*").eq("status", "pending").limit(50),
      supabase
        .from("seo_blog_posts")
        .select("id, headline, keyword, status, updated_at")
        .in("status", ["draft", "gate_review", "voice_check_failed", "pending_review"])
        .order("updated_at", { ascending: false })
        .limit(20),
      supabase.from("content_workflows").select("*").order("updated_at", { ascending: false }).limit(15),
    ]);

    const pipelineRows = (pipelineRes.data ?? []).map((r) => {
      const row = r as Record<string, unknown>;
      return {
        id: String(row.id),
        sourceTable: String(row.source_table ?? ""),
        sourceId: String(row.source_id ?? ""),
        title: String(row.title ?? ""),
        body: String(row.body ?? ""),
        status: String(row.status ?? ""),
        destination: String(row.destination ?? ""),
        workflowHistory: [],
        createdAt: String(row.created_at ?? ""),
        updatedAt: String(row.updated_at ?? ""),
      } satisfies ContentPipelineRow;
    });

    const incomingFromBloom = pipelineRows
      .filter((r) => r.destination === "bloom" && ["approved", "in_production"].includes(r.status))
      .map((r) => mapPipeline(r));

    const recentlyRouted = pipelineRows.slice(0, 12).map((r) => mapPipeline(r));

    const readyForVideo = (videoRes.data ?? [])
      .filter((row) => {
        const r = row as Record<string, unknown>;
        return isStrictStudioReady(parseMeta(r.metadata), "video");
      })
      .map((row) => {
        const r = row as Record<string, unknown>;
        return {
          id: String(r.id),
          title: String(r.title ?? ""),
          status: String(r.status ?? "pending"),
          destination: "video",
          sourceTable: String(r.source_table ?? ""),
          updatedAt: String(r.updated_at ?? ""),
          kind: "video" as const,
        };
      });

    const readyForImage = (imageRes.data ?? [])
      .filter((row) => {
        const r = row as Record<string, unknown>;
        return isStrictStudioReady(parseMeta(r.metadata), "image");
      })
      .map((row) => {
        const r = row as Record<string, unknown>;
        return {
          id: String(r.id),
          title: String(r.title ?? ""),
          status: String(r.status ?? "pending"),
          destination: "image",
          sourceTable: String(r.source_table ?? ""),
          updatedAt: String(r.updated_at ?? ""),
          kind: "image" as const,
        };
      });

    const readyForSeo = (seoRes.data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: String(r.id),
        title: String(r.headline ?? r.keyword ?? ""),
        status: String(r.status ?? "draft"),
        destination: "seo",
        sourceTable: "seo_blog_posts",
        updatedAt: String(r.updated_at ?? ""),
        kind: "seo" as const,
      };
    });

    const workflowHistory = (workflowRes.data ?? []).flatMap((row) => {
      const r = row as Record<string, unknown>;
      const history = Array.isArray(r.history_log) ? r.history_log : [];
      const title = String(r.title ?? "");
      return history.slice(-3).map((e: { at?: string; event?: string }) => ({
        at: String(e.at ?? r.updated_at ?? ""),
        event: String(e.event ?? "Transition"),
        title,
      }));
    });

    const totalWaiting =
      incomingFromBloom.length + readyForVideo.length + readyForImage.length + readyForSeo.length;

    return {
      incomingFromBloom,
      readyForVideo,
      readyForImage,
      readyForSeo,
      recentlyRouted,
      workflowHistory: workflowHistory.slice(0, 20),
      totalWaiting,
    };
  } catch {
    return empty;
  }
}
