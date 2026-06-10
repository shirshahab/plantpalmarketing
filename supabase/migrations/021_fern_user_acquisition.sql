-- PlantPal Marketing OS — Phase 14: Fern User Acquisition Agent
-- Run AFTER 020_atlas_seed.sql

ALTER TABLE public.agent_activity_log
  DROP CONSTRAINT IF EXISTS agent_activity_log_agent_id_check;

ALTER TABLE public.agent_activity_log
  ADD CONSTRAINT agent_activity_log_agent_id_check
  CHECK (agent_id IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy', 'atlas', 'fern'));

-- ---------------------------------------------------------------------------
-- fern_opportunities — scored acquisition opportunities (recommend only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fern_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  traffic_source TEXT NOT NULL CHECK (
    traffic_source IN (
      'instagram', 'tiktok', 'youtube', 'pinterest', 'reddit',
      'facebook_groups', 'google_search', 'influencers', 'partnerships', 'referral', 'other'
    )
  ),
  opportunity_type TEXT NOT NULL DEFAULT 'acquisition' CHECK (
    opportunity_type IN ('acquisition', 'viral_loop', 'referral', 'community', 'partnership', 'traffic')
  ),
  reach INTEGER NOT NULL DEFAULT 0 CHECK (reach BETWEEN 0 AND 100),
  cost INTEGER NOT NULL DEFAULT 0 CHECK (cost BETWEEN 0 AND 100),
  difficulty INTEGER NOT NULL DEFAULT 0 CHECK (difficulty BETWEEN 0 AND 100),
  virality INTEGER NOT NULL DEFAULT 0 CHECK (virality BETWEEN 0 AND 100),
  estimated_installs INTEGER NOT NULL DEFAULT 0,
  priority_score INTEGER NOT NULL DEFAULT 50 CHECK (priority_score BETWEEN 1 AND 100),
  source_agent TEXT NOT NULL DEFAULT '',
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fern_opportunities_date ON public.fern_opportunities(report_date DESC, priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_fern_opportunities_source ON public.fern_opportunities(traffic_source);

CREATE TRIGGER fern_opportunities_updated_at
  BEFORE UPDATE ON public.fern_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- fern_experiments — growth experiments for install acquisition
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fern_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  hypothesis TEXT NOT NULL DEFAULT '',
  effort TEXT NOT NULL DEFAULT 'medium' CHECK (effort IN ('low', 'medium', 'high')),
  expected_impact INTEGER NOT NULL DEFAULT 50 CHECK (expected_impact BETWEEN 1 AND 100),
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (
    status IN ('proposed', 'running', 'completed', 'paused', 'cancelled')
  ),
  results TEXT NOT NULL DEFAULT '',
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fern_experiments_status ON public.fern_experiments(status);
CREATE INDEX IF NOT EXISTS idx_fern_experiments_date ON public.fern_experiments(report_date DESC);

CREATE TRIGGER fern_experiments_updated_at
  BEFORE UPDATE ON public.fern_experiments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- fern_forecasts — install forecasts by channel and horizon
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fern_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horizon TEXT NOT NULL CHECK (horizon IN ('7d', '30d', '90d', 'monthly')),
  traffic_source TEXT NOT NULL DEFAULT 'all',
  predicted_installs INTEGER NOT NULL DEFAULT 0,
  confidence INTEGER NOT NULL DEFAULT 70 CHECK (confidence BETWEEN 0 AND 100),
  assumptions TEXT NOT NULL DEFAULT '',
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fern_forecasts_date ON public.fern_forecasts(report_date DESC, horizon);

CREATE TRIGGER fern_forecasts_updated_at
  BEFORE UPDATE ON public.fern_forecasts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.fern_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fern_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fern_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketing_os_all_fern_opportunities" ON public.fern_opportunities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_fern_experiments" ON public.fern_experiments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_fern_forecasts" ON public.fern_forecasts FOR ALL USING (true) WITH CHECK (true);
