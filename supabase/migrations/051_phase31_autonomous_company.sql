-- PlantPal Marketing OS — Phase 31: Fully Autonomous Marketing Company
-- Safe to re-run.
--
-- Step 1: scheduler upgrade (agent_schedules/agent_runs/agent_health exist since 037)
-- Step 3: analytics_events, analytics_snapshots, analytics_metrics
-- Step 4: creative_projects, creative_assets, creative_reviews
-- Step 6: seo_topics, seo_clusters, seo_rank_tracking (+ seo_posts view)
-- Step 7: reddit engagement columns (+ reddit_monitor/reddit_drafts/reddit_approvals views)
-- Step 8: agent_scorecards
-- Step 10: launch_checklist

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
-- STEP 1 — Scheduler upgrade
-- ===========================================================================

-- Allow minute-level intervals (Sprout every 30 minutes)
ALTER TABLE public.agent_schedules DROP CONSTRAINT IF EXISTS agent_schedules_frequency_type_check;
ALTER TABLE public.agent_schedules
  ADD CONSTRAINT agent_schedules_frequency_type_check
  CHECK (frequency_type IN ('interval_hours', 'interval_minutes', 'daily_at', 'on_content'));

ALTER TABLE public.agent_schedules ADD COLUMN IF NOT EXISTS interval_minutes INTEGER;

-- Phase 31 cadences:
-- Scout 2h · Roots 1h · Sentinel 4h · Bloom 4h · Sage event-driven
-- Gate event-driven · Sprout 30min · Atlas 6h · Echo 6h · Fern event-driven · Ivy daily 8:00
INSERT INTO public.agent_schedules (
  agent_id, frequency_type, interval_hours, interval_minutes, daily_at_hour, daily_at_minute, enabled, next_run_at
)
VALUES
  ('scout',    'interval_hours',   2,    NULL, NULL, 0, TRUE, NOW()),
  ('roots',    'interval_hours',   1,    NULL, NULL, 0, TRUE, NOW()),
  ('sentinel', 'interval_hours',   4,    NULL, NULL, 0, TRUE, NOW()),
  ('bloom',    'interval_hours',   4,    NULL, NULL, 0, TRUE, NOW()),
  ('sage',     'on_content',       NULL, 30,   NULL, 0, TRUE, NOW()),
  ('gate',     'on_content',       NULL, 30,   NULL, 0, TRUE, NOW()),
  ('sprout',   'interval_minutes', NULL, 30,   NULL, 0, TRUE, NOW()),
  ('atlas',    'interval_hours',   6,    NULL, NULL, 0, TRUE, NOW()),
  ('echo',     'interval_hours',   6,    NULL, NULL, 0, TRUE, NOW()),
  ('fern',     'on_content',       NULL, 60,   NULL, 0, TRUE, NOW()),
  ('ivy',      'daily_at',         NULL, NULL, 8,    0, TRUE,
    date_trunc('day', NOW() AT TIME ZONE 'UTC') + INTERVAL '8 hours'),
  ('oak',      'daily_at',         NULL, NULL, 9,    0, TRUE,
    date_trunc('day', NOW() AT TIME ZONE 'UTC') + INTERVAL '9 hours')
ON CONFLICT (agent_id) DO UPDATE SET
  frequency_type = EXCLUDED.frequency_type,
  interval_hours = EXCLUDED.interval_hours,
  interval_minutes = EXCLUDED.interval_minutes,
  daily_at_hour = EXCLUDED.daily_at_hour,
  daily_at_minute = EXCLUDED.daily_at_minute,
  enabled = EXCLUDED.enabled,
  updated_at = NOW();

-- Health rows for every scheduled agent
INSERT INTO public.agent_health (agent_id, status)
SELECT s.agent_id, 'sleeping'
FROM public.agent_schedules s
WHERE NOT EXISTS (SELECT 1 FROM public.agent_health h WHERE h.agent_id = s.agent_id);

-- ===========================================================================
-- STEP 3 — Analytics layer
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL DEFAULT 'pageview',
  source TEXT NOT NULL DEFAULT 'manual',
  event_key TEXT NOT NULL DEFAULT '',
  value NUMERIC NOT NULL DEFAULT 1,
  metadata JSONB NOT NULL DEFAULT '{}',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type, occurred_at DESC);

