-- PlantPal Marketing OS — Phase 9: Sage Creative Director Agent
-- Run AFTER 010_bloom_seed.sql

ALTER TABLE public.agent_activity_log
  DROP CONSTRAINT IF EXISTS agent_activity_log_agent_id_check;

ALTER TABLE public.agent_activity_log
  ADD CONSTRAINT agent_activity_log_agent_id_check
  CHECK (agent_id IN ('scout', 'roots', 'sentinel', 'bloom', 'sage'));

-- Extend bloom piece statuses for Sage review gate
ALTER TABLE public.bloom_content_pieces
  DROP CONSTRAINT IF EXISTS bloom_content_pieces_status_check;

ALTER TABLE public.bloom_content_pieces
  ADD CONSTRAINT bloom_content_pieces_status_check
  CHECK (status IN (
    'awaiting_review', 'pending', 'approved', 'rejected', 'draft', 'published'
  ));

-- ---------------------------------------------------------------------------
-- sage_review_batches — Creative Director review runs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sage_review_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  pieces_reviewed INTEGER NOT NULL DEFAULT 0,
  approved_count INTEGER NOT NULL DEFAULT 0,
  rejected_count INTEGER NOT NULL DEFAULT 0,
  avg_aggregate_score NUMERIC(5,1) NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- sage_content_reviews — per-piece Creative Director evaluation
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sage_content_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.sage_review_batches(id) ON DELETE SET NULL,
  bloom_piece_id UUID NOT NULL REFERENCES public.bloom_content_pieces(id) ON DELETE CASCADE,
  originality_score INTEGER NOT NULL DEFAULT 50 CHECK (originality_score >= 1 AND originality_score <= 100),
  humor_score INTEGER NOT NULL DEFAULT 50 CHECK (humor_score >= 1 AND humor_score <= 100),
  emotional_impact_score INTEGER NOT NULL DEFAULT 50 CHECK (emotional_impact_score >= 1 AND emotional_impact_score <= 100),
  shareability_score INTEGER NOT NULL DEFAULT 50 CHECK (shareability_score >= 1 AND shareability_score <= 100),
  storytelling_score INTEGER NOT NULL DEFAULT 50 CHECK (storytelling_score >= 1 AND storytelling_score <= 100),
  educational_score INTEGER NOT NULL DEFAULT 50 CHECK (educational_score >= 1 AND educational_score <= 100),
  aggregate_score INTEGER NOT NULL DEFAULT 50 CHECK (aggregate_score >= 1 AND aggregate_score <= 100),
  recommendation TEXT NOT NULL DEFAULT 'reject' CHECK (recommendation IN ('approve', 'reject')),
  rejection_reason TEXT NOT NULL DEFAULT '',
  hook_suggestion TEXT NOT NULL DEFAULT '',
  cta_suggestion TEXT NOT NULL DEFAULT '',
  storytelling_suggestion TEXT NOT NULL DEFAULT '',
  creative_opportunity TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (bloom_piece_id)
);

CREATE INDEX IF NOT EXISTS idx_sage_batches_date ON public.sage_review_batches(run_date DESC);
CREATE INDEX IF NOT EXISTS idx_sage_reviews_batch ON public.sage_content_reviews(batch_id);
CREATE INDEX IF NOT EXISTS idx_sage_reviews_piece ON public.sage_content_reviews(bloom_piece_id);
CREATE INDEX IF NOT EXISTS idx_sage_reviews_aggregate ON public.sage_content_reviews(aggregate_score DESC);
CREATE INDEX IF NOT EXISTS idx_sage_reviews_recommendation ON public.sage_content_reviews(recommendation);

CREATE TRIGGER sage_review_batches_updated_at
  BEFORE UPDATE ON public.sage_review_batches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER sage_content_reviews_updated_at
  BEFORE UPDATE ON public.sage_content_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.sage_review_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sage_content_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketing_os_all_sage_batches" ON public.sage_review_batches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_sage_reviews" ON public.sage_content_reviews FOR ALL USING (true) WITH CHECK (true);
