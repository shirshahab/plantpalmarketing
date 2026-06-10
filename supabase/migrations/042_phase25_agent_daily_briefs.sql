-- PlantPal Marketing OS — Phase 25: Repair agent_daily_briefs
-- Fixes: "Could not find the table public.agent_daily_briefs in the schema cache"
-- Creates the table if missing, upgrades older installs in place. Safe to re-run.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.agent_daily_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  agent_productivity JSONB NOT NULL DEFAULT '[]'::jsonb,
  workflow_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  api_usage_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  analytics_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by_agent TEXT NOT NULL DEFAULT 'ivy',
  status TEXT NOT NULL DEFAULT 'generated',
  -- Legacy columns kept for the original discovery pipeline (run-pipeline.ts)
  run_date DATE NOT NULL DEFAULT CURRENT_DATE,
  discovery_summary TEXT NOT NULL DEFAULT '',
  content_count INTEGER NOT NULL DEFAULT 0,
  approved_count INTEGER NOT NULL DEFAULT 0,
  rejected_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Upgrade path: older installs created this table via 004 with the legacy shape only.
ALTER TABLE public.agent_daily_briefs ADD COLUMN IF NOT EXISTS brief_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE public.agent_daily_briefs ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
ALTER TABLE public.agent_daily_briefs ADD COLUMN IF NOT EXISTS summary TEXT NOT NULL DEFAULT '';
ALTER TABLE public.agent_daily_briefs ADD COLUMN IF NOT EXISTS agent_productivity JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.agent_daily_briefs ADD COLUMN IF NOT EXISTS workflow_summary JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.agent_daily_briefs ADD COLUMN IF NOT EXISTS api_usage_summary JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.agent_daily_briefs ADD COLUMN IF NOT EXISTS analytics_summary JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.agent_daily_briefs ADD COLUMN IF NOT EXISTS recommendations JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.agent_daily_briefs ADD COLUMN IF NOT EXISTS created_by_agent TEXT NOT NULL DEFAULT 'ivy';
ALTER TABLE public.agent_daily_briefs ADD COLUMN IF NOT EXISTS run_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE public.agent_daily_briefs ADD COLUMN IF NOT EXISTS discovery_summary TEXT NOT NULL DEFAULT '';
ALTER TABLE public.agent_daily_briefs ADD COLUMN IF NOT EXISTS content_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.agent_daily_briefs ADD COLUMN IF NOT EXISTS approved_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.agent_daily_briefs ADD COLUMN IF NOT EXISTS rejected_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.agent_daily_briefs ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE public.agent_daily_briefs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.agent_daily_briefs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Loosen the legacy status CHECK ('running'|'completed'|'failed') to include 'generated'.
ALTER TABLE public.agent_daily_briefs DROP CONSTRAINT IF EXISTS agent_daily_briefs_status_check;
ALTER TABLE public.agent_daily_briefs
  ADD CONSTRAINT agent_daily_briefs_status_check
  CHECK (status IN ('generated', 'running', 'completed', 'failed', 'archived'));
ALTER TABLE public.agent_daily_briefs ALTER COLUMN status SET DEFAULT 'generated';

CREATE INDEX IF NOT EXISTS idx_agent_daily_briefs_brief_date ON public.agent_daily_briefs(brief_date DESC);
CREATE INDEX IF NOT EXISTS idx_agent_daily_briefs_created ON public.agent_daily_briefs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_daily_briefs_status ON public.agent_daily_briefs(status);

DROP TRIGGER IF EXISTS agent_daily_briefs_updated_at ON public.agent_daily_briefs;
CREATE TRIGGER agent_daily_briefs_updated_at
  BEFORE UPDATE ON public.agent_daily_briefs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.agent_daily_briefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketing_os_all_agent_briefs" ON public.agent_daily_briefs;
DROP POLICY IF EXISTS "marketing_os_all_agent_daily_briefs" ON public.agent_daily_briefs;
CREATE POLICY "marketing_os_all_agent_daily_briefs" ON public.agent_daily_briefs
  FOR ALL USING (true) WITH CHECK (true);

-- Seed example (only when the table is empty)
INSERT INTO public.agent_daily_briefs (
  brief_date, title, summary,
  agent_productivity, workflow_summary, api_usage_summary, analytics_summary, recommendations,
  created_by_agent, status
)
SELECT
  CURRENT_DATE,
  'Daily Brief — Seed Example',
  'Ivy generated this example brief. Run "Generate Daily Report" to replace it with live data.',
  '[{"agentId": "bloom", "name": "Bloom", "tasksCompleted": 3, "outputsGenerated": 5}]'::jsonb,
  '{"completed": [], "active": [], "blocked": [], "all": []}'::jsonb,
  '{"providers": [], "totalSuccessful": 0, "totalFailed": 0}'::jsonb,
  '{"periodLabel": "Last 24 hours"}'::jsonb,
  '[{"title": "Connect X publish tokens", "priority": "medium", "ownerAgent": "sprout"}]'::jsonb,
  'ivy',
  'generated'
WHERE NOT EXISTS (SELECT 1 FROM public.agent_daily_briefs);

NOTIFY pgrst, 'reload schema';
