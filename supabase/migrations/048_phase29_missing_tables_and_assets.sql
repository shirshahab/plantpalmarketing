-- PlantPal Marketing OS — Phase 29: missing tables + image/video asset pipeline
-- Safe to re-run. Fixes:
--   "Could not find the table 'public.ivy_briefs'"
--   "Could not find the table 'public.agent_conversations'"
--   "Could not find the table 'public.pipeline_content'"
-- Adds: generated_assets, generated_videos, content_feedback upgrades.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- 1a. ivy_briefs (from unrun 017) — daily and weekly executive briefings
-- ---------------------------------------------------------------------------
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
ALTER TABLE public.ivy_briefs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.ivy_briefs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.ivy_briefs DROP CONSTRAINT IF EXISTS ivy_briefs_brief_type_check;
ALTER TABLE public.ivy_briefs
  ADD CONSTRAINT ivy_briefs_brief_type_check CHECK (brief_type IN ('daily', 'weekly'));

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

-- ---------------------------------------------------------------------------
-- 1b. ivy_recommendations + ivy_alerts (same unrun migration as ivy_briefs)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 1c. agent_conversations + agent_profiles + agent_memory + agent_decisions
--     (from unrun 027 — Agent Brain page reads all four)
-- ---------------------------------------------------------------------------
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
ALTER TABLE public.agent_conversations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.agent_conversations DROP CONSTRAINT IF EXISTS agent_conversations_role_check;
ALTER TABLE public.agent_conversations
  ADD CONSTRAINT agent_conversations_role_check CHECK (role IN ('system', 'user', 'assistant'));

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

-- ---------------------------------------------------------------------------
-- 1d. pipeline_content (re-included from 047 — calendar stays source of truth)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 2. generated_assets — image generation pipeline (prompt → image → review)
-- ---------------------------------------------------------------------------
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
ALTER TABLE public.generated_assets ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'instagram';
ALTER TABLE public.generated_assets ADD COLUMN IF NOT EXISTS asset_type TEXT NOT NULL DEFAULT 'image';
ALTER TABLE public.generated_assets ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '';
ALTER TABLE public.generated_assets ADD COLUMN IF NOT EXISTS thumbnail_url TEXT NOT NULL DEFAULT '';
ALTER TABLE public.generated_assets ADD COLUMN IF NOT EXISTS generation_provider TEXT NOT NULL DEFAULT 'none';
ALTER TABLE public.generated_assets ADD COLUMN IF NOT EXISTS generation_model TEXT NOT NULL DEFAULT '';
ALTER TABLE public.generated_assets ADD COLUMN IF NOT EXISTS prompt TEXT NOT NULL DEFAULT '';
ALTER TABLE public.generated_assets ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending_generation';
ALTER TABLE public.generated_assets ADD COLUMN IF NOT EXISTS review_feedback TEXT NOT NULL DEFAULT '';
ALTER TABLE public.generated_assets ADD COLUMN IF NOT EXISTS revision_notes TEXT NOT NULL DEFAULT '';
ALTER TABLE public.generated_assets ADD COLUMN IF NOT EXISTS selected BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.generated_assets ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';
ALTER TABLE public.generated_assets ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.generated_assets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.generated_assets DROP CONSTRAINT IF EXISTS generated_assets_status_check;
ALTER TABLE public.generated_assets
  ADD CONSTRAINT generated_assets_status_check
  CHECK (status IN ('pending_generation', 'generating', 'generated', 'approved', 'rejected', 'needs_revision', 'scheduled', 'published'));

CREATE INDEX IF NOT EXISTS idx_generated_assets_prompt ON public.generated_assets(prompt_id);
CREATE INDEX IF NOT EXISTS idx_generated_assets_calendar ON public.generated_assets(calendar_item_id);
CREATE INDEX IF NOT EXISTS idx_generated_assets_status ON public.generated_assets(status, created_at DESC);

DROP TRIGGER IF EXISTS generated_assets_updated_at ON public.generated_assets;
CREATE TRIGGER generated_assets_updated_at
  BEFORE UPDATE ON public.generated_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.generated_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_generated_assets" ON public.generated_assets;
