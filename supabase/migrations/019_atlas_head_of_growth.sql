-- PlantPal Marketing OS — Phase 13: Atlas Head of Growth Agent
-- Run AFTER 018_ivy_seed.sql

ALTER TABLE public.agent_activity_log
  DROP CONSTRAINT IF EXISTS agent_activity_log_agent_id_check;

ALTER TABLE public.agent_activity_log
  ADD CONSTRAINT agent_activity_log_agent_id_check
  CHECK (agent_id IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy', 'atlas'));

-- ---------------------------------------------------------------------------
-- atlas_growth_metrics — analytics snapshot (installs, waitlist, traffic, etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_growth_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE UNIQUE,
  total_users INTEGER NOT NULL DEFAULT 0,
  total_installs INTEGER NOT NULL DEFAULT 0,
  waitlist_count INTEGER NOT NULL DEFAULT 0,
  weekly_active_users INTEGER NOT NULL DEFAULT 0,
  monthly_active_users INTEGER NOT NULL DEFAULT 0,
  traffic_sessions INTEGER NOT NULL DEFAULT 0,
  conversion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  engagement_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  retention_d7 NUMERIC(5,2) NOT NULL DEFAULT 0,
  retention_d30 NUMERIC(5,2) NOT NULL DEFAULT 0,
  growth_stage TEXT NOT NULL DEFAULT '0_to_1k' CHECK (
    growth_stage IN ('0_to_1k', '1k_to_10k', '10k_to_100k', '100k_to_1m')
  ),
  channel_breakdown JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_atlas_metrics_date ON public.atlas_growth_metrics(snapshot_date DESC);

CREATE TRIGGER atlas_growth_metrics_updated_at
  BEFORE UPDATE ON public.atlas_growth_metrics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- atlas_experiments — growth experiments (recommend only, no auto-execution)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  hypothesis TEXT NOT NULL DEFAULT '',
  expected_outcome TEXT NOT NULL DEFAULT '',
  effort TEXT NOT NULL DEFAULT 'medium' CHECK (effort IN ('low', 'medium', 'high')),
  impact INTEGER NOT NULL DEFAULT 50 CHECK (impact BETWEEN 1 AND 100),
  priority_score INTEGER NOT NULL DEFAULT 50 CHECK (priority_score BETWEEN 1 AND 100),
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (
    status IN ('proposed', 'running', 'completed', 'paused', 'cancelled')
  ),
  results TEXT NOT NULL DEFAULT '',
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_atlas_experiments_status ON public.atlas_experiments(status);
CREATE INDEX IF NOT EXISTS idx_atlas_experiments_priority ON public.atlas_experiments(priority_score DESC);

CREATE TRIGGER atlas_experiments_updated_at
  BEFORE UPDATE ON public.atlas_experiments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- atlas_recommendations — scored growth opportunities
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'acquisition' CHECK (
    category IN ('acquisition', 'retention', 'channel', 'experiment', 'bottleneck_fix')
  ),
  reach INTEGER NOT NULL DEFAULT 0 CHECK (reach BETWEEN 0 AND 100),
  cost INTEGER NOT NULL DEFAULT 0 CHECK (cost BETWEEN 0 AND 100),
  difficulty INTEGER NOT NULL DEFAULT 0 CHECK (difficulty BETWEEN 0 AND 100),
  virality INTEGER NOT NULL DEFAULT 0 CHECK (virality BETWEEN 0 AND 100),
  revenue_potential INTEGER NOT NULL DEFAULT 0 CHECK (revenue_potential BETWEEN 0 AND 100),
  retention_potential INTEGER NOT NULL DEFAULT 0 CHECK (retention_potential BETWEEN 0 AND 100),
  priority_score INTEGER NOT NULL DEFAULT 50 CHECK (priority_score BETWEEN 1 AND 100),
  source_agent TEXT NOT NULL DEFAULT '',
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_atlas_recommendations_date ON public.atlas_recommendations(report_date DESC, priority_score DESC);

CREATE TRIGGER atlas_recommendations_updated_at
  BEFORE UPDATE ON public.atlas_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- atlas_forecasts — growth predictions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horizon TEXT NOT NULL CHECK (horizon IN ('7d', '30d', '90d', 'annual')),
  predicted_users INTEGER NOT NULL DEFAULT 0,
  predicted_installs INTEGER NOT NULL DEFAULT 0,
  growth_rate_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
  confidence INTEGER NOT NULL DEFAULT 70 CHECK (confidence BETWEEN 0 AND 100),
  assumptions TEXT NOT NULL DEFAULT '',
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_atlas_forecasts_date ON public.atlas_forecasts(report_date DESC, horizon);

CREATE TRIGGER atlas_forecasts_updated_at
  BEFORE UPDATE ON public.atlas_forecasts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- atlas_growth_reports — daily brief + weekly strategy memo
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_growth_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL CHECK (report_type IN ('daily', 'weekly')),
  run_date DATE NOT NULL DEFAULT CURRENT_DATE,
  executive_summary TEXT NOT NULL DEFAULT '',
  sections JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_atlas_reports_type_date ON public.atlas_growth_reports(report_type, run_date DESC);

CREATE TRIGGER atlas_growth_reports_updated_at
  BEFORE UPDATE ON public.atlas_growth_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- atlas_bottlenecks — detected growth blockers + suggested fixes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_bottlenecks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bottleneck_type TEXT NOT NULL CHECK (
    bottleneck_type IN (
      'conversion', 'engagement', 'retention', 'creator_performance',
      'channel_underperformance', 'waitlist', 'traffic'
    )
  ),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  suggested_fix TEXT NOT NULL DEFAULT '',
  metric_value NUMERIC(8,2),
  benchmark_value NUMERIC(8,2),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'monitoring')),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_atlas_bottlenecks_date ON public.atlas_bottlenecks(report_date DESC);

CREATE TRIGGER atlas_bottlenecks_updated_at
  BEFORE UPDATE ON public.atlas_bottlenecks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.atlas_growth_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_growth_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_bottlenecks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketing_os_all_atlas_metrics" ON public.atlas_growth_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_atlas_experiments" ON public.atlas_experiments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_atlas_recommendations" ON public.atlas_recommendations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_atlas_forecasts" ON public.atlas_forecasts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_atlas_reports" ON public.atlas_growth_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_atlas_bottlenecks" ON public.atlas_bottlenecks FOR ALL USING (true) WITH CHECK (true);
