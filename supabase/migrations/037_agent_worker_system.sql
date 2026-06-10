-- PlantPal Marketing OS — Phase 20: Agent Scheduler + Worker System
-- Safe to re-run. Paste entire file into Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- agent_schedules — per-agent run cadence
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL UNIQUE CHECK (
    agent_id IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy', 'atlas', 'fern', 'echo', 'gate')
  ),
  frequency_type TEXT NOT NULL CHECK (
    frequency_type IN ('interval_hours', 'daily_at', 'on_content')
  ),
  interval_hours INTEGER CHECK (interval_hours IS NULL OR interval_hours >= 1),
  daily_at_hour INTEGER CHECK (daily_at_hour IS NULL OR (daily_at_hour >= 0 AND daily_at_hour <= 23)),
  daily_at_minute INTEGER NOT NULL DEFAULT 0 CHECK (daily_at_minute >= 0 AND daily_at_minute <= 59),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS agent_schedules_updated_at ON public.agent_schedules;
CREATE TRIGGER agent_schedules_updated_at
  BEFORE UPDATE ON public.agent_schedules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- agent_runs — run history
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL CHECK (
    agent_id IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy', 'atlas', 'fern', 'echo', 'gate')
  ),
  schedule_id UUID REFERENCES public.agent_schedules(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (
    status IN ('running', 'success', 'failed', 'skipped')
  ),
  trigger_source TEXT NOT NULL DEFAULT 'scheduled' CHECK (
    trigger_source IN ('scheduled', 'manual', 'cron', 'content_event')
  ),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  items_processed INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  result_summary JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_started ON public.agent_runs(agent_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON public.agent_runs(status, started_at DESC);

-- ---------------------------------------------------------------------------
-- agent_health — live health per agent
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL UNIQUE CHECK (
    agent_id IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy', 'atlas', 'fern', 'echo', 'gate')
  ),
  status TEXT NOT NULL DEFAULT 'sleeping' CHECK (
    status IN ('running', 'sleeping', 'healthy', 'degraded', 'failed')
  ),
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  last_error_message TEXT NOT NULL DEFAULT '',
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  total_runs INTEGER NOT NULL DEFAULT 0,
  total_successes INTEGER NOT NULL DEFAULT 0,
  avg_duration_ms INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS agent_health_updated_at ON public.agent_health;
CREATE TRIGGER agent_health_updated_at
  BEFORE UPDATE ON public.agent_health
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS + policies
-- ---------------------------------------------------------------------------
ALTER TABLE public.agent_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_health ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketing_os_all_agent_schedules" ON public.agent_schedules;
CREATE POLICY "marketing_os_all_agent_schedules" ON public.agent_schedules FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_agent_runs" ON public.agent_runs;
CREATE POLICY "marketing_os_all_agent_runs" ON public.agent_runs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_agent_health" ON public.agent_health;
CREATE POLICY "marketing_os_all_agent_health" ON public.agent_health FOR ALL USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Seed schedules (UTC; adjust daily_at_hour for your timezone in ops UI)
-- ---------------------------------------------------------------------------
INSERT INTO public.agent_schedules (agent_id, frequency_type, interval_hours, daily_at_hour, next_run_at)
VALUES
  ('scout', 'interval_hours', 6, NULL, NOW()),
  ('roots', 'interval_hours', 1, NULL, NOW()),
  ('sentinel', 'interval_hours', 4, NULL, NOW()),
  ('bloom', 'daily_at', NULL, 8, date_trunc('day', NOW() AT TIME ZONE 'UTC') + INTERVAL '8 hours'),
  ('sage', 'on_content', NULL, NULL, NOW()),
  ('oak', 'daily_at', NULL, 8, date_trunc('day', NOW() AT TIME ZONE 'UTC') + INTERVAL '8 hours'),
  ('atlas', 'daily_at', NULL, 8, date_trunc('day', NOW() AT TIME ZONE 'UTC') + INTERVAL '8 hours'),
  ('ivy', 'daily_at', NULL, 8, date_trunc('day', NOW() AT TIME ZONE 'UTC') + INTERVAL '8 hours'),
  ('echo', 'interval_hours', 6, NULL, NOW()),
  ('fern', 'daily_at', NULL, 8, date_trunc('day', NOW() AT TIME ZONE 'UTC') + INTERVAL '8 hours')
ON CONFLICT (agent_id) DO NOTHING;

INSERT INTO public.agent_health (agent_id, status)
SELECT s.agent_id, 'sleeping'
FROM public.agent_schedules s
WHERE NOT EXISTS (SELECT 1 FROM public.agent_health h WHERE h.agent_id = s.agent_id);

NOTIFY pgrst, 'reload schema';
