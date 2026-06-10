-- PlantPal Marketing OS — Phase 15: Echo Voice of Customer Agent
-- Run AFTER 022_fern_seed.sql

ALTER TABLE public.agent_activity_log
  DROP CONSTRAINT IF EXISTS agent_activity_log_agent_id_check;

ALTER TABLE public.agent_activity_log
  ADD CONSTRAINT agent_activity_log_agent_id_check
  CHECK (agent_id IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy', 'atlas', 'fern', 'echo'));

-- ---------------------------------------------------------------------------
-- echo_feedback — individual customer feedback items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.echo_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (
    source IN (
      'support_ticket', 'app_review', 'email', 'community_comment', 'reddit',
      'facebook_groups', 'youtube_comment', 'tiktok_comment', 'instagram_comment',
      'survey', 'feature_request'
    )
  ),
  category TEXT NOT NULL CHECK (
    category IN (
      'plant_identification', 'plant_doctor', 'academy', 'tasks', 'reminders',
      'landscape_designer', 'community', 'pricing', 'subscriptions', 'onboarding',
      'performance', 'general_feedback'
    )
  ),
  feedback_type TEXT NOT NULL DEFAULT 'general' CHECK (
    feedback_type IN (
      'feature_request', 'complaint', 'confusion', 'friction', 'satisfaction',
      'onboarding_issue', 'retention_issue', 'bug_report', 'praise', 'general'
    )
  ),
  sentiment TEXT NOT NULL DEFAULT 'neutral' CHECK (
    sentiment IN ('positive', 'neutral', 'negative', 'urgent')
  ),
  content TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT 'Anonymous',
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_echo_feedback_date ON public.echo_feedback(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_echo_feedback_sentiment ON public.echo_feedback(sentiment);
CREATE INDEX IF NOT EXISTS idx_echo_feedback_category ON public.echo_feedback(category);

CREATE TRIGGER echo_feedback_updated_at
  BEFORE UPDATE ON public.echo_feedback
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- echo_feature_requests — aggregated feature demand tracking
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.echo_feature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general_feedback',
  description TEXT NOT NULL DEFAULT '',
  frequency INTEGER NOT NULL DEFAULT 1,
  priority INTEGER NOT NULL DEFAULT 50 CHECK (priority BETWEEN 1 AND 100),
  impact INTEGER NOT NULL DEFAULT 50 CHECK (impact BETWEEN 1 AND 100),
  estimated_demand INTEGER NOT NULL DEFAULT 0,
  trend TEXT NOT NULL DEFAULT 'stable' CHECK (trend IN ('rising', 'stable', 'declining', 'emerging')),
  status TEXT NOT NULL DEFAULT 'tracking' CHECK (status IN ('tracking', 'recommended', 'planned', 'shipped')),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_echo_feature_requests_priority ON public.echo_feature_requests(priority DESC);
CREATE INDEX IF NOT EXISTS idx_echo_feature_requests_frequency ON public.echo_feature_requests(frequency DESC);

CREATE TRIGGER echo_feature_requests_updated_at
  BEFORE UPDATE ON public.echo_feature_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- echo_sentiment — sentiment trend snapshots
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.echo_sentiment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  positive_count INTEGER NOT NULL DEFAULT 0,
  neutral_count INTEGER NOT NULL DEFAULT 0,
  negative_count INTEGER NOT NULL DEFAULT 0,
  urgent_count INTEGER NOT NULL DEFAULT 0,
  positive_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  negative_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  trend_direction TEXT NOT NULL DEFAULT 'stable' CHECK (trend_direction IN ('improving', 'stable', 'declining')),
  top_category TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_echo_sentiment_date ON public.echo_sentiment(snapshot_date);

CREATE TRIGGER echo_sentiment_updated_at
  BEFORE UPDATE ON public.echo_sentiment
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- echo_love_signals — positive feedback worth amplifying
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.echo_love_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature TEXT NOT NULL DEFAULT '',
  quote TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general_feedback',
  marketing_potential INTEGER NOT NULL DEFAULT 50 CHECK (marketing_potential BETWEEN 1 AND 100),
  testimonial_ready BOOLEAN NOT NULL DEFAULT FALSE,
  ambassador_potential BOOLEAN NOT NULL DEFAULT FALSE,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_echo_love_signals_date ON public.echo_love_signals(report_date DESC);

CREATE TRIGGER echo_love_signals_updated_at
  BEFORE UPDATE ON public.echo_love_signals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- echo_churn_risks — identified retention risks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.echo_churn_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  churn_reason TEXT NOT NULL CHECK (
    churn_reason IN ('confusion', 'missing_features', 'pricing', 'bugs', 'poor_experience', 'other')
  ),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  affected_users_estimate INTEGER NOT NULL DEFAULT 0,
  suggested_action TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'monitoring', 'resolved')),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_echo_churn_risks_date ON public.echo_churn_risks(report_date DESC);

CREATE TRIGGER echo_churn_risks_updated_at
  BEFORE UPDATE ON public.echo_churn_risks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- echo_reports — daily + weekly VoC reports
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.echo_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL CHECK (report_type IN ('daily', 'weekly')),
  run_date DATE NOT NULL DEFAULT CURRENT_DATE,
  executive_summary TEXT NOT NULL DEFAULT '',
  sections JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_echo_reports_type_date ON public.echo_reports(report_type, run_date DESC);

CREATE TRIGGER echo_reports_updated_at
  BEFORE UPDATE ON public.echo_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.echo_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.echo_feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.echo_sentiment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.echo_love_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.echo_churn_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.echo_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketing_os_all_echo_feedback" ON public.echo_feedback FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_echo_feature_requests" ON public.echo_feature_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_echo_sentiment" ON public.echo_sentiment FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_echo_love_signals" ON public.echo_love_signals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_echo_churn_risks" ON public.echo_churn_risks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_echo_reports" ON public.echo_reports FOR ALL USING (true) WITH CHECK (true);
