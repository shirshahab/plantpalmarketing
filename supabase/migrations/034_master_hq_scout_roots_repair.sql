-- PlantPal Marketing OS — Master repair: Scout, Roots, HQ live mode
-- Safe to re-run. Paste entire file into Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- community_opportunities
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT '',
  post TEXT NOT NULL DEFAULT '',
  topic TEXT NOT NULL DEFAULT '',
  urgency_score INTEGER NOT NULL DEFAULT 50 CHECK (urgency_score >= 0 AND urgency_score <= 100),
  suggested_reply TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'draft')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.community_opportunities
  ADD COLUMN IF NOT EXISTS question TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sentiment TEXT NOT NULL DEFAULT 'neutral',
  ADD COLUMN IF NOT EXISTS opportunity_score INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS opportunity_type TEXT NOT NULL DEFAULT 'beginner_questions',
  ADD COLUMN IF NOT EXISTS mention_id UUID;

DROP TRIGGER IF EXISTS community_opportunities_updated_at ON public.community_opportunities;
CREATE TRIGGER community_opportunities_updated_at
  BEFORE UPDATE ON public.community_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- community_mentions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  sentiment TEXT NOT NULL DEFAULT 'neutral' CHECK (
    sentiment IN ('positive', 'neutral', 'negative', 'frustrated', 'curious')
  ),
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'community_opportunities_mention_id_fkey'
  ) THEN
    ALTER TABLE public.community_opportunities
      ADD CONSTRAINT community_opportunities_mention_id_fkey
      FOREIGN KEY (mention_id) REFERENCES public.community_mentions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- creator_leads
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.creator_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  handle TEXT NOT NULL DEFAULT '',
  platform TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  followers INTEGER NOT NULL DEFAULT 0,
  engagement_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  average_views INTEGER NOT NULL DEFAULT 0,
  location TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  partnership_score INTEGER NOT NULL DEFAULT 50 CHECK (partnership_score >= 1 AND partnership_score <= 100),
  audience_fit INTEGER NOT NULL DEFAULT 50 CHECK (audience_fit >= 1 AND audience_fit <= 100),
  engagement_score INTEGER NOT NULL DEFAULT 50 CHECK (engagement_score >= 1 AND engagement_score <= 100),
  posting_frequency INTEGER NOT NULL DEFAULT 50 CHECK (posting_frequency >= 1 AND posting_frequency <= 100),
  content_quality INTEGER NOT NULL DEFAULT 50 CHECK (content_quality >= 1 AND content_quality <= 100),
  growth_trend INTEGER NOT NULL DEFAULT 50 CHECK (growth_trend >= 1 AND growth_trend <= 100),
  partnership_status TEXT NOT NULL DEFAULT 'prospect' CHECK (
    partnership_status IN ('prospect', 'high_priority', 'outreach_pending', 'contacted', 'negotiating', 'partnered', 'declined')
  ),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'high')),
  source TEXT NOT NULL DEFAULT '',
  suggested_ideas JSONB NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'draft')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS creator_leads_updated_at ON public.creator_leads;
