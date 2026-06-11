-- PlantPal Marketing OS — Phase 33: mobile + pipeline repair
-- ONE consolidated, safe-to-rerun migration that creates or repairs every
-- table production has reported missing:
--   ivy_briefs, ivy_recommendations, ivy_alerts,
--   agent_profiles, agent_memory, agent_conversations, agent_decisions,
--   pipeline_content, generated_assets, generated_videos, content_feedback,
--   automation_rules, automation_runs, publishing_packages, batch_approvals,
--   creative_content_ideas,
--   company_workflows, workflow_steps, company_outputs, company_decisions,
--   company_bottlenecks
-- Plus Phase 33 additions: source link + data_source columns for
-- approval_queue, reddit_opportunities, community_opportunities.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
-- 1. ivy_briefs + ivy_recommendations + ivy_alerts
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.ivy_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_type TEXT NOT NULL DEFAULT 'daily',
  run_date DATE NOT NULL DEFAULT CURRENT_DATE,
  executive_summary TEXT NOT NULL DEFAULT '',
  sections JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ivy_briefs ADD COLUMN IF NOT EXISTS brief_type TEXT NOT NULL DEFAULT 'daily';
ALTER TABLE public.ivy_briefs ADD COLUMN IF NOT EXISTS run_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE public.ivy_briefs ADD COLUMN IF NOT EXISTS executive_summary TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ivy_briefs ADD COLUMN IF NOT EXISTS sections JSONB NOT NULL DEFAULT '{}';
ALTER TABLE public.ivy_briefs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_ivy_briefs_type_date ON public.ivy_briefs(brief_type, run_date DESC);

DROP TRIGGER IF EXISTS ivy_briefs_updated_at ON public.ivy_briefs;
CREATE TRIGGER ivy_briefs_updated_at
  BEFORE UPDATE ON public.ivy_briefs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.ivy_briefs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_ivy_briefs" ON public.ivy_briefs;
CREATE POLICY "marketing_os_all_ivy_briefs" ON public.ivy_briefs FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.ivy_briefs (brief_type, run_date, executive_summary, sections)
SELECT 'daily', CURRENT_DATE,
  'Ivy reviewed all agents. Run the Ivy agent to replace this seed brief with live data.',
  '{"seed": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.ivy_briefs);

CREATE TABLE IF NOT EXISTS public.ivy_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL DEFAULT 'roi_action',
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  priority_score INTEGER NOT NULL DEFAULT 50,
  revenue_impact INTEGER NOT NULL DEFAULT 0,
  growth_impact INTEGER NOT NULL DEFAULT 0,
  virality_potential INTEGER NOT NULL DEFAULT 0,
  time_sensitivity INTEGER NOT NULL DEFAULT 0,
  source_agent TEXT NOT NULL DEFAULT '',
  source_entity_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  brief_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ivy_recommendations_date ON public.ivy_recommendations(brief_date DESC, priority_score DESC);

DROP TRIGGER IF EXISTS ivy_recommendations_updated_at ON public.ivy_recommendations;
CREATE TRIGGER ivy_recommendations_updated_at
  BEFORE UPDATE ON public.ivy_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.ivy_recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_ivy_recommendations" ON public.ivy_recommendations;
CREATE POLICY "marketing_os_all_ivy_recommendations" ON public.ivy_recommendations FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.ivy_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL DEFAULT 'urgent',
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  priority_score INTEGER NOT NULL DEFAULT 50,
  source_agent TEXT NOT NULL DEFAULT '',
  source_entity_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  brief_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ivy_alerts_date ON public.ivy_alerts(brief_date DESC, priority_score DESC);

DROP TRIGGER IF EXISTS ivy_alerts_updated_at ON public.ivy_alerts;
CREATE TRIGGER ivy_alerts_updated_at
  BEFORE UPDATE ON public.ivy_alerts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.ivy_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_ivy_alerts" ON public.ivy_alerts;
CREATE POLICY "marketing_os_all_ivy_alerts" ON public.ivy_alerts FOR ALL USING (true) WITH CHECK (true);

-- ===========================================================================
-- 2. agent brain: agent_profiles, agent_memory, agent_conversations, agent_decisions
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.agent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT '',
  goal TEXT NOT NULL DEFAULT '',
  responsibilities TEXT[] NOT NULL DEFAULT '{}',
  system_prompt TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS agent_profiles_updated_at ON public.agent_profiles;
