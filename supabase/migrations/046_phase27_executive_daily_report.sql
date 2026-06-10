-- PlantPal Marketing OS — Phase 27: Executive operator daily report
-- Adds structured JSONB sections to daily_reports. Safe to re-run.

ALTER TABLE public.daily_reports ADD COLUMN IF NOT EXISTS executive_summary JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.daily_reports ADD COLUMN IF NOT EXISTS content_report JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.daily_reports ADD COLUMN IF NOT EXISTS growth_report JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.daily_reports ADD COLUMN IF NOT EXISTS action_plan JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.daily_reports ADD COLUMN IF NOT EXISTS founder_review JSONB NOT NULL DEFAULT '{}'::jsonb;

NOTIFY pgrst, 'reload schema';
