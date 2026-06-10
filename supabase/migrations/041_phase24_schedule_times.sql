-- PlantPal Marketing OS — Phase 24: Correct morning schedule times + enable Oak/Fern
-- Times are UTC (align with existing scheduler). Safe to re-run.

ALTER TABLE public.agent_schedules
  ADD COLUMN IF NOT EXISTS interval_minutes INTEGER CHECK (interval_minutes IS NULL OR interval_minutes >= 1);

-- Atlas 7:00 · Ivy 7:30 · Bloom 8:00 · Fern 8:30 · Oak 9:00
-- Sage: on_content with 30-minute cooldown when content needs review
INSERT INTO public.agent_schedules (
  agent_id, frequency_type, interval_hours, interval_minutes, daily_at_hour, daily_at_minute, enabled, next_run_at
)
VALUES
  ('atlas', 'daily_at', NULL, NULL, 7, 0, TRUE,
    date_trunc('day', NOW() AT TIME ZONE 'UTC') + INTERVAL '7 hours'),
  ('ivy', 'daily_at', NULL, NULL, 7, 30, TRUE,
    date_trunc('day', NOW() AT TIME ZONE 'UTC') + INTERVAL '7 hours 30 minutes'),
  ('bloom', 'daily_at', NULL, NULL, 8, 0, TRUE,
    date_trunc('day', NOW() AT TIME ZONE 'UTC') + INTERVAL '8 hours'),
  ('fern', 'daily_at', NULL, NULL, 8, 30, TRUE,
    date_trunc('day', NOW() AT TIME ZONE 'UTC') + INTERVAL '8 hours 30 minutes'),
  ('oak', 'daily_at', NULL, NULL, 9, 0, TRUE,
    date_trunc('day', NOW() AT TIME ZONE 'UTC') + INTERVAL '9 hours'),
  ('sage', 'on_content', NULL, 30, NULL, 0, TRUE, NOW())
ON CONFLICT (agent_id) DO UPDATE SET
  frequency_type = EXCLUDED.frequency_type,
  interval_hours = EXCLUDED.interval_hours,
  interval_minutes = EXCLUDED.interval_minutes,
  daily_at_hour = EXCLUDED.daily_at_hour,
  daily_at_minute = EXCLUDED.daily_at_minute,
  enabled = EXCLUDED.enabled,
  next_run_at = CASE
    WHEN public.agent_schedules.last_run_at IS NULL THEN EXCLUDED.next_run_at
    ELSE public.agent_schedules.next_run_at
  END,
  updated_at = NOW();

INSERT INTO public.agent_health (agent_id, status)
SELECT s.agent_id, 'sleeping'
FROM public.agent_schedules s
WHERE s.enabled = TRUE
  AND s.agent_id IN ('oak', 'fern')
  AND NOT EXISTS (SELECT 1 FROM public.agent_health h WHERE h.agent_id = s.agent_id);

NOTIFY pgrst, 'reload schema';