CREATE TRIGGER creator_leads_updated_at
  BEFORE UPDATE ON public.creator_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- creator_partnerships
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.creator_partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_lead_id UUID REFERENCES public.creator_leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  idea_type TEXT NOT NULL CHECK (
    idea_type IN ('challenge', 'product_review', 'garden_transformation', 'plant_rescue', 'community_event', 'giveaway')
  ),
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'recommended' CHECK (
    status IN ('recommended', 'approved', 'rejected', 'active', 'completed')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS creator_partnerships_updated_at ON public.creator_partnerships;
CREATE TRIGGER creator_partnerships_updated_at
  BEFORE UPDATE ON public.creator_partnerships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- community_reply_drafts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_reply_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES public.community_opportunities(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT '',
  original_content TEXT NOT NULL DEFAULT '',
  draft TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'draft')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS community_reply_drafts_updated_at ON public.community_reply_drafts;
CREATE TRIGGER community_reply_drafts_updated_at
  BEFORE UPDATE ON public.community_reply_drafts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- agent_activity_log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  action TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.agent_activity_log
  DROP CONSTRAINT IF EXISTS agent_activity_log_agent_id_check;

ALTER TABLE public.agent_activity_log
  ADD CONSTRAINT agent_activity_log_agent_id_check
  CHECK (agent_id IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy', 'atlas', 'fern', 'echo', 'gate'));

-- ---------------------------------------------------------------------------
-- agent_messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent TEXT NOT NULL CHECK (
    from_agent IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy', 'atlas', 'fern', 'echo', 'gate')
  ),
  to_agent TEXT NOT NULL CHECK (
    to_agent IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy', 'atlas', 'fern', 'echo', 'gate')
  ),
  message_type TEXT NOT NULL DEFAULT 'handoff' CHECK (
    message_type IN ('handoff', 'request', 'response', 'notification', 'status', 'broadcast')
  ),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (
    priority IN ('low', 'medium', 'high', 'urgent')
  ),
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'unread' CHECK (
    status IN ('unread', 'read', 'acknowledged', 'archived')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS agent_messages_updated_at ON public.agent_messages;
CREATE TRIGGER agent_messages_updated_at
  BEFORE UPDATE ON public.agent_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- agent_tasks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_agent TEXT NOT NULL CHECK (
    assigned_agent IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy', 'atlas', 'fern', 'echo', 'gate')
  ),
  created_by TEXT NOT NULL CHECK (
    created_by IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy', 'atlas', 'fern', 'echo', 'gate')
  ),
  task_type TEXT NOT NULL DEFAULT 'action' CHECK (
    task_type IN (
      'content_brief', 'partnership_review', 'community_response', 'competitor_analysis',
      'growth_recommendation', 'voc_insight', 'publish_schedule', 'creative_review',
      'creator_outreach', 'executive_brief', 'acquisition_test', 'approval_gate'
    )
  ),
  description TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (
    priority IN ('low', 'medium', 'high', 'urgent')
  ),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'in_progress', 'completed', 'blocked', 'cancelled')
  ),
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

DROP TRIGGER IF EXISTS agent_tasks_updated_at ON public.agent_tasks;
CREATE TRIGGER agent_tasks_updated_at
  BEFORE UPDATE ON public.agent_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- agent_events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'scout_found_creator', 'roots_found_discussion', 'sentinel_detected_feature',
      'bloom_generated_content', 'sage_rejected_content', 'sage_approved_content',
      'gate_approved_content', 'gate_rejected_content', 'oak_created_partnership',
      'ivy_executive_brief', 'atlas_growth_insight', 'fern_acquisition_opportunity',
      'echo_voc_insight', 'agent_message_sent', 'agent_task_assigned', 'agent_task_completed'
    )
  ),
  source_agent TEXT NOT NULL CHECK (
    source_agent IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy', 'atlas', 'fern', 'echo', 'gate')
  ),
  target_agent TEXT CHECK (
    target_agent IS NULL OR target_agent IN ('scout', 'roots', 'sentinel', 'bloom', 'sage', 'sprout', 'oak', 'ivy', 'atlas', 'fern', 'echo', 'gate')
  ),
  title TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  impact TEXT NOT NULL DEFAULT '',
  related_message_id UUID REFERENCES public.agent_messages(id) ON DELETE SET NULL,
  related_task_id UUID REFERENCES public.agent_tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_creator_leads_score ON public.creator_leads(partnership_score DESC);