CREATE TRIGGER agent_profiles_updated_at
  BEFORE UPDATE ON public.agent_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.agent_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_agent_profiles" ON public.agent_profiles;
CREATE POLICY "marketing_os_all_agent_profiles" ON public.agent_profiles FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  memory_key TEXT NOT NULL,
  memory_value TEXT NOT NULL DEFAULT '',
  memory_type TEXT NOT NULL DEFAULT 'fact',
  importance INTEGER NOT NULL DEFAULT 50,
  source_run_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (agent_id, memory_key)
);

CREATE INDEX IF NOT EXISTS idx_agent_memory_agent ON public.agent_memory(agent_id, importance DESC);

DROP TRIGGER IF EXISTS agent_memory_updated_at ON public.agent_memory;
CREATE TRIGGER agent_memory_updated_at
  BEFORE UPDATE ON public.agent_memory
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_agent_memory" ON public.agent_memory;
CREATE POLICY "marketing_os_all_agent_memory" ON public.agent_memory FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  run_id UUID NOT NULL DEFAULT gen_random_uuid(),
  role TEXT NOT NULL DEFAULT 'assistant',
  content TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT 'gpt-4o',
  tokens_used INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.agent_conversations ADD COLUMN IF NOT EXISTS agent_id TEXT NOT NULL DEFAULT 'ivy';
ALTER TABLE public.agent_conversations ADD COLUMN IF NOT EXISTS run_id UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.agent_conversations ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'assistant';
ALTER TABLE public.agent_conversations ADD COLUMN IF NOT EXISTS content TEXT NOT NULL DEFAULT '';
ALTER TABLE public.agent_conversations ADD COLUMN IF NOT EXISTS model TEXT NOT NULL DEFAULT 'gpt-4o';
ALTER TABLE public.agent_conversations ADD COLUMN IF NOT EXISTS tokens_used INTEGER;

CREATE INDEX IF NOT EXISTS idx_agent_conversations_run ON public.agent_conversations(run_id, created_at);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_agent ON public.agent_conversations(agent_id, created_at DESC);

ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_agent_conversations" ON public.agent_conversations;
CREATE POLICY "marketing_os_all_agent_conversations" ON public.agent_conversations FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.agent_conversations (agent_id, role, content, model)
SELECT 'ivy', 'assistant',
  'Seed conversation — run any agent with an OpenAI key to record real LLM turns.',
  'gpt-4o'
WHERE NOT EXISTS (SELECT 1 FROM public.agent_conversations);

CREATE TABLE IF NOT EXISTS public.agent_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  run_id UUID NOT NULL DEFAULT gen_random_uuid(),
  conversation_id UUID,
  decision_type TEXT NOT NULL DEFAULT 'recommendation',
  title TEXT NOT NULL DEFAULT '',
  input_summary TEXT NOT NULL DEFAULT '',
  output_json JSONB NOT NULL DEFAULT '{}',
  reasoning TEXT NOT NULL DEFAULT '',
  confidence INTEGER NOT NULL DEFAULT 70,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_decisions_agent ON public.agent_decisions(agent_id, created_at DESC);

DROP TRIGGER IF EXISTS agent_decisions_updated_at ON public.agent_decisions;
CREATE TRIGGER agent_decisions_updated_at
  BEFORE UPDATE ON public.agent_decisions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.agent_decisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_agent_decisions" ON public.agent_decisions;
CREATE POLICY "marketing_os_all_agent_decisions" ON public.agent_decisions FOR ALL USING (true) WITH CHECK (true);

-- ===========================================================================
-- 3. pipeline_content
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.pipeline_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID,
  platform TEXT NOT NULL DEFAULT 'tiktok',
  format TEXT NOT NULL DEFAULT 'video_script',
  hook TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  cta TEXT NOT NULL DEFAULT '',
  viral_score INTEGER NOT NULL DEFAULT 50,
  originality_score INTEGER NOT NULL DEFAULT 0,
  humor_score INTEGER NOT NULL DEFAULT 0,
  emotional_impact_score INTEGER NOT NULL DEFAULT 0,
  shareability_score INTEGER NOT NULL DEFAULT 0,
  educational_score INTEGER NOT NULL DEFAULT 0,
  aggregate_score INTEGER NOT NULL DEFAULT 0,
  director_notes TEXT NOT NULL DEFAULT '',
  rewrite_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending_review',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pipeline_content DROP CONSTRAINT IF EXISTS pipeline_content_status_check;
