-- PlantPal Marketing OS — Phase 26: Autonomous publishing workflows + human approval gates
-- Tables: automation_rules, automation_runs, publishing_packages, batch_approvals. Safe to re-run.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- automation_rules — risk levels + auto/batch/human approval per workflow
-- ============================================================
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  agent_id TEXT NOT NULL DEFAULT 'ivy',
  category TEXT NOT NULL DEFAULT 'general',
  risk_level TEXT NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
  action TEXT NOT NULL DEFAULT 'batch_approval' CHECK (
    action IN ('auto_approve', 'batch_approval', 'human_approval')
  ),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_risk ON public.automation_rules(risk_level);
CREATE INDEX IF NOT EXISTS idx_automation_rules_enabled ON public.automation_rules(enabled);

DROP TRIGGER IF EXISTS automation_rules_updated_at ON public.automation_rules;
CREATE TRIGGER automation_rules_updated_at
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_automation_rules" ON public.automation_rules;
CREATE POLICY "marketing_os_all_automation_rules" ON public.automation_rules
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- automation_runs — every automated workflow execution
-- ============================================================
CREATE TABLE IF NOT EXISTS public.automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key TEXT NOT NULL DEFAULT '',
  agent_id TEXT NOT NULL DEFAULT 'ivy',
  action TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'completed' CHECK (
    status IN ('running', 'completed', 'failed', 'skipped')
  ),
  items_processed INTEGER NOT NULL DEFAULT 0,
  items_created INTEGER NOT NULL DEFAULT 0,
  detail TEXT NOT NULL DEFAULT '',
  error_message TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_runs_created ON public.automation_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_runs_status ON public.automation_runs(status);
CREATE INDEX IF NOT EXISTS idx_automation_runs_agent ON public.automation_runs(agent_id);

ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_automation_runs" ON public.automation_runs;
CREATE POLICY "marketing_os_all_automation_runs" ON public.automation_runs
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- publishing_packages — one-click / copy-paste ready package per calendar item
-- ============================================================
CREATE TABLE IF NOT EXISTS public.publishing_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_item_id UUID NOT NULL REFERENCES public.content_calendar(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'x',
  caption TEXT NOT NULL DEFAULT '',
  script TEXT NOT NULL DEFAULT '',
  hashtags JSONB NOT NULL DEFAULT '[]'::jsonb,
  asset_prompt TEXT NOT NULL DEFAULT '',
  asset_url TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT NOT NULL DEFAULT '',
  upload_checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_post_time TEXT NOT NULL DEFAULT '',
  recommended_post_at TIMESTAMPTZ,
  platform_notes TEXT NOT NULL DEFAULT '',
  copy_text TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'ready' CHECK (
    status IN ('ready', 'needs_asset', 'published', 'archived')
  ),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_publishing_packages_item ON public.publishing_packages(calendar_item_id);
CREATE INDEX IF NOT EXISTS idx_publishing_packages_status ON public.publishing_packages(status);
CREATE INDEX IF NOT EXISTS idx_publishing_packages_platform ON public.publishing_packages(platform);

DROP TRIGGER IF EXISTS publishing_packages_updated_at ON public.publishing_packages;
CREATE TRIGGER publishing_packages_updated_at
  BEFORE UPDATE ON public.publishing_packages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.publishing_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_publishing_packages" ON public.publishing_packages;
CREATE POLICY "marketing_os_all_publishing_packages" ON public.publishing_packages
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- batch_approvals — daily "Review Today's Work" inbox items
-- ============================================================
CREATE TABLE IF NOT EXISTS public.batch_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_date DATE NOT NULL DEFAULT CURRENT_DATE,
  item_type TEXT NOT NULL DEFAULT 'other' CHECK (
    item_type IN ('x_post', 'tiktok_package', 'instagram_package', 'youtube_package', 'reddit_reply', 'blog_draft', 'creator_outreach', 'other')
  ),
  risk_level TEXT NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
  platform TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  source_table TEXT NOT NULL DEFAULT '',
  source_id UUID,
  calendar_item_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected', 'edited', 'sent_back')
  ),
  decided_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One inbox entry per source record per day — keeps the daily build idempotent
