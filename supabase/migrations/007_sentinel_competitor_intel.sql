-- PlantPal Marketing OS — Phase 7: Sentinel Competitor Intelligence Agent
-- Run AFTER 006_scout_roots_seed.sql

-- Extend agent activity log for Sentinel
ALTER TABLE public.agent_activity_log
  DROP CONSTRAINT IF EXISTS agent_activity_log_agent_id_check;

ALTER TABLE public.agent_activity_log
  ADD CONSTRAINT agent_activity_log_agent_id_check
  CHECK (agent_id IN ('scout', 'roots', 'sentinel'));

-- ---------------------------------------------------------------------------
-- competitor_scoreboard — live metrics per competitor
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.competitor_scoreboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  estimated_growth INTEGER NOT NULL DEFAULT 50 CHECK (estimated_growth >= 0 AND estimated_growth <= 100),
  app_store_rank INTEGER,
  app_store_category TEXT NOT NULL DEFAULT 'Lifestyle',
  review_trend TEXT NOT NULL DEFAULT 'stable' CHECK (
    review_trend IN ('improving', 'stable', 'declining', 'negative_spike')
  ),
  review_score NUMERIC(3,1) NOT NULL DEFAULT 4.0,
  social_engagement_score INTEGER NOT NULL DEFAULT 50 CHECK (social_engagement_score >= 0 AND social_engagement_score <= 100),
  new_features_count INTEGER NOT NULL DEFAULT 0,
  recent_campaigns JSONB NOT NULL DEFAULT '[]',
  threat_level INTEGER NOT NULL DEFAULT 50 CHECK (threat_level >= 0 AND threat_level <= 100),
  opportunity_level INTEGER NOT NULL DEFAULT 50 CHECK (opportunity_level >= 0 AND opportunity_level <= 100),
  notes TEXT NOT NULL DEFAULT '',
  last_scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- competitor_intel_alerts — Sentinel detections
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.competitor_intel_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (
    alert_type IN (
      'new_feature', 'app_store_ranking', 'viral_post', 'new_ad',
      'negative_reviews', 'partnership_discovered', 'social_growth', 'review_trend'
    )
  ),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  source TEXT NOT NULL DEFAULT '',
  recommended_action TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- competitor_daily_briefs — Sentinel daily intelligence summary
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.competitor_daily_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_date DATE NOT NULL DEFAULT CURRENT_DATE,
  biggest_threat TEXT NOT NULL DEFAULT '',
  biggest_opportunity TEXT NOT NULL DEFAULT '',
  recommended_response TEXT NOT NULL DEFAULT '',
  alerts_count INTEGER NOT NULL DEFAULT 0,
  competitors_scanned INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scoreboard_threat ON public.competitor_scoreboard(threat_level DESC);
CREATE INDEX IF NOT EXISTS idx_intel_alerts_competitor ON public.competitor_intel_alerts(competitor);
CREATE INDEX IF NOT EXISTS idx_intel_alerts_type ON public.competitor_intel_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_intel_alerts_created ON public.competitor_intel_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_briefs_date ON public.competitor_daily_briefs(brief_date DESC);

CREATE TRIGGER competitor_scoreboard_updated_at
  BEFORE UPDATE ON public.competitor_scoreboard
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER competitor_intel_alerts_updated_at
  BEFORE UPDATE ON public.competitor_intel_alerts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.competitor_scoreboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_intel_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_daily_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketing_os_all_scoreboard" ON public.competitor_scoreboard FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_intel_alerts" ON public.competitor_intel_alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_daily_briefs" ON public.competitor_daily_briefs FOR ALL USING (true) WITH CHECK (true);
