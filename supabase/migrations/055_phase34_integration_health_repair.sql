-- ============================================================================
-- Phase 34 — Integration health repair + real video generation columns
-- Safe to re-run: CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS only.
-- Repairs: integration_logs, integration_status, provider_health_checks,
--          api_rate_limits, integration_events, api_usage_logs
-- Adds:    generated_videos provider/job columns + widened status check,
--          public storage buckets for generated images/videos.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 1. integration_logs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'success',
  message TEXT NOT NULL DEFAULT '',
  error TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.integration_logs ADD COLUMN IF NOT EXISTS error TEXT;
ALTER TABLE public.integration_logs ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE public.integration_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_integration_logs_provider_created
  ON public.integration_logs(provider, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_integration_logs_status_created
  ON public.integration_logs(status, created_at DESC);

DROP TRIGGER IF EXISTS integration_logs_updated_at ON public.integration_logs;
CREATE TRIGGER integration_logs_updated_at
  BEFORE UPDATE ON public.integration_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 2. integration_status — per-provider connection state
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.integration_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'disconnected',
  configured BOOLEAN NOT NULL DEFAULT FALSE,
  last_success_at TIMESTAMPTZ,
  last_error_at TIMESTAMPTZ,
  last_error_message TEXT NOT NULL DEFAULT '',
  last_health_check_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.integration_status ADD COLUMN IF NOT EXISTS configured BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.integration_status ADD COLUMN IF NOT EXISTS last_success_at TIMESTAMPTZ;
ALTER TABLE public.integration_status ADD COLUMN IF NOT EXISTS last_error_at TIMESTAMPTZ;
ALTER TABLE public.integration_status ADD COLUMN IF NOT EXISTS last_error_message TEXT NOT NULL DEFAULT '';
ALTER TABLE public.integration_status ADD COLUMN IF NOT EXISTS last_health_check_at TIMESTAMPTZ;
ALTER TABLE public.integration_status ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';
ALTER TABLE public.integration_status ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Clear stale "Run migration 031" style errors left over from before the repair
UPDATE public.integration_status
SET last_error_message = ''
WHERE last_error_message ILIKE '%migration%';

DROP TRIGGER IF EXISTS integration_status_updated_at ON public.integration_status;
CREATE TRIGGER integration_status_updated_at
  BEFORE UPDATE ON public.integration_status
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. api_rate_limits
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
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

-- ----------------------------------------------------------------------------
-- 4. provider_health_checks — health check history
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.provider_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disconnected',
  message TEXT NOT NULL DEFAULT '',
  duration_ms INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.provider_health_checks ADD COLUMN IF NOT EXISTS duration_ms INTEGER;
ALTER TABLE public.provider_health_checks ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE public.provider_health_checks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_provider_health_checks_provider_created
  ON public.provider_health_checks(provider, created_at DESC);

DROP TRIGGER IF EXISTS provider_health_checks_updated_at ON public.provider_health_checks;
CREATE TRIGGER provider_health_checks_updated_at
  BEFORE UPDATE ON public.provider_health_checks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. integration_events — notable provider events (connect, key change, outage)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.integration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL DEFAULT '',
  detail TEXT NOT NULL DEFAULT '',
  severity TEXT NOT NULL DEFAULT 'info',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_events_provider_created
  ON public.integration_events(provider, created_at DESC);

-- ----------------------------------------------------------------------------
-- 6. api_usage_logs — per-call usage/cost audit
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'success',
  tokens_input INTEGER NOT NULL DEFAULT 0,
  tokens_output INTEGER NOT NULL DEFAULT 0,
  units INTEGER NOT NULL DEFAULT 1,
  duration_ms INTEGER,
  estimated_cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0,
  agent_id TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_provider_created
  ON public.api_usage_logs(provider, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_agent_created
  ON public.api_usage_logs(agent_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 7. generated_videos — real video generation columns + statuses
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.generated_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID,
  calendar_item_id UUID,
  platform TEXT NOT NULL DEFAULT 'tiktok',
  video_url TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT NOT NULL DEFAULT '',
  script TEXT NOT NULL DEFAULT '',
  hook TEXT NOT NULL DEFAULT '',
  scenes JSONB NOT NULL DEFAULT '[]',
  voiceover TEXT NOT NULL DEFAULT '',
  on_screen_text JSONB NOT NULL DEFAULT '[]',
  caption TEXT NOT NULL DEFAULT '',
  cta TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'script_draft',
  review_feedback TEXT NOT NULL DEFAULT '',
  revision_notes TEXT NOT NULL DEFAULT '',
  generation_provider TEXT NOT NULL DEFAULT 'none',
  generation_model TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.generated_videos ADD COLUMN IF NOT EXISTS job_id TEXT NOT NULL DEFAULT '';
ALTER TABLE public.generated_videos ADD COLUMN IF NOT EXISTS error_message TEXT NOT NULL DEFAULT '';
ALTER TABLE public.generated_videos ADD COLUMN IF NOT EXISTS generation_provider TEXT NOT NULL DEFAULT 'none';
ALTER TABLE public.generated_videos ADD COLUMN IF NOT EXISTS generation_model TEXT NOT NULL DEFAULT '';

ALTER TABLE public.generated_videos DROP CONSTRAINT IF EXISTS generated_videos_status_check;
ALTER TABLE public.generated_videos
  ADD CONSTRAINT generated_videos_status_check
  CHECK (status IN (
    'script_draft', 'script_approved',
    'package_ready', 'provider_not_configured',
    'pending_generation', 'generating', 'generated', 'failed',
    'approved', 'rejected', 'needs_revision',
    'attached_to_calendar', 'scheduled', 'published'
  ));

CREATE INDEX IF NOT EXISTS idx_generated_videos_job ON public.generated_videos(job_id);

-- ----------------------------------------------------------------------------
-- 8. RLS + permissive policies
-- ----------------------------------------------------------------------------
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketing_os_all_integration_logs" ON public.integration_logs;
CREATE POLICY "marketing_os_all_integration_logs" ON public.integration_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_integration_status" ON public.integration_status;
CREATE POLICY "marketing_os_all_integration_status" ON public.integration_status FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_api_rate_limits" ON public.api_rate_limits;
CREATE POLICY "marketing_os_all_api_rate_limits" ON public.api_rate_limits FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_provider_health_checks" ON public.provider_health_checks;
CREATE POLICY "marketing_os_all_provider_health_checks" ON public.provider_health_checks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_integration_events" ON public.integration_events;
CREATE POLICY "marketing_os_all_integration_events" ON public.integration_events FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_api_usage_logs" ON public.api_usage_logs;
CREATE POLICY "marketing_os_all_api_usage_logs" ON public.api_usage_logs FOR ALL USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 9. Seed provider rows (no-op if already present)
-- ----------------------------------------------------------------------------
INSERT INTO public.integration_status (provider, status, configured, metadata) VALUES
  ('openai', 'disconnected', FALSE, '{"uses":["agent_reasoning","content_generation","image_generation","video_generation"]}'),
  ('openweather', 'disconnected', FALSE, '{"uses":["gardening_recommendations","weather_content"]}'),
  ('plantnet', 'disconnected', FALSE, '{"uses":["plant_identification","plant_content"]}'),
  ('perenual', 'disconnected', FALSE, '{"uses":["plant_care","watering","sunlight"]}'),
  ('serpapi', 'disconnected', FALSE, '{"uses":["trend_discovery","creator_discovery"]}'),
  ('x', 'disconnected', FALSE, '{"uses":["metrics","engagement","drafts","queue"]}')
ON CONFLICT (provider) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 10. Storage buckets for generated media (gpt-image-1 returns base64 —
--     we upload to storage and save the public URL). Wrapped so the migration
--     still succeeds if storage permissions differ.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('generated-assets', 'generated-assets', true)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO storage.buckets (id, name, public)
  VALUES ('generated-videos', 'generated-videos', true)
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not create storage buckets: %', SQLERRM;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "marketing_os_generated_media_read" ON storage.objects;
  CREATE POLICY "marketing_os_generated_media_read" ON storage.objects
    FOR SELECT USING (bucket_id IN ('generated-assets', 'generated-videos'));

  DROP POLICY IF EXISTS "marketing_os_generated_media_write" ON storage.objects;
  CREATE POLICY "marketing_os_generated_media_write" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id IN ('generated-assets', 'generated-videos'));

  DROP POLICY IF EXISTS "marketing_os_generated_media_update" ON storage.objects;
  CREATE POLICY "marketing_os_generated_media_update" ON storage.objects
    FOR UPDATE USING (bucket_id IN ('generated-assets', 'generated-videos'));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not create storage policies: %', SQLERRM;
END $$;

-- ----------------------------------------------------------------------------
-- Reload PostgREST schema cache
-- ----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
