-- PlantPal Marketing OS — Integrations tables fix
-- Paste entire file into Supabase SQL Editor if migrations 029/030 were not applied.
-- Safe to re-run: uses IF NOT EXISTS throughout.

-- ---------------------------------------------------------------------------
-- integration_logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (
    provider IN ('openai', 'openweather', 'plantnet', 'perenual', 'serpapi', 'x')
  ),
  status TEXT NOT NULL DEFAULT 'success' CHECK (
    status IN ('success', 'error', 'rate_limited', 'connected', 'disconnected', 'degraded')
  ),
  message TEXT NOT NULL DEFAULT '',
  error TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_logs_provider_created
  ON public.integration_logs(provider, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_integration_logs_status_created
  ON public.integration_logs(status, created_at DESC);

DROP TRIGGER IF EXISTS integration_logs_updated_at ON public.integration_logs;
CREATE TRIGGER integration_logs_updated_at
  BEFORE UPDATE ON public.integration_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- integration_status — per-provider connection state
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.integration_status (
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

DROP TRIGGER IF EXISTS integration_status_updated_at ON public.integration_status;
CREATE TRIGGER integration_status_updated_at
  BEFORE UPDATE ON public.integration_status
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- api_rate_limits — persisted rate-limit windows (optional audit)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (
    provider IN ('openai', 'openweather', 'plantnet', 'perenual', 'serpapi', 'x')
  ),
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_count INTEGER NOT NULL DEFAULT 0,
  max_per_minute INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_provider_window
  ON public.api_rate_limits(provider, window_start DESC);

DROP TRIGGER IF EXISTS api_rate_limits_updated_at ON public.api_rate_limits;
CREATE TRIGGER api_rate_limits_updated_at
  BEFORE UPDATE ON public.api_rate_limits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- provider_health_checks — health check history
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.provider_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (
    provider IN ('openai', 'openweather', 'plantnet', 'perenual', 'serpapi', 'x')
  ),
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (
    status IN ('connected', 'disconnected', 'degraded', 'error')
  ),
  message TEXT NOT NULL DEFAULT '',
  duration_ms INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_health_checks_provider_created
  ON public.provider_health_checks(provider, created_at DESC);

DROP TRIGGER IF EXISTS provider_health_checks_updated_at ON public.provider_health_checks;
CREATE TRIGGER provider_health_checks_updated_at
  BEFORE UPDATE ON public.provider_health_checks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- X tables (also required by /x dashboard)
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

DROP TRIGGER IF EXISTS x_posts_updated_at ON public.x_posts;
CREATE TRIGGER x_posts_updated_at
  BEFORE UPDATE ON public.x_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.x_post_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprout_post_id UUID,
  bloom_piece_id UUID,
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

DROP TRIGGER IF EXISTS x_post_queue_updated_at ON public.x_post_queue;
CREATE TRIGGER x_post_queue_updated_at
  BEFORE UPDATE ON public.x_post_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x_account_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x_post_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketing_os_all_integration_logs" ON public.integration_logs;
CREATE POLICY "marketing_os_all_integration_logs" ON public.integration_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_integration_status" ON public.integration_status;
CREATE POLICY "marketing_os_all_integration_status" ON public.integration_status FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_api_rate_limits" ON public.api_rate_limits;
CREATE POLICY "marketing_os_all_api_rate_limits" ON public.api_rate_limits FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_provider_health_checks" ON public.provider_health_checks;
CREATE POLICY "marketing_os_all_provider_health_checks" ON public.provider_health_checks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_x_snapshots" ON public.x_account_snapshots;
CREATE POLICY "marketing_os_all_x_snapshots" ON public.x_account_snapshots FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_x_posts" ON public.x_posts;
CREATE POLICY "marketing_os_all_x_posts" ON public.x_posts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_x_queue" ON public.x_post_queue;
CREATE POLICY "marketing_os_all_x_queue" ON public.x_post_queue FOR ALL USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Seed provider rows
-- ---------------------------------------------------------------------------
INSERT INTO public.integration_status (provider, status, configured, metadata) VALUES
  ('openai', 'disconnected', FALSE, '{"uses":["agent_reasoning","content_generation"]}'),
  ('openweather', 'disconnected', FALSE, '{"uses":["gardening_recommendations","weather_content"]}'),
  ('plantnet', 'disconnected', FALSE, '{"uses":["plant_identification","plant_content"]}'),
  ('perenual', 'disconnected', FALSE, '{"uses":["plant_care","watering","sunlight"]}'),
  ('serpapi', 'disconnected', FALSE, '{"uses":["trend_discovery","creator_discovery"]}'),
  ('x', 'disconnected', FALSE, '{"uses":["metrics","engagement","drafts","queue"]}')
ON CONFLICT (provider) DO NOTHING;

INSERT INTO public.x_account_snapshots (follower_count, following_count, tweet_count, username, display_name)
SELECT 2840, 412, 186, 'PlantPalApp', 'PlantPal'
WHERE NOT EXISTS (SELECT 1 FROM public.x_account_snapshots LIMIT 1);

INSERT INTO public.x_posts (tweet_id, text, author_username, like_count, retweet_count, reply_count, impression_count, posted_at, is_plantpal) VALUES
  ('seed_001', 'Your fiddle leaf fig looking sad? Plant Doctor diagnoses root rot before it''s too late', 'PlantPalApp', 142, 28, 19, 4200, NOW() - INTERVAL '2 days', TRUE),
  ('seed_002', '3 signs you''re overwatering (and how to fix it)', 'PlantPalApp', 89, 15, 12, 3100, NOW() - INTERVAL '4 days', TRUE),
  ('seed_003', 'Plant ID walk: identified 12 plants on my first neighborhood stroll.', 'PlantPalApp', 201, 45, 34, 5800, NOW() - INTERVAL '6 days', TRUE)
ON CONFLICT (tweet_id) DO NOTHING;

INSERT INTO public.x_post_queue (text, status, engagement_score, created_by_agent) VALUES
  ('Spring watering cheat sheet — save this before your weekend plant haul', 'draft', 0, 'bloom'),
  ('New in Plant Doctor: faster diagnosis for yellow leaves.', 'gate_approval', 72, 'bloom'),
  ('Community tip: group your succulents by light needs.', 'queued', 65, 'bloom');
