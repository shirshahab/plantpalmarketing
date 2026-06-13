-- ============================================================================
-- Phase 2 — F5Bot ingest schema (intelligence_alerts)
-- Safe to re-run. Extends 061 or creates fresh table.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.intelligence_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT '',
  source_type TEXT NOT NULL DEFAULT 'f5bot',
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT '',
  subreddit TEXT NOT NULL DEFAULT '',
  alert_name TEXT NOT NULL DEFAULT '',
  detected_keywords TEXT[] NOT NULL DEFAULT '{}',
  classification TEXT,
  priority TEXT,
  assigned_agent TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  raw JSONB NOT NULL DEFAULT '{}'::jsonb,
  external_created_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Legacy columns from 061 (keep for backward compatibility)
ALTER TABLE public.intelligence_alerts ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'f5bot';
ALTER TABLE public.intelligence_alerts ADD COLUMN IF NOT EXISTS alert_name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.intelligence_alerts ADD COLUMN IF NOT EXISTS detected_keywords TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.intelligence_alerts ADD COLUMN IF NOT EXISTS raw JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.intelligence_alerts ADD COLUMN IF NOT EXISTS external_created_at TIMESTAMPTZ;
ALTER TABLE public.intelligence_alerts ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
ALTER TABLE public.intelligence_alerts ADD COLUMN IF NOT EXISTS external_id TEXT NOT NULL DEFAULT '';
ALTER TABLE public.intelligence_alerts ADD COLUMN IF NOT EXISTS raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.intelligence_alerts ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Allow nullable classification/priority/agent for pre-classified rows
ALTER TABLE public.intelligence_alerts ALTER COLUMN classification DROP NOT NULL;
ALTER TABLE public.intelligence_alerts ALTER COLUMN priority DROP NOT NULL;
ALTER TABLE public.intelligence_alerts ALTER COLUMN assigned_agent DROP NOT NULL;

-- Backfill raw from legacy raw_payload
UPDATE public.intelligence_alerts
SET raw = raw_payload
WHERE (raw IS NULL OR raw = '{}'::jsonb)
  AND raw_payload IS NOT NULL
  AND raw_payload <> '{}'::jsonb;

UPDATE public.intelligence_alerts
SET external_created_at = created_at
WHERE external_created_at IS NULL AND created_at IS NOT NULL;

DROP INDEX IF EXISTS idx_intelligence_alerts_url;
CREATE UNIQUE INDEX IF NOT EXISTS idx_intelligence_alerts_url_unique
  ON public.intelligence_alerts(url)
  WHERE url <> '';

CREATE INDEX IF NOT EXISTS idx_intelligence_alerts_classification
  ON public.intelligence_alerts(classification);

CREATE INDEX IF NOT EXISTS idx_intelligence_alerts_priority
  ON public.intelligence_alerts(priority);

CREATE INDEX IF NOT EXISTS idx_intelligence_alerts_assigned_agent
  ON public.intelligence_alerts(assigned_agent);

CREATE INDEX IF NOT EXISTS idx_intelligence_alerts_status
  ON public.intelligence_alerts(status);

CREATE INDEX IF NOT EXISTS idx_intelligence_alerts_external_created_at
  ON public.intelligence_alerts(external_created_at DESC);

CREATE INDEX IF NOT EXISTS idx_intelligence_alerts_created_at
  ON public.intelligence_alerts(created_at DESC);

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
