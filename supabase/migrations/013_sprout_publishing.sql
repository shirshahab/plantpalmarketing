-- PlantPal Marketing OS — Phase 10: Sprout Publishing Agent
-- Run AFTER 012_sage_seed.sql

ALTER TABLE public.agent_activity_log
  DROP CONSTRAINT IF EXISTS agent_activity_log_agent_id_check;

ALTER TABLE public.agent_activity_log
  ADD CONSTRAINT agent_activity_log_agent_id_check
  CHECK (agent_id IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout'));

-- ---------------------------------------------------------------------------
-- sprout_scheduled_posts — publishing schedule (no auto-publish)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sprout_scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bloom_piece_id UUID REFERENCES public.bloom_content_pieces(id) ON DELETE SET NULL,
  approval_queue_id UUID REFERENCES public.approval_queue(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (
    platform IN ('Instagram', 'TikTok', 'X', 'Threads', 'Pinterest', 'YouTube')
  ),
  title TEXT NOT NULL DEFAULT '',
  hook TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  cta TEXT NOT NULL DEFAULT '',
  scheduled_at TIMESTAMPTZ,
  recommended_time_label TEXT NOT NULL DEFAULT '',
  best_time_score INTEGER NOT NULL DEFAULT 50 CHECK (best_time_score >= 1 AND best_time_score <= 100),
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (
    status IN ('waiting', 'scheduling', 'ready', 'published')
  ),
  schedule_approved BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sprout_posts_platform ON public.sprout_scheduled_posts(platform);
CREATE INDEX IF NOT EXISTS idx_sprout_posts_status ON public.sprout_scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_sprout_posts_scheduled ON public.sprout_scheduled_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_sprout_posts_bloom ON public.sprout_scheduled_posts(bloom_piece_id);

CREATE TRIGGER sprout_scheduled_posts_updated_at
  BEFORE UPDATE ON public.sprout_scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.sprout_scheduled_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marketing_os_all_sprout_posts" ON public.sprout_scheduled_posts FOR ALL USING (true) WITH CHECK (true);
