-- Phase 5 — HQ pipeline repair: rejected alerts, content pipeline, video queue, seo drafts view

CREATE TABLE IF NOT EXISTS public.intelligence_rejected (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'f5bot',
  source_type TEXT NOT NULL DEFAULT 'f5bot',
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT '',
  subreddit TEXT NOT NULL DEFAULT '',
  alert_name TEXT NOT NULL DEFAULT '',
  detected_keywords TEXT[] NOT NULL DEFAULT '{}',
  reject_reason TEXT NOT NULL DEFAULT '',
  reject_category TEXT NOT NULL DEFAULT 'off_topic',
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  external_id TEXT NOT NULL DEFAULT '',
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_rejected_received
  ON public.intelligence_rejected(received_at DESC);

CREATE TABLE IF NOT EXISTS public.content_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table TEXT NOT NULL DEFAULT 'creative_content_ideas',
  source_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'approved',
  destination TEXT NOT NULL DEFAULT 'bloom',
  workflow_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_pipeline_destination_status
  ON public.content_pipeline(destination, status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_content_pipeline_source
  ON public.content_pipeline(source_table, source_id);

CREATE TABLE IF NOT EXISTS public.video_generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table TEXT NOT NULL DEFAULT '',
  source_id UUID,
  title TEXT NOT NULL DEFAULT '',
  concept TEXT NOT NULL DEFAULT '',
  hook TEXT NOT NULL DEFAULT '',
  platform TEXT NOT NULL DEFAULT 'tiktok',
  status TEXT NOT NULL DEFAULT 'pending',
  priority INTEGER NOT NULL DEFAULT 50,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_generation_queue_status
  ON public.video_generation_queue(status, priority DESC, created_at DESC);

CREATE OR REPLACE VIEW public.seo_drafts AS
SELECT
  id,
  keyword_id,
  keyword,
  headline AS title,
  keyword AS target_keyword,
  status,
  word_count,
  voice_check_passed,
  metadata,
  created_at,
  updated_at
FROM public.seo_blog_posts
WHERE status IN ('draft', 'gate_review', 'voice_check_failed', 'pending_review');

ALTER TABLE public.intelligence_rejected ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_generation_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketing_os_all_intelligence_rejected" ON public.intelligence_rejected;
CREATE POLICY "marketing_os_all_intelligence_rejected" ON public.intelligence_rejected
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_content_pipeline" ON public.content_pipeline;
CREATE POLICY "marketing_os_all_content_pipeline" ON public.content_pipeline
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_video_generation_queue" ON public.video_generation_queue;
CREATE POLICY "marketing_os_all_video_generation_queue"
  FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