CREATE TABLE IF NOT EXISTS public.analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL DEFAULT 'traffic',
  metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_snapshots_day ON public.analytics_snapshots(snapshot_date, category);

CREATE TABLE IF NOT EXISTS public.analytics_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_key TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'traffic',
  value NUMERIC NOT NULL DEFAULT 0,
  previous_value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'count',
  source TEXT NOT NULL DEFAULT 'internal',
  connection_status TEXT NOT NULL DEFAULT 'not_connected',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_metrics_key ON public.analytics_metrics(metric_key);

DROP TRIGGER IF EXISTS analytics_metrics_updated_at ON public.analytics_metrics;
CREATE TRIGGER analytics_metrics_updated_at
  BEFORE UPDATE ON public.analytics_metrics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- External sources start as "not connected" — never crash, never fake numbers
INSERT INTO public.analytics_metrics (metric_key, label, category, source, connection_status) VALUES
  ('website_traffic', 'Website traffic', 'traffic', 'website', 'not_connected'),
  ('blog_traffic', 'Blog traffic', 'traffic', 'website', 'not_connected'),
  ('search_traffic', 'Search traffic', 'seo', 'search_console', 'not_connected'),
  ('x_impressions', 'X impressions', 'growth', 'x_api', 'not_connected'),
  ('x_followers', 'X followers', 'growth', 'x_api', 'not_connected')
ON CONFLICT (metric_key) DO NOTHING;

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_analytics_events" ON public.analytics_events;
CREATE POLICY "marketing_os_all_analytics_events" ON public.analytics_events FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "marketing_os_all_analytics_snapshots" ON public.analytics_snapshots;
CREATE POLICY "marketing_os_all_analytics_snapshots" ON public.analytics_snapshots FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "marketing_os_all_analytics_metrics" ON public.analytics_metrics;
CREATE POLICY "marketing_os_all_analytics_metrics" ON public.analytics_metrics FOR ALL USING (true) WITH CHECK (true);

-- ===========================================================================
-- STEP 4 — Fern Creative Department
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.creative_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  brief TEXT NOT NULL DEFAULT '',
  project_type TEXT NOT NULL DEFAULT 'image',
  calendar_item_id UUID,
  source_table TEXT NOT NULL DEFAULT '',
  source_id UUID,
  platform TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'queued',
  variants_requested INTEGER NOT NULL DEFAULT 3,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.creative_projects DROP CONSTRAINT IF EXISTS creative_projects_status_check;
ALTER TABLE public.creative_projects
  ADD CONSTRAINT creative_projects_status_check
  CHECK (status IN ('queued', 'generating', 'in_review', 'approved', 'rejected', 'attached'));

ALTER TABLE public.creative_projects DROP CONSTRAINT IF EXISTS creative_projects_type_check;
ALTER TABLE public.creative_projects
  ADD CONSTRAINT creative_projects_type_check
  CHECK (project_type IN ('image', 'video', 'thumbnail', 'carousel', 'ugc', 'ad', 'blog_header'));

CREATE INDEX IF NOT EXISTS idx_creative_projects_status ON public.creative_projects(status, created_at DESC);

DROP TRIGGER IF EXISTS creative_projects_updated_at ON public.creative_projects;
CREATE TRIGGER creative_projects_updated_at
  BEFORE UPDATE ON public.creative_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.creative_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  variant_number INTEGER NOT NULL DEFAULT 1,
  asset_type TEXT NOT NULL DEFAULT 'image',
  prompt TEXT NOT NULL DEFAULT '',
  concept TEXT NOT NULL DEFAULT '',
  asset_url TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'concept',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.creative_assets DROP CONSTRAINT IF EXISTS creative_assets_status_check;
ALTER TABLE public.creative_assets
  ADD CONSTRAINT creative_assets_status_check
  CHECK (status IN ('concept', 'generated', 'approved', 'rejected', 'regenerate'));