CREATE INDEX IF NOT EXISTS idx_creator_leads_priority ON public.creator_leads(priority);
CREATE INDEX IF NOT EXISTS idx_creator_leads_status ON public.creator_leads(partnership_status);
CREATE INDEX IF NOT EXISTS idx_creator_partnerships_lead ON public.creator_partnerships(creator_lead_id);
CREATE INDEX IF NOT EXISTS idx_community_mentions_platform ON public.community_mentions(platform);
CREATE INDEX IF NOT EXISTS idx_community_reply_drafts_status ON public.community_reply_drafts(status);
CREATE INDEX IF NOT EXISTS idx_agent_activity_agent ON public.agent_activity_log(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_messages_to ON public.agent_messages(to_agent, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_messages_from ON public.agent_messages(from_agent, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_messages_pair ON public.agent_messages(from_agent, to_agent, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_assigned ON public.agent_tasks(assigned_agent, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_created_by ON public.agent_tasks(created_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON public.agent_tasks(status, priority);
CREATE INDEX IF NOT EXISTS idx_agent_events_created ON public.agent_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_events_source ON public.agent_events(source_agent, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_events_type ON public.agent_events(event_type);

-- ---------------------------------------------------------------------------
-- RLS + policies
-- ---------------------------------------------------------------------------
ALTER TABLE public.community_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reply_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketing_os_all_community" ON public.community_opportunities;
CREATE POLICY "marketing_os_all_community" ON public.community_opportunities FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_community_mentions" ON public.community_mentions;
CREATE POLICY "marketing_os_all_community_mentions" ON public.community_mentions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_creator_leads" ON public.creator_leads;
CREATE POLICY "marketing_os_all_creator_leads" ON public.creator_leads FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_creator_partnerships" ON public.creator_partnerships;
CREATE POLICY "marketing_os_all_creator_partnerships" ON public.creator_partnerships FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_community_reply_drafts" ON public.community_reply_drafts;
CREATE POLICY "marketing_os_all_community_reply_drafts" ON public.community_reply_drafts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_agent_activity" ON public.agent_activity_log;
CREATE POLICY "marketing_os_all_agent_activity" ON public.agent_activity_log FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_agent_messages" ON public.agent_messages;
CREATE POLICY "marketing_os_all_agent_messages" ON public.agent_messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_agent_tasks" ON public.agent_tasks;
CREATE POLICY "marketing_os_all_agent_tasks" ON public.agent_tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_agent_events" ON public.agent_events;
CREATE POLICY "marketing_os_all_agent_events" ON public.agent_events FOR ALL USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Seed: creator_leads
-- ---------------------------------------------------------------------------
INSERT INTO public.creator_leads (
  name, handle, platform, category, followers, engagement_rate, average_views,
  location, email, website, partnership_score, audience_fit, engagement_score,
  posting_frequency, content_quality, growth_trend, partnership_status, priority,
  source, suggested_ideas, notes
)
SELECT * FROM (VALUES
  ('Jess Martinez', '@gardenwithjess', 'TikTok', 'Balcony Gardening', 84000, 6.20::numeric, 45000,
   'Austin, TX', 'jess@gardenwithjess.com', 'https://gardenwithjess.com', 88, 92, 85, 78, 90, 82,
   'high_priority', 'high', 'TikTok',
   '["30-Day Tomato Challenge", "Balcony rescue series with PlantPal"]'::jsonb,
   'Strong audience fit. Posts 4x/week. Authentic voice.'),
  ('Plant Mom Daily', '@gardenmomdaily', 'Instagram', 'Houseplants', 52000, 7.10::numeric, 28000,
   'Chicago, IL', 'hello@gardenmomdaily.com', '', 91, 90, 88, 80, 86, 88,
   'high_priority', 'high', 'Instagram',
   '["Plant rescue week", "Monstera care giveaway"]'::jsonb,
   'High engagement. Perfect for rescue content.')
) AS v(name, handle, platform, category, followers, engagement_rate, average_views,
       location, email, website, partnership_score, audience_fit, engagement_score,
       posting_frequency, content_quality, growth_trend, partnership_status, priority,
       source, suggested_ideas, notes)
WHERE NOT EXISTS (SELECT 1 FROM public.creator_leads WHERE handle = v.handle);

-- ---------------------------------------------------------------------------
-- Seed: creator_partnerships
-- ---------------------------------------------------------------------------
INSERT INTO public.creator_partnerships (creator_lead_id, title, idea_type, description, status)
SELECT cl.id, '30-Day Tomato Challenge', 'challenge',
  'Jess documents 30 days growing tomatoes with PlantPal care reminders.',
  'recommended'
FROM public.creator_leads cl
WHERE cl.handle = '@gardenwithjess'
  AND NOT EXISTS (
    SELECT 1 FROM public.creator_partnerships cp
    WHERE cp.creator_lead_id = cl.id AND cp.title = '30-Day Tomato Challenge'
  );

-- ---------------------------------------------------------------------------
-- Seed: community_mentions
-- ---------------------------------------------------------------------------
INSERT INTO public.community_mentions (platform, author, content, url, sentiment)
SELECT v.platform, v.author, v.content, v.url, v.sentiment
FROM (VALUES
  ('Reddit', 'u/plantpanic2024', 'My monstera is dying — yellow leaves, brown tips.', 'https://reddit.com/r/plantclinic/example1', 'frustrated'),
  ('X', '@balconygardener', 'Anyone know a good app for tracking plant watering?', 'https://x.com/example3', 'curious')
) AS v(platform, author, content, url, sentiment)
WHERE NOT EXISTS (
  SELECT 1 FROM public.community_mentions m WHERE m.author = v.author AND m.content = v.content
);

-- ---------------------------------------------------------------------------
-- Seed: community_opportunities
-- ---------------------------------------------------------------------------
INSERT INTO public.community_opportunities (
  platform, author, post, topic, question, sentiment, urgency_score, opportunity_score,
  opportunity_type, suggested_reply, status
)
SELECT v.platform, v.author, v.post, v.topic, v.question, v.sentiment, v.urgency_score, v.opportunity_score,
       v.opportunity_type, v.suggested_reply, v.status
FROM (VALUES
  ('Reddit', 'u/plantpanic2024',
   'My monstera is dying — yellow leaves, brown tips.',
   'Monstera care', 'Why are my monstera leaves turning yellow?',
   'frustrated', 92, 88, 'plant_problems',
   'Yellow leaves + brown tips usually means inconsistent watering.',
   'pending'),
  ('X', '@balconygardener',
   'Anyone know a good app for tracking plant watering?',
   'Plant care apps', 'What app helps track plant watering?',
   'curious', 78, 90, 'beginner_questions',
   'Succulents need way less water than people think.',
   'pending')
) AS v(platform, author, post, topic, question, sentiment, urgency_score, opportunity_score,
       opportunity_type, suggested_reply, status)
WHERE NOT EXISTS (
  SELECT 1 FROM public.community_opportunities o WHERE o.author = v.author AND o.post = v.post
);

-- ---------------------------------------------------------------------------
-- Seed: community_reply_drafts
-- ---------------------------------------------------------------------------
INSERT INTO public.community_reply_drafts (opportunity_id, platform, author, original_content, draft, status)
SELECT o.id, o.platform, o.author, o.post, o.suggested_reply, 'pending'
FROM public.community_opportunities o
WHERE o.author IN ('u/plantpanic2024', '@balconygardener')
  AND NOT EXISTS (
    SELECT 1 FROM public.community_reply_drafts d WHERE d.opportunity_id = o.id
  );

-- ---------------------------------------------------------------------------
-- Seed: agent_activity_log
-- ---------------------------------------------------------------------------
INSERT INTO public.agent_activity_log (agent_id, action, detail)
SELECT v.agent_id, v.action, v.detail
FROM (VALUES
  ('scout', 'found_creator', 'Scout found creator: @gardenmomdaily — partnership score 91'),
  ('scout', 'scored_lead', 'Analyzed @gardenwithjess — audience fit 92'),
  ('roots', 'found_discussion', 'Roots found discussion: "My monstera is dying."'),
  ('roots', 'drafted_reply', 'Drafted helpful reply — awaiting approval'),
  ('sentinel', 'monitoring', 'Scanning competitors — App Store, reviews, social')
) AS v(agent_id, action, detail)
WHERE NOT EXISTS (
  SELECT 1 FROM public.agent_activity_log a WHERE a.agent_id = v.agent_id AND a.detail = v.detail
);

-- ---------------------------------------------------------------------------
-- Seed: agent_messages
-- ---------------------------------------------------------------------------
INSERT INTO public.agent_messages (id, from_agent, to_agent, message_type, priority, title, body, status)
SELECT v.id::uuid, v.from_agent, v.to_agent, v.message_type, v.priority, v.title, v.body, v.status
FROM (VALUES
  ('a1000000-0000-4000-8000-000000000001', 'scout', 'oak', 'handoff', 'high',
   'Creator lead ready for partnership',
   'Scout found @gardenmomdaily (91 score) — recommend Oak review.',
   'unread'),
  ('a1000000-0000-4000-8000-000000000003', 'roots', 'bloom', 'handoff', 'high',
   'Community thread needs content response',
   'High-urgency Reddit thread on overwatering — Bloom should create supporting carousel.',
   'unread')
) AS v(id, from_agent, to_agent, message_type, priority, title, body, status)
WHERE NOT EXISTS (SELECT 1 FROM public.agent_messages m WHERE m.id = v.id::uuid);

-- ---------------------------------------------------------------------------
-- Seed: agent_tasks
-- ---------------------------------------------------------------------------
INSERT INTO public.agent_tasks (id, assigned_agent, created_by, task_type, description, priority, status, due_date)
SELECT v.id::uuid, v.assigned_agent, v.created_by, v.task_type, v.description, v.priority, v.status, v.due_date::date
FROM (VALUES
  ('a2000000-0000-4000-8000-000000000001', 'oak', 'scout', 'partnership_review',
   'Review creator lead @gardenmomdaily and draft outreach', 'high', 'in_progress', (CURRENT_DATE + 2)::text),
  ('a2000000-0000-4000-8000-000000000003', 'bloom', 'roots', 'content_brief',
   'Create overwatering carousel supporting Roots community reply', 'high', 'pending', (CURRENT_DATE + 1)::text)
) AS v(id, assigned_agent, created_by, task_type, description, priority, status, due_date)
WHERE NOT EXISTS (SELECT 1 FROM public.agent_tasks t WHERE t.id = v.id::uuid);

-- ---------------------------------------------------------------------------
-- Seed: agent_events
-- ---------------------------------------------------------------------------
INSERT INTO public.agent_events (id, event_type, source_agent, target_agent, title, summary, impact)
SELECT v.id::uuid, v.event_type, v.source_agent, v.target_agent, v.title, v.summary, v.impact
FROM (VALUES
  ('a3000000-0000-4000-8000-000000000001', 'scout_found_creator', 'scout', 'oak',
   'Scout found creator: @gardenmomdaily',
   'Partnership score 91 — nursery collab potential',
   'High-value creator lead routed to Oak'),
  ('a3000000-0000-4000-8000-000000000002', 'roots_found_discussion', 'roots', 'bloom',
   'Roots found high-urgency discussion',
   'Reddit thread on overwatering — plant parents asking for help',
   'Community opportunity routed to Bloom')
) AS v(id, event_type, source_agent, target_agent, title, summary, impact)
WHERE NOT EXISTS (SELECT 1 FROM public.agent_events e WHERE e.id = v.id::uuid);

NOTIFY pgrst, 'reload schema';