-- (non-partial so PostgREST upsert ON CONFLICT can target it; NULL source_ids never collide)
CREATE UNIQUE INDEX IF NOT EXISTS idx_batch_approvals_source
  ON public.batch_approvals(batch_date, source_table, source_id);
CREATE INDEX IF NOT EXISTS idx_batch_approvals_date ON public.batch_approvals(batch_date DESC);
CREATE INDEX IF NOT EXISTS idx_batch_approvals_status ON public.batch_approvals(status);

DROP TRIGGER IF EXISTS batch_approvals_updated_at ON public.batch_approvals;
CREATE TRIGGER batch_approvals_updated_at
  BEFORE UPDATE ON public.batch_approvals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.batch_approvals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_batch_approvals" ON public.batch_approvals;
CREATE POLICY "marketing_os_all_batch_approvals" ON public.batch_approvals
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Seed automation rules (ON CONFLICT keeps founder's toggles)
-- ============================================================
INSERT INTO public.automation_rules (rule_key, label, description, agent_id, category, risk_level, action) VALUES
  -- LOW RISK — auto-approved
  ('internal_reports',    'Internal reports & briefs',      'Daily reports and executive briefs generate automatically — no approval needed.', 'ivy',    'reporting',  'low', 'auto_approve'),
  ('content_ideas',       'Content ideas & discovery',      'Scout/Roots/Sentinel/Weather opportunities flow into Bloom automatically.',       'bloom',  'discovery',  'low', 'auto_approve'),
  ('calendar_scheduling', 'Calendar scheduling',            'Approved content is auto-assigned the best posting time slot.',                   'sprout', 'scheduling', 'low', 'auto_approve'),
  ('content_drafts',      'Content drafts',                 'Bloom drafts are auto-created on the content calendar for review.',               'bloom',  'production', 'low', 'auto_approve'),
  ('asset_prompts',       'Asset prompts',                  'Asset/thumbnail prompts are auto-generated inside publishing packages.',          'bloom',  'production', 'low', 'auto_approve'),
  -- MEDIUM RISK — batch approval
  ('tiktok_captions',     'TikTok captions & scripts',      'TikTok packages wait in the daily batch approval inbox.',                         'bloom',  'publishing', 'medium', 'batch_approval'),
  ('instagram_captions',  'Instagram captions & carousels', 'Instagram packages wait in the daily batch approval inbox.',                      'bloom',  'publishing', 'medium', 'batch_approval'),
  ('youtube_titles',      'YouTube Shorts titles',          'YouTube Shorts packages wait in the daily batch approval inbox.',                 'bloom',  'publishing', 'medium', 'batch_approval'),
  ('blog_drafts',         'Blog drafts',                    'Blog drafts wait in the daily batch approval inbox.',                             'bloom',  'publishing', 'medium', 'batch_approval'),
  -- HIGH RISK — final human approval required
  ('public_replies',      'Public replies',                 'Replies to public posts always require explicit human approval.',                 'roots',  'community',  'high', 'human_approval'),
  ('reddit_comments',     'Reddit comments',                'Reddit replies always require explicit human approval. No auto-posting.',         'roots',  'community',  'high', 'human_approval'),
  ('creator_outreach',    'Creator outreach',               'Outreach messages to creators always require explicit human approval.',           'scout',  'outreach',   'high', 'human_approval'),
  ('x_publishing',        'X publishing',                   'X posts publish only after Sage + Gate approval and a final human click.',        'gate',   'publishing', 'high', 'human_approval'),
  ('brand_sensitive',     'Brand-sensitive content',        'Anything controversial or brand-sensitive requires founder approval.',            'gate',   'publishing', 'high', 'human_approval')
ON CONFLICT (rule_key) DO NOTHING;

NOTIFY pgrst, 'reload schema';
