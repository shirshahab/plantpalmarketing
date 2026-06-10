-- PlantPal Marketing OS — Phase 8: Bloom Content Production Agent
-- Run AFTER 008_sentinel_seed.sql

ALTER TABLE public.agent_activity_log
  DROP CONSTRAINT IF EXISTS agent_activity_log_agent_id_check;

ALTER TABLE public.agent_activity_log
  ADD CONSTRAINT agent_activity_log_agent_id_check
  CHECK (agent_id IN ('scout', 'roots', 'sentinel', 'bloom'));

-- ---------------------------------------------------------------------------
-- bloom_production_runs — daily content generation batches
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bloom_production_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  pieces_generated INTEGER NOT NULL DEFAULT 0,
  pieces_queued INTEGER NOT NULL DEFAULT 0,
  scout_inputs INTEGER NOT NULL DEFAULT 0,
  roots_inputs INTEGER NOT NULL DEFAULT 0,
  sentinel_inputs INTEGER NOT NULL DEFAULT 0,
  seasonal_inputs INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- bloom_content_pieces — all daily content outputs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bloom_content_pieces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES public.bloom_production_runs(id) ON DELETE SET NULL,
  format TEXT NOT NULL CHECK (
    format IN (
      'x_post', 'threads_post', 'tiktok_concept', 'reels_concept',
      'shorts_concept', 'carousel', 'blog_idea', 'email_idea'
    )
  ),
  platform TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  hook TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  cta TEXT NOT NULL DEFAULT '',
  viral_score INTEGER NOT NULL DEFAULT 50 CHECK (viral_score >= 1 AND viral_score <= 100),
  emotional_trigger TEXT NOT NULL DEFAULT '',
  difficulty_score INTEGER NOT NULL DEFAULT 50 CHECK (difficulty_score >= 1 AND difficulty_score <= 100),
  source_type TEXT NOT NULL DEFAULT 'seasonal_event' CHECK (
    source_type IN ('scout_discovery', 'roots_conversation', 'sentinel_alert', 'seasonal_event')
  ),
  source_detail TEXT NOT NULL DEFAULT '',
  scheduled_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected', 'draft', 'published')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- bloom_content_performance — post-publish metrics
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bloom_content_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_piece_id UUID NOT NULL REFERENCES public.bloom_content_pieces(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT '',
  impressions INTEGER NOT NULL DEFAULT 0,
  engagements INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  tracked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bloom_runs_date ON public.bloom_production_runs(run_date DESC);
CREATE INDEX IF NOT EXISTS idx_bloom_pieces_run ON public.bloom_content_pieces(run_id);
CREATE INDEX IF NOT EXISTS idx_bloom_pieces_format ON public.bloom_content_pieces(format);
CREATE INDEX IF NOT EXISTS idx_bloom_pieces_status ON public.bloom_content_pieces(status);
CREATE INDEX IF NOT EXISTS idx_bloom_pieces_scheduled ON public.bloom_content_pieces(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_bloom_pieces_viral ON public.bloom_content_pieces(viral_score DESC);
CREATE INDEX IF NOT EXISTS idx_bloom_perf_piece ON public.bloom_content_performance(content_piece_id);
CREATE INDEX IF NOT EXISTS idx_bloom_perf_tracked ON public.bloom_content_performance(tracked_at DESC);

CREATE TRIGGER bloom_production_runs_updated_at
  BEFORE UPDATE ON public.bloom_production_runs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER bloom_content_pieces_updated_at
  BEFORE UPDATE ON public.bloom_content_pieces
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.bloom_production_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bloom_content_pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bloom_content_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketing_os_all_bloom_runs" ON public.bloom_production_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_bloom_pieces" ON public.bloom_content_pieces FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_bloom_perf" ON public.bloom_content_performance FOR ALL USING (true) WITH CHECK (true);
