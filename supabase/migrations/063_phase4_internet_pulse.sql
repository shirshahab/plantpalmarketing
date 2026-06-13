-- ============================================================================
-- Phase 4 — Internet Pulse: run history + alert metadata
-- Safe to re-run.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.intelligence_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  fetched_count INTEGER NOT NULL DEFAULT 0,
  inserted_count INTEGER NOT NULL DEFAULT 0,
  duplicate_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running',
  error_message TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_runs_started_at
  ON public.intelligence_runs(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_intelligence_runs_status
  ON public.intelligence_runs(status, started_at DESC);

ALTER TABLE public.intelligence_runs DROP CONSTRAINT IF EXISTS intelligence_runs_status_check;
ALTER TABLE public.intelligence_runs
  ADD CONSTRAINT intelligence_runs_status_check
  CHECK (status IN ('running', 'success', 'partial', 'failed'));

ALTER TABLE public.intelligence_alerts ADD COLUMN IF NOT EXISTS classification_reason TEXT NOT NULL DEFAULT '';

ALTER TABLE public.daily_reports ADD COLUMN IF NOT EXISTS intelligence_brief JSONB;

ALTER TABLE public.intelligence_alerts DROP CONSTRAINT IF EXISTS intelligence_alerts_status_check;
ALTER TABLE public.intelligence_alerts
  ADD CONSTRAINT intelligence_alerts_status_check
  CHECK (status IN ('new', 'processed', 'ignored', 'routed', 'archived'));

ALTER TABLE public.intelligence_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_intelligence_runs" ON public.intelligence_runs;
CREATE POLICY "marketing_os_all_intelligence_runs" ON public.intelligence_runs
  FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