CREATE POLICY "marketing_os_all_generated_assets" ON public.generated_assets FOR ALL USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 3. generated_videos — video package pipeline (script → package → video)
-- ---------------------------------------------------------------------------
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
ALTER TABLE public.generated_videos ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'tiktok';
ALTER TABLE public.generated_videos ADD COLUMN IF NOT EXISTS video_url TEXT NOT NULL DEFAULT '';
ALTER TABLE public.generated_videos ADD COLUMN IF NOT EXISTS thumbnail_url TEXT NOT NULL DEFAULT '';
ALTER TABLE public.generated_videos ADD COLUMN IF NOT EXISTS script TEXT NOT NULL DEFAULT '';
ALTER TABLE public.generated_videos ADD COLUMN IF NOT EXISTS hook TEXT NOT NULL DEFAULT '';
ALTER TABLE public.generated_videos ADD COLUMN IF NOT EXISTS scenes JSONB NOT NULL DEFAULT '[]';
ALTER TABLE public.generated_videos ADD COLUMN IF NOT EXISTS voiceover TEXT NOT NULL DEFAULT '';
ALTER TABLE public.generated_videos ADD COLUMN IF NOT EXISTS on_screen_text JSONB NOT NULL DEFAULT '[]';
ALTER TABLE public.generated_videos ADD COLUMN IF NOT EXISTS caption TEXT NOT NULL DEFAULT '';
ALTER TABLE public.generated_videos ADD COLUMN IF NOT EXISTS cta TEXT NOT NULL DEFAULT '';
ALTER TABLE public.generated_videos ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'script_draft';
ALTER TABLE public.generated_videos ADD COLUMN IF NOT EXISTS review_feedback TEXT NOT NULL DEFAULT '';
ALTER TABLE public.generated_videos ADD COLUMN IF NOT EXISTS revision_notes TEXT NOT NULL DEFAULT '';
ALTER TABLE public.generated_videos ADD COLUMN IF NOT EXISTS generation_provider TEXT NOT NULL DEFAULT 'none';
ALTER TABLE public.generated_videos ADD COLUMN IF NOT EXISTS generation_model TEXT NOT NULL DEFAULT '';
ALTER TABLE public.generated_videos ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';
ALTER TABLE public.generated_videos ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.generated_videos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.generated_videos DROP CONSTRAINT IF EXISTS generated_videos_status_check;
ALTER TABLE public.generated_videos
  ADD CONSTRAINT generated_videos_status_check
  CHECK (status IN ('script_draft', 'script_approved', 'package_ready', 'pending_generation', 'generating', 'generated', 'approved', 'rejected', 'needs_revision', 'scheduled', 'published'));

CREATE INDEX IF NOT EXISTS idx_generated_videos_script ON public.generated_videos(script_id);
CREATE INDEX IF NOT EXISTS idx_generated_videos_calendar ON public.generated_videos(calendar_item_id);
CREATE INDEX IF NOT EXISTS idx_generated_videos_status ON public.generated_videos(status, created_at DESC);

DROP TRIGGER IF EXISTS generated_videos_updated_at ON public.generated_videos;
CREATE TRIGGER generated_videos_updated_at
  BEFORE UPDATE ON public.generated_videos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.generated_videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_generated_videos" ON public.generated_videos;
CREATE POLICY "marketing_os_all_generated_videos" ON public.generated_videos FOR ALL USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 4. content_feedback — Phase 29 upgrades (assets, videos, calendar, agents)
-- ---------------------------------------------------------------------------
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

-- Wider decision set (image/video review reuses this table)
ALTER TABLE public.content_feedback DROP CONSTRAINT IF EXISTS content_feedback_decision_check;
ALTER TABLE public.content_feedback
  ADD CONSTRAINT content_feedback_decision_check
  CHECK (decision IN ('approved', 'approved_with_note', 'rejected', 'revision_requested', 'edit_requested', 'note'));

CREATE INDEX IF NOT EXISTS idx_content_feedback_content ON public.content_feedback(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_feedback_agent_id ON public.content_feedback(agent_id, created_at DESC);

ALTER TABLE public.content_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_content_feedback" ON public.content_feedback;
CREATE POLICY "marketing_os_all_content_feedback" ON public.content_feedback FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
