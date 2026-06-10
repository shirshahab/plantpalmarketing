-- PlantPal Marketing OS — Phase 24: Autonomous agent scheduling
-- Safe to re-run. Paste entire file into Supabase SQL Editor.

-- ---------------------------------------------------------------------------
-- Extended health metrics for scheduler dashboard
-- ---------------------------------------------------------------------------
ALTER TABLE public.agent_health
  ADD COLUMN IF NOT EXISTS total_failures INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.agent_health
  ADD COLUMN IF NOT EXISTS total_items_created INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.agent_health
  ADD COLUMN IF NOT EXISTS last_items_created INTEGER NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------------------
-- Phase 24 schedules (UTC)
-- Scout 6h · Roots 1h · Sentinel 4h · Bloom morning · Sage on_content
-- Ivy daily · Atlas daily · Echo 6h
-- ---------------------------------------------------------------------------
INSERT INTO public.agent_schedules (agent_id, frequency_type, interval_hours, daily_at_hour, daily_at_minute, enabled, next_run_at)
VALUES
  ('scout', 'interval_hours', 6, NULL, 0, TRUE, NOW()),
  ('roots', 'interval_hours', 1, NULL, 0, TRUE, NOW()),
  ('sentinel', 'interval_hours', 4, NULL, 0, TRUE, NOW()),
  ('bloom', 'daily_at', NULL, 8, 0, TRUE, date_trunc('day', NOW() AT TIME ZONE 'UTC') + INTERVAL '8 hours'),
  ('sage', 'on_content', NULL, NULL, 0, TRUE, NOW()),
  ('ivy', 'daily_at', NULL, 8, 0, TRUE, date_trunc('day', NOW() AT TIME ZONE 'UTC') + INTERVAL '8 hours'),
  ('atlas', 'daily_at', NULL, 8, 0, TRUE, date_trunc('day', NOW() AT TIME ZONE 'UTC') + INTERVAL '8 hours'),
  ('echo', 'interval_hours', 6, NULL, 0, TRUE, NOW())
ON CONFLICT (agent_id) DO UPDATE SET
  frequency_type = EXCLUDED.frequency_type,
  interval_hours = EXCLUDED.interval_hours,
  daily_at_hour = EXCLUDED.daily_at_hour,
  daily_at_minute = EXCLUDED.daily_at_minute,
  enabled = EXCLUDED.enabled,
  next_run_at = CASE
    WHEN public.agent_schedules.last_run_at IS NULL THEN EXCLUDED.next_run_at
    ELSE public.agent_schedules.next_run_at
  END,
  updated_at = NOW();

-- Disable agents outside Phase 24 autonomous scope (manual / approval-only)
UPDATE public.agent_schedules
SET enabled = FALSE, updated_at = NOW()
WHERE agent_id IN ('oak', 'fern', 'sprout', 'gate');

-- Ensure health rows exist for all scheduled agents
INSERT INTO public.agent_health (agent_id, status)
SELECT s.agent_id, 'sleeping'
FROM public.agent_schedules s
WHERE s.enabled = TRUE
  AND NOT EXISTS (SELECT 1 FROM public.agent_health h WHERE h.agent_id = s.agent_id);

NOTIFY pgrst, 'reload schema';
