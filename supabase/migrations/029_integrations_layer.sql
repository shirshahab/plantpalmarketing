-- PlantPal Marketing OS — Phase 18: Integrations Layer
-- Run AFTER 028_agent_ai_workers_seed.sql

-- ---------------------------------------------------------------------------
-- integration_provider_status — health + connection state per provider
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.integration_provider_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE CHECK (
    provider IN ('openai', 'openweather', 'plantnet', 'perenual', 'serpapi', 'x')
  ),
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (
    status IN ('connected', 'disconnected', 'degraded', 'error')
  ),
  configured BOOLEAN NOT NULL DEFAULT FALSE,
  last_success_at TIMESTAMPTZ,
  last_error_at TIMESTAMPTZ,
  last_error_message TEXT NOT NULL DEFAULT '',
  last_health_check_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER integration_provider_status_updated_at
  BEFORE UPDATE ON public.integration_provider_status
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- integration_logs — provider call audit trail
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (
    provider IN ('openai', 'openweather', 'plantnet', 'perenual', 'serpapi', 'x')
  ),
  action TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'error', 'rate_limited')),
  request_summary TEXT NOT NULL DEFAULT '',
  response_summary TEXT NOT NULL DEFAULT '',
  error_message TEXT NOT NULL DEFAULT '',
  duration_ms INTEGER,
  agent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_logs_provider ON public.integration_logs(provider, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_integration_logs_status ON public.integration_logs(status, created_at DESC);

-- ---------------------------------------------------------------------------
-- x_account_snapshots — cached account metrics
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.x_account_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_count INTEGER NOT NULL DEFAULT 0,
  following_count INTEGER NOT NULL DEFAULT 0,
  tweet_count INTEGER NOT NULL DEFAULT 0,
  listed_count INTEGER NOT NULL DEFAULT 0,
  username TEXT NOT NULL DEFAULT '',
  display_name TEXT NOT NULL DEFAULT '',
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- x_posts — cached tweets + engagement
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.x_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tweet_id TEXT NOT NULL UNIQUE,
  text TEXT NOT NULL DEFAULT '',
  author_username TEXT NOT NULL DEFAULT '',
  like_count INTEGER NOT NULL DEFAULT 0,
  retweet_count INTEGER NOT NULL DEFAULT 0,
  reply_count INTEGER NOT NULL DEFAULT 0,
  impression_count INTEGER NOT NULL DEFAULT 0,
  posted_at TIMESTAMPTZ,
  is_plantpal BOOLEAN NOT NULL DEFAULT TRUE,
  source TEXT NOT NULL DEFAULT 'api' CHECK (source IN ('api', 'manual', 'import')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_x_posts_posted ON public.x_posts(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_x_posts_engagement ON public.x_posts(like_count DESC);

CREATE TRIGGER x_posts_updated_at
  BEFORE UPDATE ON public.x_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- x_post_queue — draft → approval → publish pipeline
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.x_post_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprout_post_id UUID REFERENCES public.sprout_scheduled_posts(id) ON DELETE SET NULL,
  bloom_piece_id UUID REFERENCES public.bloom_content_pieces(id) ON DELETE SET NULL,
  text TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'sage_review', 'gate_approval', 'queued', 'published', 'failed', 'rejected')
  ),
  engagement_score INTEGER NOT NULL DEFAULT 0,
  gate_approved BOOLEAN NOT NULL DEFAULT FALSE,
  sage_approved BOOLEAN NOT NULL DEFAULT FALSE,
  published_tweet_id TEXT,
  error_message TEXT NOT NULL DEFAULT '',
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_by_agent TEXT NOT NULL DEFAULT 'bloom',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_x_post_queue_status ON public.x_post_queue(status, created_at DESC);

CREATE TRIGGER x_post_queue_updated_at
  BEFORE UPDATE ON public.x_post_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.integration_provider_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x_account_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x_post_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketing_os_all_integration_status" ON public.integration_provider_status FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_integration_logs" ON public.integration_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_x_snapshots" ON public.x_account_snapshots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_x_posts" ON public.x_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_x_queue" ON public.x_post_queue FOR ALL USING (true) WITH CHECK (true);
