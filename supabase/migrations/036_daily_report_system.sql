-- PlantPal Marketing OS — Phase 19: Daily Report System + Growth Upgrade Layer
-- Safe to re-run. Paste entire file into Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- daily_reports
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  summary TEXT NOT NULL DEFAULT '',
  agent_productivity JSONB NOT NULL DEFAULT '[]',
  workflow_summary JSONB NOT NULL DEFAULT '{}',
  analytics_summary JSONB NOT NULL DEFAULT '{}',
  api_usage_summary JSONB NOT NULL DEFAULT '{}',
  growth_recommendations JSONB NOT NULL DEFAULT '[]',
  recommended_actions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON public.daily_reports(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_reports_created ON public.daily_reports(created_at DESC);

-- ---------------------------------------------------------------------------
-- workflow_runs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name TEXT NOT NULL UNIQUE,
  source_agent TEXT NOT NULL CHECK (
    source_agent IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy', 'atlas', 'fern', 'echo', 'gate')
  ),
  target_agent TEXT NOT NULL CHECK (
    target_agent IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy', 'atlas', 'fern', 'echo', 'gate')
  ),
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('completed', 'active', 'blocked', 'idle')
  ),
  items_moved INTEGER NOT NULL DEFAULT 0,
  bottleneck TEXT NOT NULL DEFAULT '',
  recommendation TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_name ON public.workflow_runs(workflow_name);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON public.workflow_runs(status);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_agents ON public.workflow_runs(source_agent, target_agent);

DROP TRIGGER IF EXISTS workflow_runs_updated_at ON public.workflow_runs;
CREATE TRIGGER workflow_runs_updated_at
  BEFORE UPDATE ON public.workflow_runs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- growth_action_items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.growth_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (
    priority IN ('low', 'medium', 'high', 'urgent')
  ),
  impact_score INTEGER NOT NULL DEFAULT 50 CHECK (impact_score >= 1 AND impact_score <= 100),
  effort_score INTEGER NOT NULL DEFAULT 50 CHECK (effort_score >= 1 AND effort_score <= 100),
  owner_agent TEXT NOT NULL DEFAULT 'atlas' CHECK (
    owner_agent IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy', 'atlas', 'fern', 'echo', 'gate')
  ),
  status TEXT NOT NULL DEFAULT 'recommended' CHECK (
    status IN ('recommended', 'approved', 'in_progress', 'completed', 'dismissed')
  ),
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_growth_action_items_priority ON public.growth_action_items(priority, impact_score DESC);
CREATE INDEX IF NOT EXISTS idx_growth_action_items_owner ON public.growth_action_items(owner_agent, status);
CREATE INDEX IF NOT EXISTS idx_growth_action_items_status ON public.growth_action_items(status);

DROP TRIGGER IF EXISTS growth_action_items_updated_at ON public.growth_action_items;
CREATE TRIGGER growth_action_items_updated_at
  BEFORE UPDATE ON public.growth_action_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS + policies
-- ---------------------------------------------------------------------------
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_action_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketing_os_all_daily_reports" ON public.daily_reports;
CREATE POLICY "marketing_os_all_daily_reports" ON public.daily_reports FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_workflow_runs" ON public.workflow_runs;
CREATE POLICY "marketing_os_all_workflow_runs" ON public.workflow_runs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_growth_action_items" ON public.growth_action_items;
CREATE POLICY "marketing_os_all_growth_action_items" ON public.growth_action_items FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