ALTER TABLE public.pipeline_content
  ADD CONSTRAINT pipeline_content_status_check
  CHECK (status IN ('pending_review', 'approved', 'rejected', 'needs_rewrite'));

CREATE INDEX IF NOT EXISTS idx_pipeline_brief ON public.pipeline_content(brief_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_status ON public.pipeline_content(status);

DROP TRIGGER IF EXISTS pipeline_content_updated_at ON public.pipeline_content;
CREATE TRIGGER pipeline_content_updated_at
  BEFORE UPDATE ON public.pipeline_content
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.pipeline_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_pipeline_content" ON public.pipeline_content;
CREATE POLICY "marketing_os_all_pipeline_content" ON public.pipeline_content FOR ALL USING (true) WITH CHECK (true);

-- ===========================================================================
-- 4. generated_assets (image review pipeline)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.generated_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID,
  calendar_item_id UUID,
  platform TEXT NOT NULL DEFAULT 'instagram',
  asset_type TEXT NOT NULL DEFAULT 'image',
  image_url TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT NOT NULL DEFAULT '',
  generation_provider TEXT NOT NULL DEFAULT 'none',
  generation_model TEXT NOT NULL DEFAULT '',
  prompt TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending_generation',
  review_feedback TEXT NOT NULL DEFAULT '',
  revision_notes TEXT NOT NULL DEFAULT '',
  selected BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.generated_assets ADD COLUMN IF NOT EXISTS prompt_id UUID;
ALTER TABLE public.generated_assets ADD COLUMN IF NOT EXISTS calendar_item_id UUID;
ALTER TABLE public.generated_assets ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '';
ALTER TABLE public.generated_assets ADD COLUMN IF NOT EXISTS thumbnail_url TEXT NOT NULL DEFAULT '';
ALTER TABLE public.generated_assets ADD COLUMN IF NOT EXISTS generation_provider TEXT NOT NULL DEFAULT 'none';
ALTER TABLE public.generated_assets ADD COLUMN IF NOT EXISTS generation_model TEXT NOT NULL DEFAULT '';
ALTER TABLE public.generated_assets ADD COLUMN IF NOT EXISTS prompt TEXT NOT NULL DEFAULT '';
ALTER TABLE public.generated_assets ADD COLUMN IF NOT EXISTS review_feedback TEXT NOT NULL DEFAULT '';
ALTER TABLE public.generated_assets ADD COLUMN IF NOT EXISTS revision_notes TEXT NOT NULL DEFAULT '';
ALTER TABLE public.generated_assets ADD COLUMN IF NOT EXISTS selected BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.generated_assets ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';

ALTER TABLE public.generated_assets DROP CONSTRAINT IF EXISTS generated_assets_status_check;
ALTER TABLE public.generated_assets
  ADD CONSTRAINT generated_assets_status_check
  CHECK (status IN ('pending_generation', 'package_ready', 'generating', 'generated', 'approved', 'rejected', 'needs_revision', 'scheduled', 'published'));

CREATE INDEX IF NOT EXISTS idx_generated_assets_prompt ON public.generated_assets(prompt_id);
CREATE INDEX IF NOT EXISTS idx_generated_assets_status ON public.generated_assets(status, created_at DESC);

DROP TRIGGER IF EXISTS generated_assets_updated_at ON public.generated_assets;
CREATE TRIGGER generated_assets_updated_at
  BEFORE UPDATE ON public.generated_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.generated_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_generated_assets" ON public.generated_assets;
CREATE POLICY "marketing_os_all_generated_assets" ON public.generated_assets FOR ALL USING (true) WITH CHECK (true);

-- ===========================================================================
-- 5. generated_videos (video review pipeline)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.generated_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID,
  calendar_item_id UUID,
  platform TEXT NOT NULL DEFAULT 'tiktok',
  video_url TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT NOT NULL DEFAULT '',
  script TEXT NOT NULL DEFAULT '',
  hook TEXT NOT NULL DEFAULT '',
  scenes JSONB NOT NULL DEFAULT '[]',
  voiceover TEXT NOT NULL DEFAULT '',
  on_screen_text JSONB NOT NULL DEFAULT '[]',
  caption TEXT NOT NULL DEFAULT '',
  cta TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'script_draft',
  review_feedback TEXT NOT NULL DEFAULT '',
  revision_notes TEXT NOT NULL DEFAULT '',
  generation_provider TEXT NOT NULL DEFAULT 'none',
  generation_model TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.generated_videos ADD COLUMN IF NOT EXISTS script_id UUID;
ALTER TABLE public.generated_videos ADD COLUMN IF NOT EXISTS calendar_item_id UUID;
ALTER TABLE public.generated_videos ADD COLUMN IF NOT EXISTS video_url TEXT NOT NULL DEFAULT '';
ALTER TABLE public.generated_videos ADD COLUMN IF NOT EXISTS thumbnail_url TEXT NOT NULL DEFAULT '';
ALTER TABLE public.generated_videos ADD COLUMN IF NOT EXISTS scenes JSONB NOT NULL DEFAULT '[]';
ALTER TABLE public.generated_videos ADD COLUMN IF NOT EXISTS voiceover TEXT NOT NULL DEFAULT '';
ALTER TABLE public.generated_videos ADD COLUMN IF NOT EXISTS on_screen_text JSONB NOT NULL DEFAULT '[]';
ALTER TABLE public.generated_videos ADD COLUMN IF NOT EXISTS review_feedback TEXT NOT NULL DEFAULT '';
ALTER TABLE public.generated_videos ADD COLUMN IF NOT EXISTS revision_notes TEXT NOT NULL DEFAULT '';
ALTER TABLE public.generated_videos ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';

ALTER TABLE public.generated_videos DROP CONSTRAINT IF EXISTS generated_videos_status_check;
ALTER TABLE public.generated_videos
  ADD CONSTRAINT generated_videos_status_check
  CHECK (status IN ('script_draft', 'script_approved', 'package_ready', 'pending_generation', 'generating', 'generated', 'approved', 'rejected', 'needs_revision', 'scheduled', 'published'));

CREATE INDEX IF NOT EXISTS idx_generated_videos_script ON public.generated_videos(script_id);
CREATE INDEX IF NOT EXISTS idx_generated_videos_status ON public.generated_videos(status, created_at DESC);

DROP TRIGGER IF EXISTS generated_videos_updated_at ON public.generated_videos;
CREATE TRIGGER generated_videos_updated_at
  BEFORE UPDATE ON public.generated_videos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.generated_videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_generated_videos" ON public.generated_videos;
CREATE POLICY "marketing_os_all_generated_videos" ON public.generated_videos FOR ALL USING (true) WITH CHECK (true);

-- ===========================================================================
-- 6. content_feedback (founder feedback loop)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.content_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table TEXT NOT NULL DEFAULT 'approval_queue',
  source_id UUID,
  calendar_item_id UUID,
  decision TEXT NOT NULL DEFAULT 'approved',
  feedback_category TEXT NOT NULL DEFAULT 'approved as-is',
  feedback_text TEXT NOT NULL DEFAULT '',
  sent_back_to_agent TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL DEFAULT 'founder',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.content_feedback ADD COLUMN IF NOT EXISTS content_id UUID;
ALTER TABLE public.content_feedback ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'content';
ALTER TABLE public.content_feedback ADD COLUMN IF NOT EXISTS agent_id TEXT NOT NULL DEFAULT '';
ALTER TABLE public.content_feedback ADD COLUMN IF NOT EXISTS feedback_type TEXT NOT NULL DEFAULT 'review';

ALTER TABLE public.content_feedback DROP CONSTRAINT IF EXISTS content_feedback_decision_check;
ALTER TABLE public.content_feedback
  ADD CONSTRAINT content_feedback_decision_check
  CHECK (decision IN ('approved', 'approved_with_note', 'rejected', 'revision_requested', 'edit_requested', 'note'));

CREATE INDEX IF NOT EXISTS idx_content_feedback_content ON public.content_feedback(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_feedback_agent_id ON public.content_feedback(agent_id, created_at DESC);

ALTER TABLE public.content_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_content_feedback" ON public.content_feedback;
CREATE POLICY "marketing_os_all_content_feedback" ON public.content_feedback FOR ALL USING (true) WITH CHECK (true);

-- ===========================================================================
-- 7. automation: automation_rules, automation_runs, publishing_packages, batch_approvals
-- ===========================================================================
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

DROP TRIGGER IF EXISTS automation_rules_updated_at ON public.automation_rules;
CREATE TRIGGER automation_rules_updated_at
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_automation_rules" ON public.automation_rules;
CREATE POLICY "marketing_os_all_automation_rules" ON public.automation_rules FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.automation_rules (rule_key, label, description, agent_id, category, risk_level, action) VALUES
  ('internal_reports',    'Internal reports & briefs',      'Daily reports and executive briefs generate automatically — no approval needed.', 'ivy',    'reporting',  'low', 'auto_approve'),
  ('content_ideas',       'Content ideas & discovery',      'Scout/Roots/Sentinel/Weather opportunities flow into Bloom automatically.',       'bloom',  'discovery',  'low', 'auto_approve'),
  ('calendar_scheduling', 'Calendar scheduling',            'Approved content is auto-assigned the best posting time slot.',                   'sprout', 'scheduling', 'low', 'auto_approve'),
  ('content_drafts',      'Content drafts',                 'Bloom drafts are auto-created on the content calendar for review.',               'bloom',  'production', 'low', 'auto_approve'),
  ('asset_prompts',       'Asset prompts',                  'Asset/thumbnail prompts are auto-generated inside publishing packages.',          'bloom',  'production', 'low', 'auto_approve'),
  ('tiktok_captions',     'TikTok captions & scripts',      'TikTok packages wait in the daily batch approval inbox.',                         'bloom',  'publishing', 'medium', 'batch_approval'),
  ('instagram_captions',  'Instagram captions & carousels', 'Instagram packages wait in the daily batch approval inbox.',                      'bloom',  'publishing', 'medium', 'batch_approval'),
  ('youtube_titles',      'YouTube Shorts titles',          'YouTube Shorts packages wait in the daily batch approval inbox.',                 'bloom',  'publishing', 'medium', 'batch_approval'),
  ('blog_drafts',         'Blog drafts',                    'Blog drafts wait in the daily batch approval inbox.',                             'bloom',  'publishing', 'medium', 'batch_approval'),
  ('public_replies',      'Public replies',                 'Replies to public posts always require explicit human approval.',                 'roots',  'community',  'high', 'human_approval'),
  ('reddit_comments',     'Reddit comments',                'Reddit replies always require explicit human approval. No auto-posting.',         'roots',  'community',  'high', 'human_approval'),
  ('creator_outreach',    'Creator outreach',               'Outreach messages to creators always require explicit human approval.',           'scout',  'outreach',   'high', 'human_approval'),
  ('x_publishing',        'X publishing',                   'X posts publish only after Sage + Gate approval and a final human click.',        'gate',   'publishing', 'high', 'human_approval'),
  ('brand_sensitive',     'Brand-sensitive content',        'Anything controversial or brand-sensitive requires founder approval.',            'gate',   'publishing', 'high', 'human_approval')
ON CONFLICT (rule_key) DO NOTHING;

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

ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_automation_runs" ON public.automation_runs;
CREATE POLICY "marketing_os_all_automation_runs" ON public.automation_runs FOR ALL USING (true) WITH CHECK (true);

-- publishing_packages without the FK so this migration works standalone
CREATE TABLE IF NOT EXISTS public.publishing_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_item_id UUID NOT NULL,
  platform TEXT NOT NULL DEFAULT '',
  package_type TEXT NOT NULL DEFAULT 'social_post',
  title TEXT NOT NULL DEFAULT '',
  hook TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  cta TEXT NOT NULL DEFAULT '',
  asset_prompt TEXT NOT NULL DEFAULT '',
  thumbnail_prompt TEXT NOT NULL DEFAULT '',
  video_script TEXT NOT NULL DEFAULT '',
  upload_checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_post_time TEXT NOT NULL DEFAULT '',
  recommended_post_at TIMESTAMPTZ,
  platform_notes TEXT NOT NULL DEFAULT '',
  copy_text TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'ready',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_publishing_packages_item ON public.publishing_packages(calendar_item_id);

DROP TRIGGER IF EXISTS publishing_packages_updated_at ON public.publishing_packages;
CREATE TRIGGER publishing_packages_updated_at
  BEFORE UPDATE ON public.publishing_packages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.publishing_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_publishing_packages" ON public.publishing_packages;
CREATE POLICY "marketing_os_all_publishing_packages" ON public.publishing_packages FOR ALL USING (true) WITH CHECK (true);

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
CREATE POLICY "marketing_os_all_batch_approvals" ON public.batch_approvals FOR ALL USING (true) WITH CHECK (true);

-- ===========================================================================
-- 8. creative_content_ideas (Creative Content Engine)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.creative_content_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL DEFAULT 'educational',
  format TEXT NOT NULL DEFAULT 'tiktok',
  hook TEXT NOT NULL DEFAULT '',
  emotional_trigger TEXT NOT NULL DEFAULT '',
  why_it_works TEXT NOT NULL DEFAULT '',
  cta TEXT NOT NULL DEFAULT '',
  difficulty_score INTEGER NOT NULL DEFAULT 50,
  viral_score INTEGER NOT NULL DEFAULT 50,
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  generation_batch_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Phase 33 routing fields (pipeline + calendar integration)
ALTER TABLE public.creative_content_ideas ADD COLUMN IF NOT EXISTS output_format TEXT NOT NULL DEFAULT '';
ALTER TABLE public.creative_content_ideas ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT '';
ALTER TABLE public.creative_content_ideas ADD COLUMN IF NOT EXISTS creative_brief TEXT NOT NULL DEFAULT '';
ALTER TABLE public.creative_content_ideas ADD COLUMN IF NOT EXISTS angle TEXT NOT NULL DEFAULT '';
ALTER TABLE public.creative_content_ideas ADD COLUMN IF NOT EXISTS caption TEXT NOT NULL DEFAULT '';
ALTER TABLE public.creative_content_ideas ADD COLUMN IF NOT EXISTS script TEXT NOT NULL DEFAULT '';
ALTER TABLE public.creative_content_ideas ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT '';
ALTER TABLE public.creative_content_ideas ADD COLUMN IF NOT EXISTS source_agent TEXT NOT NULL DEFAULT 'bloom';
ALTER TABLE public.creative_content_ideas ADD COLUMN IF NOT EXISTS risk_level TEXT NOT NULL DEFAULT 'low';
ALTER TABLE public.creative_content_ideas ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.creative_content_ideas ADD COLUMN IF NOT EXISTS calendar_item_id UUID;
ALTER TABLE public.creative_content_ideas ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_creative_ideas_status ON public.creative_content_ideas(status, viral_score DESC);

DROP TRIGGER IF EXISTS creative_content_ideas_updated_at ON public.creative_content_ideas;
CREATE TRIGGER creative_content_ideas_updated_at
  BEFORE UPDATE ON public.creative_content_ideas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.creative_content_ideas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_creative_content_ideas" ON public.creative_content_ideas;
CREATE POLICY "marketing_os_all_creative_content_ideas" ON public.creative_content_ideas FOR ALL USING (true) WITH CHECK (true);

-- ===========================================================================
-- 9. Company OS (from 052, repeated so production catches up in one run)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.company_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_type TEXT NOT NULL DEFAULT 'content_creation',
  workflow_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  priority TEXT NOT NULL DEFAULT 'medium',
  source_agent TEXT NOT NULL DEFAULT '',
  current_agent TEXT NOT NULL DEFAULT '',
  next_agent TEXT NOT NULL DEFAULT '',
  trigger_id TEXT NOT NULL DEFAULT '',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  blocked_at TIMESTAMPTZ,
  blocker_reason TEXT NOT NULL DEFAULT '',
  outcome TEXT NOT NULL DEFAULT '',
  impact_score INTEGER NOT NULL DEFAULT 50,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.company_workflows ADD COLUMN IF NOT EXISTS trigger_id TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_company_workflows_status ON public.company_workflows(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_workflows_trigger ON public.company_workflows(workflow_type, trigger_id);

DROP TRIGGER IF EXISTS company_workflows_updated_at ON public.company_workflows;
CREATE TRIGGER company_workflows_updated_at
  BEFORE UPDATE ON public.company_workflows
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL,
  step_order INTEGER NOT NULL DEFAULT 1,
  step_name TEXT NOT NULL DEFAULT '',
  agent_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  input_summary TEXT NOT NULL DEFAULT '',
  output_summary TEXT NOT NULL DEFAULT '',
  blocker_reason TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow ON public.workflow_steps(workflow_id, step_order);

DROP TRIGGER IF EXISTS workflow_steps_updated_at ON public.workflow_steps;
CREATE TRIGGER workflow_steps_updated_at
  BEFORE UPDATE ON public.workflow_steps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.company_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID,
  agent_id TEXT NOT NULL DEFAULT '',
  output_type TEXT NOT NULL DEFAULT 'content',
  title TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  source_table TEXT NOT NULL DEFAULT '',
  source_id TEXT NOT NULL DEFAULT '',
  target_table TEXT NOT NULL DEFAULT '',
  target_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'created',
  risk_level TEXT NOT NULL DEFAULT 'low',
  approval_required BOOLEAN NOT NULL DEFAULT TRUE,
  published_url TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_outputs_workflow ON public.company_outputs(workflow_id, created_at DESC);

DROP TRIGGER IF EXISTS company_outputs_updated_at ON public.company_outputs;
CREATE TRIGGER company_outputs_updated_at
  BEFORE UPDATE ON public.company_outputs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.company_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID,
  decision_type TEXT NOT NULL DEFAULT 'approval',
  decision_maker TEXT NOT NULL DEFAULT 'founder',
  decision TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL DEFAULT '',
  feedback TEXT NOT NULL DEFAULT '',
  impact_score INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_decisions_recent ON public.company_decisions(created_at DESC);

CREATE TABLE IF NOT EXISTS public.company_bottlenecks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID,
  agent_id TEXT NOT NULL DEFAULT '',
  bottleneck_type TEXT NOT NULL DEFAULT 'slow_workflow',
  description TEXT NOT NULL DEFAULT '',
  severity TEXT NOT NULL DEFAULT 'medium',
  recommended_fix TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_company_bottlenecks_status ON public.company_bottlenecks(status, created_at DESC);

ALTER TABLE public.company_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_bottlenecks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketing_os_all_company_workflows" ON public.company_workflows;
CREATE POLICY "marketing_os_all_company_workflows" ON public.company_workflows FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "marketing_os_all_workflow_steps" ON public.workflow_steps;
CREATE POLICY "marketing_os_all_workflow_steps" ON public.workflow_steps FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "marketing_os_all_company_outputs" ON public.company_outputs;
CREATE POLICY "marketing_os_all_company_outputs" ON public.company_outputs FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "marketing_os_all_company_decisions" ON public.company_decisions;
CREATE POLICY "marketing_os_all_company_decisions" ON public.company_decisions FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "marketing_os_all_company_bottlenecks" ON public.company_bottlenecks;
CREATE POLICY "marketing_os_all_company_bottlenecks" ON public.company_bottlenecks FOR ALL USING (true) WITH CHECK (true);

-- ===========================================================================
-- 10. Phase 33: source links + data_source labeling (real vs demo data)
-- ===========================================================================
ALTER TABLE public.approval_queue ADD COLUMN IF NOT EXISTS source_platform TEXT NOT NULL DEFAULT '';
ALTER TABLE public.approval_queue ADD COLUMN IF NOT EXISTS source_url TEXT NOT NULL DEFAULT '';
ALTER TABLE public.approval_queue ADD COLUMN IF NOT EXISTS source_author TEXT NOT NULL DEFAULT '';
ALTER TABLE public.approval_queue ADD COLUMN IF NOT EXISTS source_author_url TEXT NOT NULL DEFAULT '';
ALTER TABLE public.approval_queue ADD COLUMN IF NOT EXISTS source_title TEXT NOT NULL DEFAULT '';
ALTER TABLE public.approval_queue ADD COLUMN IF NOT EXISTS source_excerpt TEXT NOT NULL DEFAULT '';
ALTER TABLE public.approval_queue ADD COLUMN IF NOT EXISTS data_source TEXT NOT NULL DEFAULT 'manual';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reddit_opportunities') THEN
    ALTER TABLE public.reddit_opportunities ADD COLUMN IF NOT EXISTS data_source TEXT NOT NULL DEFAULT 'seed';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'community_opportunities') THEN
    ALTER TABLE public.community_opportunities ADD COLUMN IF NOT EXISTS source_url TEXT NOT NULL DEFAULT '';
    ALTER TABLE public.community_opportunities ADD COLUMN IF NOT EXISTS data_source TEXT NOT NULL DEFAULT 'seed';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
