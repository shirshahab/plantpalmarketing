-- ============================================================================
-- Phase 40 — OS Clarity: notifications, Planty, Moss, workflow extensions
-- Safe to re-run.
-- ============================================================================

-- ── Notifications ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  target_route TEXT NOT NULL DEFAULT '/',
  target_table TEXT,
  target_id UUID,
  priority TEXT NOT NULL DEFAULT 'medium',
  read_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'founder_action', 'agent_completed', 'approval_needed', 'revision_ready',
    'calendar_ready', 'publish_ready', 'video_ready', 'asset_ready',
    'workflow_blocked', 'api_failure', 'storage_failure', 'brand_voice_failed',
    'planty_suggestion'
  ));

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_notifications" ON public.notifications;
CREATE POLICY "marketing_os_all_notifications" ON public.notifications
  FOR ALL USING (true) WITH CHECK (true);

-- ── Workflow extensions ─────────────────────────────────────────────────────
ALTER TABLE public.content_workflows ADD COLUMN IF NOT EXISTS current_owner TEXT NOT NULL DEFAULT '';
ALTER TABLE public.content_workflows ADD COLUMN IF NOT EXISTS destination_label TEXT NOT NULL DEFAULT '';
ALTER TABLE public.content_workflows ADD COLUMN IF NOT EXISTS last_transition_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.content_workflows ADD COLUMN IF NOT EXISTS founder_action_required BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.content_workflows DROP CONSTRAINT IF EXISTS content_workflows_stage_check;
ALTER TABLE public.content_workflows
  ADD CONSTRAINT content_workflows_stage_check
  CHECK (current_stage IN (
    'IDEA',
    'PENDING_FOUNDER_IDEA_APPROVAL',
    'IN_PRODUCTION',
    'PENDING_FOUNDER_ASSET_APPROVAL',
    'PENDING_FOUNDER_REPLY_APPROVAL',
    'REVISION_REQUESTED',
    'WITH_AGENT',
    'CALENDAR_READY',
    'SCHEDULED',
    'PUBLISHED',
    'KILLED',
    'ARCHIVED',
    'REJECTED'
  ));

-- ── Planty metadata on generated assets ─────────────────────────────────────
ALTER TABLE public.generated_assets ADD COLUMN IF NOT EXISTS uses_planty BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.generated_assets ADD COLUMN IF NOT EXISTS planty_pose TEXT;
ALTER TABLE public.generated_assets ADD COLUMN IF NOT EXISTS planty_emotion TEXT;
ALTER TABLE public.generated_assets ADD COLUMN IF NOT EXISTS planty_context TEXT;

-- ── Planty content system ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.planty_content_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  hook TEXT NOT NULL DEFAULT '',
  scenario TEXT NOT NULL DEFAULT '',
  planty_pose TEXT NOT NULL DEFAULT 'happy',
  planty_emotion TEXT NOT NULL DEFAULT 'cheerful',
  platform TEXT NOT NULL DEFAULT 'instagram',
  content_type TEXT NOT NULL DEFAULT 'social_post',
  status TEXT NOT NULL DEFAULT 'idea',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.planty_asset_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES public.planty_content_ideas(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  planty_pose TEXT NOT NULL DEFAULT '',
  planty_emotion TEXT NOT NULL DEFAULT '',
  planty_context TEXT NOT NULL DEFAULT '',
  platform TEXT NOT NULL DEFAULT 'instagram',
  status TEXT NOT NULL DEFAULT 'draft',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.planty_usage_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL UNIQUE,
  usage_percent INTEGER NOT NULL DEFAULT 15,
  max_per_week INTEGER NOT NULL DEFAULT 3,
  notes TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.planty_usage_rules (content_type, usage_percent, max_per_week, notes) VALUES
  ('social_post', 15, 4, 'Planty in ~15% of social posts'),
  ('educational_visual', 25, 5, 'Planty in ~25% of educational visuals'),
  ('blog_hero', 10, 2, 'Planty in ~10% of blog hero images'),
  ('onboarding', 20, 3, 'Planty in ~20% of onboarding/app education posts')
ON CONFLICT (content_type) DO NOTHING;

INSERT INTO public.planty_content_ideas (title, hook, scenario, planty_pose, planty_emotion, platform) VALUES
  ('Morning coffee with Planty', 'Good morning. Your plants are thirsty and so are you.', 'Planty sipping coffee with morning plant care caption', 'happy', 'cozy', 'instagram'),
  ('Planty vs overwaterers', 'Planty says stop watering the cactus like it owes you money.', 'Planty judging overwaterers', 'diagnosing', 'savage', 'tiktok'),
  ('Basil obituary', 'Your basil died. Again. Planty saw everything.', 'Planty panicking over a dying plant', 'uh_oh', 'concerned', 'x'),
  ('Rescued plant celebration', 'That leaf is not being dramatic. Something is wrong.', 'Planty celebrating a rescued plant', 'you_got_this', 'proud', 'instagram'),
  ('PlantPal phone demo', 'Stop guessing. Your plant is tired of your experiments.', 'Planty holding phone showing PlantPal app', 'nice_work', 'confident', 'instagram');

-- ── Moss — Brand Guardian agent profile ─────────────────────────────────────
INSERT INTO public.agent_profiles (agent_id, role, goal, responsibilities, system_prompt, is_active)
VALUES (
  'moss',
  'Brand Guardian',
  'Ensure every caption sounds unmistakably PlantPal before founder review',
  ARRAY[
    'PlantPal voice enforcement',
    'Humor and tone review',
    'Block generic AI and corporate language',
    'No em dashes',
    'Planty usage approval',
    'Platform-native caption quality',
    'Content freshness checks'
  ],
  'You are Moss, PlantPal Brand Guardian. Score every caption 1-10. 10 = unmistakably PlantPal. 8+ passes. 7 revise. 6 or below auto-reject. Reject: grow with confidence, unlock, empower, transform, companion, assistant, seamless, ecosystem, journey, revolutionize, em dashes, generic AI tone, corporate tone. Funny, short, helpful, a little savage. Never motivational SaaS garbage. Send failures back to the producing agent with specific fixes.',
  true
)
ON CONFLICT (agent_id) DO UPDATE SET
  role = EXCLUDED.role,
  goal = EXCLUDED.goal,
  responsibilities = EXCLUDED.responsibilities,
  system_prompt = EXCLUDED.system_prompt,
  is_active = true;

INSERT INTO public.agent_schedules (agent_id, frequency_type, interval_hours, enabled)
VALUES ('moss', 'interval_hours', 1, true)
ON CONFLICT (agent_id) DO UPDATE SET enabled = true, interval_hours = 1;

-- Allow Moss in agent_schedules and agent_runs check constraints
ALTER TABLE public.agent_schedules DROP CONSTRAINT IF EXISTS agent_schedules_agent_id_check;
ALTER TABLE public.agent_schedules
  ADD CONSTRAINT agent_schedules_agent_id_check
  CHECK (agent_id IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy', 'atlas', 'fern', 'echo', 'gate', 'moss'));

ALTER TABLE public.agent_runs DROP CONSTRAINT IF EXISTS agent_runs_agent_id_check;
ALTER TABLE public.agent_runs
  ADD CONSTRAINT agent_runs_agent_id_check
  CHECK (agent_id IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy', 'atlas', 'fern', 'echo', 'gate', 'moss'));

NOTIFY pgrst, 'reload schema';
