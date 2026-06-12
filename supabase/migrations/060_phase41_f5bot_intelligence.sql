-- ============================================================================
-- Phase 41 — F5Bot community intelligence integration
-- Safe to re-run.
-- ============================================================================

-- ── F5Bot alerts ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.f5bot_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT '',
  matched_keyword TEXT NOT NULL DEFAULT '',
  keyword_group TEXT NOT NULL DEFAULT '',
  published_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'new',
  data_source TEXT NOT NULL DEFAULT 'f5bot',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_f5bot_alerts_external_id ON public.f5bot_alerts(external_id);
CREATE INDEX IF NOT EXISTS idx_f5bot_alerts_matched_keyword ON public.f5bot_alerts(matched_keyword);
CREATE INDEX IF NOT EXISTS idx_f5bot_alerts_published_at ON public.f5bot_alerts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_f5bot_alerts_status ON public.f5bot_alerts(status, received_at DESC);

DROP TRIGGER IF EXISTS f5bot_alerts_updated_at ON public.f5bot_alerts;
CREATE TRIGGER f5bot_alerts_updated_at
  BEFORE UPDATE ON public.f5bot_alerts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.f5bot_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_f5bot_alerts" ON public.f5bot_alerts;
CREATE POLICY "marketing_os_all_f5bot_alerts" ON public.f5bot_alerts
  FOR ALL USING (true) WITH CHECK (true);

-- ── Intelligence opportunities ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.intelligence_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL DEFAULT 'f5bot',
  source_table TEXT NOT NULL DEFAULT 'f5bot_alerts',
  source_id UUID NOT NULL,
  platform TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  opportunity_type TEXT NOT NULL DEFAULT 'community_opportunity',
  priority TEXT NOT NULL DEFAULT 'medium',
  recommended_agent TEXT NOT NULL DEFAULT '',
  suggested_action TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  workflow_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_opportunities_status ON public.intelligence_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_intelligence_opportunities_priority ON public.intelligence_opportunities(priority);
CREATE INDEX IF NOT EXISTS idx_intelligence_opportunities_type ON public.intelligence_opportunities(opportunity_type);
CREATE INDEX IF NOT EXISTS idx_intelligence_opportunities_source ON public.intelligence_opportunities(source_table, source_id);

DROP TRIGGER IF EXISTS intelligence_opportunities_updated_at ON public.intelligence_opportunities;
CREATE TRIGGER intelligence_opportunities_updated_at
  BEFORE UPDATE ON public.intelligence_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.intelligence_opportunities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_intelligence_opportunities" ON public.intelligence_opportunities;
CREATE POLICY "marketing_os_all_intelligence_opportunities" ON public.intelligence_opportunities
  FOR ALL USING (true) WITH CHECK (true);

-- ── Moss on agent_tasks (Phase 40 agent) ────────────────────────────────────
ALTER TABLE public.agent_tasks DROP CONSTRAINT IF EXISTS agent_tasks_assigned_agent_check;
ALTER TABLE public.agent_tasks
  ADD CONSTRAINT agent_tasks_assigned_agent_check
  CHECK (assigned_agent IN (
    'scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy',
    'atlas', 'fern', 'echo', 'gate', 'moss'
  ));

ALTER TABLE public.agent_tasks DROP CONSTRAINT IF EXISTS agent_tasks_created_by_check;
ALTER TABLE public.agent_tasks
  ADD CONSTRAINT agent_tasks_created_by_check
  CHECK (created_by IN (
    'scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy',
    'atlas', 'fern', 'echo', 'gate', 'moss'
  ));

-- ── F5Bot notification type ─────────────────────────────────────────────────
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'founder_action', 'agent_completed', 'approval_needed', 'revision_ready',
    'calendar_ready', 'publish_ready', 'video_ready', 'asset_ready',
    'workflow_blocked', 'api_failure', 'storage_failure', 'brand_voice_failed',
    'planty_suggestion', 'f5bot_alert', 'competitor_alert'
  ));

-- ── F5Bot integration status seed ─────────────────────────────────────────────
INSERT INTO public.integration_status (provider, status, configured, metadata)
VALUES ('f5bot', 'disconnected', false, '{"label":"F5Bot Intelligence"}'::jsonb)
ON CONFLICT (provider) DO NOTHING;

NOTIFY pgrst, 'reload schema';
