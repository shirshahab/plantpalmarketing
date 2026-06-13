-- ============================================================================
-- Phase 42 — intelligence_alerts (primary F5Bot store)
-- Safe to re-run.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.intelligence_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT '',
  subreddit TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  classification TEXT NOT NULL DEFAULT 'community_opportunity',
  priority TEXT NOT NULL DEFAULT 'medium',
  assigned_agent TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  external_id TEXT NOT NULL DEFAULT '',
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_intelligence_alerts_url
  ON public.intelligence_alerts(url)
  WHERE url <> '';

CREATE INDEX IF NOT EXISTS idx_intelligence_alerts_classification
  ON public.intelligence_alerts(classification, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_intelligence_alerts_priority
  ON public.intelligence_alerts(priority, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_intelligence_alerts_status
  ON public.intelligence_alerts(status, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_intelligence_alerts_assigned_agent
  ON public.intelligence_alerts(assigned_agent, status);

ALTER TABLE public.intelligence_alerts DROP CONSTRAINT IF EXISTS intelligence_alerts_classification_check;
ALTER TABLE public.intelligence_alerts
  ADD CONSTRAINT intelligence_alerts_classification_check
  CHECK (classification IN (
    'community_opportunity',
    'content_idea',
    'seo_topic',
    'competitor_alert',
    'creator_opportunity',
    'product_feedback',
    'ignore'
  ));

ALTER TABLE public.intelligence_alerts DROP CONSTRAINT IF EXISTS intelligence_alerts_priority_check;
ALTER TABLE public.intelligence_alerts
  ADD CONSTRAINT intelligence_alerts_priority_check
  CHECK (priority IN ('low', 'medium', 'high'));

ALTER TABLE public.intelligence_alerts DROP CONSTRAINT IF EXISTS intelligence_alerts_status_check;
ALTER TABLE public.intelligence_alerts
  ADD CONSTRAINT intelligence_alerts_status_check
  CHECK (status IN ('new', 'processed', 'ignored', 'routed'));

DROP TRIGGER IF EXISTS intelligence_alerts_updated_at ON public.intelligence_alerts;
CREATE TRIGGER intelligence_alerts_updated_at
  BEFORE UPDATE ON public.intelligence_alerts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.intelligence_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_intelligence_alerts" ON public.intelligence_alerts;
CREATE POLICY "marketing_os_all_intelligence_alerts" ON public.intelligence_alerts
  FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
