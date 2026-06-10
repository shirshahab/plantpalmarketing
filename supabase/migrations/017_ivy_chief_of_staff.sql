-- PlantPal Marketing OS — Phase 12: Ivy Chief of Staff Agent
-- Run AFTER 016_oak_seed.sql

ALTER TABLE public.agent_activity_log
  DROP CONSTRAINT IF EXISTS agent_activity_log_agent_id_check;

ALTER TABLE public.agent_activity_log
  ADD CONSTRAINT agent_activity_log_agent_id_check
  CHECK (agent_id IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy'));

-- ---------------------------------------------------------------------------
-- ivy_briefs — daily and weekly executive briefings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ivy_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_type TEXT NOT NULL CHECK (brief_type IN ('daily', 'weekly')),
  run_date DATE NOT NULL DEFAULT CURRENT_DATE,
  executive_summary TEXT NOT NULL DEFAULT '',
  sections JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ivy_briefs_type_date ON public.ivy_briefs(brief_type, run_date DESC);

CREATE TRIGGER ivy_briefs_updated_at
  BEFORE UPDATE ON public.ivy_briefs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- ivy_recommendations — scored action items (recommend only, no execution)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ivy_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (
    category IN ('roi_action', 'threat', 'approval', 'growth_opportunity')
  ),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  priority_score INTEGER NOT NULL DEFAULT 50 CHECK (priority_score BETWEEN 1 AND 100),
  revenue_impact INTEGER NOT NULL DEFAULT 0 CHECK (revenue_impact BETWEEN 0 AND 100),
  growth_impact INTEGER NOT NULL DEFAULT 0 CHECK (growth_impact BETWEEN 0 AND 100),
  virality_potential INTEGER NOT NULL DEFAULT 0 CHECK (virality_potential BETWEEN 0 AND 100),
  time_sensitivity INTEGER NOT NULL DEFAULT 0 CHECK (time_sensitivity BETWEEN 0 AND 100),
  source_agent TEXT NOT NULL DEFAULT '',
  source_entity_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'dismissed')),
  brief_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ivy_recommendations_date ON public.ivy_recommendations(brief_date DESC, priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_ivy_recommendations_category ON public.ivy_recommendations(category);

CREATE TRIGGER ivy_recommendations_updated_at
  BEFORE UPDATE ON public.ivy_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- ivy_alerts — urgent alerts and risk warnings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ivy_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('urgent', 'risk', 'growth')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  priority_score INTEGER NOT NULL DEFAULT 50 CHECK (priority_score BETWEEN 1 AND 100),
  source_agent TEXT NOT NULL DEFAULT '',
  source_entity_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  brief_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ivy_alerts_date ON public.ivy_alerts(brief_date DESC, priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_ivy_alerts_type ON public.ivy_alerts(alert_type);

CREATE TRIGGER ivy_alerts_updated_at
  BEFORE UPDATE ON public.ivy_alerts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.ivy_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ivy_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ivy_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketing_os_all_ivy_briefs" ON public.ivy_briefs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_ivy_recommendations" ON public.ivy_recommendations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_ivy_alerts" ON public.ivy_alerts FOR ALL USING (true) WITH CHECK (true);
