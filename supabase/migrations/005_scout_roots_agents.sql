-- PlantPal Marketing OS — Phase 6: Scout (Creator) + Roots (Community) Agents
-- Run AFTER 004_content_agent_system.sql

-- ---------------------------------------------------------------------------
-- creator_leads — Scout agent CRM
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

-- ---------------------------------------------------------------------------
-- creator_partnerships — recommended partnership ideas from Scout
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

-- ---------------------------------------------------------------------------
-- community_mentions — raw mentions Roots finds
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

-- ---------------------------------------------------------------------------
-- Extend community_opportunities (Phase 2 table) for Roots agent
-- ---------------------------------------------------------------------------
ALTER TABLE public.community_opportunities
  ADD COLUMN IF NOT EXISTS question TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sentiment TEXT NOT NULL DEFAULT 'neutral',
  ADD COLUMN IF NOT EXISTS opportunity_score INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS opportunity_type TEXT NOT NULL DEFAULT 'beginner_questions',
  ADD COLUMN IF NOT EXISTS mention_id UUID REFERENCES public.community_mentions(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- community_reply_drafts — Roots reply drafts (human approval required)
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

-- ---------------------------------------------------------------------------
-- agent_activity_log — Scout & Roots activity for HQ
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL CHECK (agent_id IN ('scout', 'roots')),
  action TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_leads_score ON public.creator_leads(partnership_score DESC);
CREATE INDEX IF NOT EXISTS idx_creator_leads_priority ON public.creator_leads(priority);
CREATE INDEX IF NOT EXISTS idx_creator_leads_status ON public.creator_leads(partnership_status);
CREATE INDEX IF NOT EXISTS idx_creator_partnerships_lead ON public.creator_partnerships(creator_lead_id);
CREATE INDEX IF NOT EXISTS idx_community_mentions_platform ON public.community_mentions(platform);
CREATE INDEX IF NOT EXISTS idx_community_reply_drafts_status ON public.community_reply_drafts(status);
CREATE INDEX IF NOT EXISTS idx_agent_activity_agent ON public.agent_activity_log(agent_id, created_at DESC);

CREATE TRIGGER creator_leads_updated_at
  BEFORE UPDATE ON public.creator_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER creator_partnerships_updated_at
  BEFORE UPDATE ON public.creator_partnerships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER community_reply_drafts_updated_at
  BEFORE UPDATE ON public.community_reply_drafts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.creator_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reply_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketing_os_all_creator_leads" ON public.creator_leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_creator_partnerships" ON public.creator_partnerships FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_community_mentions" ON public.community_mentions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_community_reply_drafts" ON public.community_reply_drafts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_agent_activity" ON public.agent_activity_log FOR ALL USING (true) WITH CHECK (true);