CREATE INDEX IF NOT EXISTS idx_creative_assets_project ON public.creative_assets(project_id, variant_number);

DROP TRIGGER IF EXISTS creative_assets_updated_at ON public.creative_assets;
CREATE TRIGGER creative_assets_updated_at
  BEFORE UPDATE ON public.creative_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.creative_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  asset_id UUID,
  decision TEXT NOT NULL DEFAULT 'approve',
  feedback TEXT NOT NULL DEFAULT '',
  reviewer TEXT NOT NULL DEFAULT 'founder',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_creative_reviews_project ON public.creative_reviews(project_id, created_at DESC);

ALTER TABLE public.creative_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_creative_projects" ON public.creative_projects;
CREATE POLICY "marketing_os_all_creative_projects" ON public.creative_projects FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "marketing_os_all_creative_assets" ON public.creative_assets;
CREATE POLICY "marketing_os_all_creative_assets" ON public.creative_assets FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "marketing_os_all_creative_reviews" ON public.creative_reviews;
CREATE POLICY "marketing_os_all_creative_reviews" ON public.creative_reviews FOR ALL USING (true) WITH CHECK (true);

-- ===========================================================================
-- STEP 6 — SEO Factory (builds on 050's seo_blog_keywords / seo_blog_posts)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.seo_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  target_posts INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_seo_clusters_name ON public.seo_clusters(name);

DROP TRIGGER IF EXISTS seo_clusters_updated_at ON public.seo_clusters;
CREATE TRIGGER seo_clusters_updated_at
  BEFORE UPDATE ON public.seo_clusters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.seo_clusters (name, description, target_posts) VALUES
  ('plant problems', 'Panic searches. Yellow leaves, dying plants, weird spots. Highest intent.', 10),
  ('watering', 'Overwatering vs underwatering. The eternal confusion.', 6),
  ('beginner guides', 'First plant, easy plants, common mistakes.', 8),
  ('seasonal', 'What to plant this month, by region.', 6),
  ('local', 'ZIP code and region specific guides. Low competition.', 5),
  ('plant care', 'General care, species guides, repotting.', 8)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.seo_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  question TEXT NOT NULL DEFAULT '',
  cluster_name TEXT NOT NULL DEFAULT 'plant care',
  source TEXT NOT NULL DEFAULT 'roots',
  search_volume_estimate INTEGER NOT NULL DEFAULT 0,
  competition_note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'idea',
  keyword_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_seo_topics_topic ON public.seo_topics(topic);
CREATE INDEX IF NOT EXISTS idx_seo_topics_status ON public.seo_topics(status);

DROP TRIGGER IF EXISTS seo_topics_updated_at ON public.seo_topics;
CREATE TRIGGER seo_topics_updated_at
  BEFORE UPDATE ON public.seo_topics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.seo_rank_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID,
  keyword TEXT NOT NULL,
  position INTEGER,
  url TEXT NOT NULL DEFAULT '',
  search_engine TEXT NOT NULL DEFAULT 'google',
  source TEXT NOT NULL DEFAULT 'serpapi',
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_seo_rank_tracking_keyword ON public.seo_rank_tracking(keyword, checked_at DESC);

ALTER TABLE public.seo_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_rank_tracking ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_seo_clusters" ON public.seo_clusters;
CREATE POLICY "marketing_os_all_seo_clusters" ON public.seo_clusters FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "marketing_os_all_seo_topics" ON public.seo_topics;
CREATE POLICY "marketing_os_all_seo_topics" ON public.seo_topics FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "marketing_os_all_seo_rank_tracking" ON public.seo_rank_tracking;
CREATE POLICY "marketing_os_all_seo_rank_tracking" ON public.seo_rank_tracking FOR ALL USING (true) WITH CHECK (true);

-- seo_posts is the canonical name from the Phase 31 spec; 050 already created
-- the real table as seo_blog_posts. Expose a compatibility view.
CREATE OR REPLACE VIEW public.seo_posts AS SELECT * FROM public.seo_blog_posts;

-- ===========================================================================
-- STEP 7 — Reddit Engine (builds on 049). Add engagement tracking.
-- ===========================================================================

ALTER TABLE public.reddit_publish_logs ADD COLUMN IF NOT EXISTS upvotes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.reddit_publish_logs ADD COLUMN IF NOT EXISTS engagement_note TEXT NOT NULL DEFAULT '';
ALTER TABLE public.reddit_publish_logs ADD COLUMN IF NOT EXISTS reply_url TEXT NOT NULL DEFAULT '';
ALTER TABLE public.reddit_reply_drafts ADD COLUMN IF NOT EXISTS risk_score INTEGER NOT NULL DEFAULT 0;

-- Spec-name compatibility views over the 049 tables
CREATE OR REPLACE VIEW public.reddit_monitor AS SELECT * FROM public.reddit_opportunities;
CREATE OR REPLACE VIEW public.reddit_drafts AS SELECT * FROM public.reddit_reply_drafts;
CREATE OR REPLACE VIEW public.reddit_approvals AS
  SELECT * FROM public.reddit_reply_drafts WHERE status IN ('pending_approval', 'draft');

-- ===========================================================================
-- STEP 8 — Agent performance scorecards
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.agent_scorecards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  period TEXT NOT NULL DEFAULT 'daily',
  period_start DATE NOT NULL DEFAULT CURRENT_DATE,
  metric_label TEXT NOT NULL DEFAULT '',
  metric_value NUMERIC NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.agent_scorecards DROP CONSTRAINT IF EXISTS agent_scorecards_period_check;
ALTER TABLE public.agent_scorecards
  ADD CONSTRAINT agent_scorecards_period_check
  CHECK (period IN ('daily', 'weekly', 'monthly'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_scorecards_unique
  ON public.agent_scorecards(agent_id, period, period_start);

DROP TRIGGER IF EXISTS agent_scorecards_updated_at ON public.agent_scorecards;
CREATE TRIGGER agent_scorecards_updated_at
  BEFORE UPDATE ON public.agent_scorecards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.agent_scorecards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_agent_scorecards" ON public.agent_scorecards;
CREATE POLICY "marketing_os_all_agent_scorecards" ON public.agent_scorecards FOR ALL USING (true) WITH CHECK (true);

-- ===========================================================================
-- STEP 10 — Launch checklist
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.launch_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_key TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'core',
  status TEXT NOT NULL DEFAULT 'pending',
  score_weight INTEGER NOT NULL DEFAULT 10,
  notes TEXT NOT NULL DEFAULT '',
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.launch_checklist DROP CONSTRAINT IF EXISTS launch_checklist_status_check;
ALTER TABLE public.launch_checklist
  ADD CONSTRAINT launch_checklist_status_check
  CHECK (status IN ('pending', 'ready', 'blocked'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_launch_checklist_key ON public.launch_checklist(item_key);

DROP TRIGGER IF EXISTS launch_checklist_updated_at ON public.launch_checklist;
CREATE TRIGGER launch_checklist_updated_at
  BEFORE UPDATE ON public.launch_checklist
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.launch_checklist (item_key, label, category, score_weight) VALUES
  ('daily_brief', 'Daily Brief generates with all sections', 'core', 15),
  ('calendar', 'Content Calendar has scheduled items', 'core', 15),
  ('approvals', 'Approval flow processes items end to end', 'core', 15),
  ('seo_factory', 'SEO Factory produces voice-checked drafts', 'content', 12),
  ('reddit_engine', 'Reddit Engine connected with safety rules', 'content', 10),
  ('creative_department', 'Fern Creative Department produces assets', 'content', 10),
  ('founder_mode', 'Founder Mode loads all sections', 'core', 8),
  ('analytics', 'Analytics dashboard renders without crashes', 'observability', 5),
  ('agent_health', 'All scheduled agents healthy (no failed status)', 'agents', 5),
  ('api_health', 'Required API keys configured (OpenAI minimum)', 'infrastructure', 5)
ON CONFLICT (item_key) DO NOTHING;

ALTER TABLE public.launch_checklist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_launch_checklist" ON public.launch_checklist;
CREATE POLICY "marketing_os_all_launch_checklist" ON public.launch_checklist FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
