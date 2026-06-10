-- PlantPal Marketing OS — Phase 5: Content Agent System
-- Run AFTER 003_creative_content_engine.sql

CREATE TABLE IF NOT EXISTS public.agent_daily_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  discovery_summary TEXT NOT NULL DEFAULT '',
  content_count INTEGER NOT NULL DEFAULT 0,
  approved_count INTEGER NOT NULL DEFAULT 0,
  rejected_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.discovery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID NOT NULL REFERENCES public.agent_daily_briefs(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('trending_topic', 'question', 'content_opportunity')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  relevance_score INTEGER NOT NULL DEFAULT 50 CHECK (relevance_score >= 1 AND relevance_score <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pipeline_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID NOT NULL REFERENCES public.agent_daily_briefs(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  format TEXT NOT NULL,
  hook TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  cta TEXT NOT NULL DEFAULT '',
  viral_score INTEGER NOT NULL DEFAULT 50 CHECK (viral_score >= 1 AND viral_score <= 100),
  originality_score INTEGER NOT NULL DEFAULT 0,
  humor_score INTEGER NOT NULL DEFAULT 0,
  emotional_impact_score INTEGER NOT NULL DEFAULT 0,
  shareability_score INTEGER NOT NULL DEFAULT 0,
  educational_score INTEGER NOT NULL DEFAULT 0,
  aggregate_score INTEGER NOT NULL DEFAULT 0,
  director_notes TEXT NOT NULL DEFAULT '',
  rewrite_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected', 'needs_rewrite')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discovery_brief ON public.discovery_items(brief_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_brief ON public.pipeline_content(brief_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_status ON public.pipeline_content(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_aggregate ON public.pipeline_content(aggregate_score DESC);
CREATE INDEX IF NOT EXISTS idx_briefs_date ON public.agent_daily_briefs(run_date DESC);

CREATE TRIGGER agent_daily_briefs_updated_at
  BEFORE UPDATE ON public.agent_daily_briefs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER pipeline_content_updated_at
  BEFORE UPDATE ON public.pipeline_content
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.agent_daily_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketing_os_all_agent_briefs" ON public.agent_daily_briefs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_discovery_items" ON public.discovery_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_pipeline_content" ON public.pipeline_content FOR ALL USING (true) WITH CHECK (true);
