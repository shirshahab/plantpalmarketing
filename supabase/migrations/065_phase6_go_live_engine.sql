-- Phase 6 — Go-live daily engine: social posts, meme ideas, approval hub, relevance scoring

CREATE TABLE IF NOT EXISTS public.social_content_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL DEFAULT 'instagram',
  format TEXT NOT NULL DEFAULT 'post',
  title TEXT NOT NULL DEFAULT '',
  copy TEXT NOT NULL DEFAULT '',
  hook TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  source_trace JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending_review',
  assigned_agent TEXT NOT NULL DEFAULT 'bloom',
  brand_score INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.meme_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  visual_prompt TEXT NOT NULL DEFAULT '',
  platform TEXT NOT NULL DEFAULT 'instagram',
  source_trace JSONB NOT NULL DEFAULT '{}'::jsonb,
  risk_level TEXT NOT NULL DEFAULT 'low',
  status TEXT NOT NULL DEFAULT 'pending_review',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.intelligence_alerts ADD COLUMN IF NOT EXISTS relevance_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.intelligence_alerts ADD COLUMN IF NOT EXISTS relevance_category TEXT NOT NULL DEFAULT '';
ALTER TABLE public.intelligence_alerts ADD COLUMN IF NOT EXISTS relevance_reason TEXT NOT NULL DEFAULT '';

ALTER TABLE public.seo_blog_posts ADD COLUMN IF NOT EXISTS source_trace JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.seo_blog_posts ADD COLUMN IF NOT EXISTS body TEXT NOT NULL DEFAULT '';

ALTER TABLE public.approval_queue ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
ALTER TABLE public.approval_queue ADD COLUMN IF NOT EXISTS summary TEXT NOT NULL DEFAULT '';
ALTER TABLE public.approval_queue ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.approval_queue ADD COLUMN IF NOT EXISTS source_trace JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.approval_queue ADD COLUMN IF NOT EXISTS assigned_agent TEXT NOT NULL DEFAULT '';
ALTER TABLE public.approval_queue ADD COLUMN IF NOT EXISTS destination TEXT NOT NULL DEFAULT '';

ALTER TABLE public.automation_runs ADD COLUMN IF NOT EXISTS run_type TEXT NOT NULL DEFAULT '';
ALTER TABLE public.automation_runs ADD COLUMN IF NOT EXISTS summary JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.automation_runs ADD COLUMN IF NOT EXISTS errors JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_social_content_posts_status ON public.social_content_posts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meme_ideas_status ON public.meme_ideas(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_alerts_relevance ON public.intelligence_alerts(relevance_score DESC, status);

ALTER TABLE public.social_content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meme_ideas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketing_os_all_social_content_posts" ON public.social_content_posts;
CREATE POLICY "marketing_os_all_social_content_posts" ON public.social_content_posts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_meme_ideas" ON public.meme_ideas;
CREATE POLICY "marketing_os_all_meme_ideas" ON public.meme_ideas FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
