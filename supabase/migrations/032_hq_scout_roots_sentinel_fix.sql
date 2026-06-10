-- PlantPal Marketing OS — HQ live data fix (Scout, Roots, Sentinel)
-- Safe to re-run. Requires public.set_updated_at() to exist.

-- ---------------------------------------------------------------------------
-- community_opportunities (base table from 001 — required by Roots)
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
-- Scout tables (005)
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
-- Roots tables (005)
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
-- agent_activity_log (005 + 007)
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
  CHECK (agent_id IN ('scout', 'roots', 'sentinel'));

-- FK for mention_id after community_mentions exists
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
-- Sentinel tables (007)
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
CREATE INDEX IF NOT EXISTS idx_scoreboard_threat ON public.competitor_scoreboard(threat_level DESC);
CREATE INDEX IF NOT EXISTS idx_intel_alerts_competitor ON public.competitor_intel_alerts(competitor);
CREATE INDEX IF NOT EXISTS idx_intel_alerts_type ON public.competitor_intel_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_intel_alerts_created ON public.competitor_intel_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_briefs_date ON public.competitor_daily_briefs(brief_date DESC);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS creator_leads_updated_at ON public.creator_leads;
CREATE TRIGGER creator_leads_updated_at
  BEFORE UPDATE ON public.creator_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS creator_partnerships_updated_at ON public.creator_partnerships;
CREATE TRIGGER creator_partnerships_updated_at
  BEFORE UPDATE ON public.creator_partnerships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS community_reply_drafts_updated_at ON public.community_reply_drafts;
CREATE TRIGGER community_reply_drafts_updated_at
  BEFORE UPDATE ON public.community_reply_drafts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS competitor_scoreboard_updated_at ON public.competitor_scoreboard;
CREATE TRIGGER competitor_scoreboard_updated_at
  BEFORE UPDATE ON public.competitor_scoreboard
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS competitor_intel_alerts_updated_at ON public.competitor_intel_alerts;
CREATE TRIGGER competitor_intel_alerts_updated_at
  BEFORE UPDATE ON public.competitor_intel_alerts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.community_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reply_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_scoreboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_intel_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_daily_briefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketing_os_all_community" ON public.community_opportunities;
CREATE POLICY "marketing_os_all_community" ON public.community_opportunities FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_creator_leads" ON public.creator_leads;
CREATE POLICY "marketing_os_all_creator_leads" ON public.creator_leads FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_creator_partnerships" ON public.creator_partnerships;
CREATE POLICY "marketing_os_all_creator_partnerships" ON public.creator_partnerships FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_community_mentions" ON public.community_mentions;
CREATE POLICY "marketing_os_all_community_mentions" ON public.community_mentions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_community_reply_drafts" ON public.community_reply_drafts;
CREATE POLICY "marketing_os_all_community_reply_drafts" ON public.community_reply_drafts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_agent_activity" ON public.agent_activity_log;
CREATE POLICY "marketing_os_all_agent_activity" ON public.agent_activity_log FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_scoreboard" ON public.competitor_scoreboard;
CREATE POLICY "marketing_os_all_scoreboard" ON public.competitor_scoreboard FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_intel_alerts" ON public.competitor_intel_alerts;
CREATE POLICY "marketing_os_all_intel_alerts" ON public.competitor_intel_alerts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_os_all_daily_briefs" ON public.competitor_daily_briefs;
CREATE POLICY "marketing_os_all_daily_briefs" ON public.competitor_daily_briefs FOR ALL USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Seed (006 + 008) — idempotent
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
  ('Green Thumb Mike', '@greenthumbmike', 'YouTube', 'Vegetable Gardening', 125000, 4.80::numeric, 62000,
   'Portland, OR', 'mike@greenthumb.com', '', 82, 88, 72, 85, 84, 75,
   'outreach_pending', 'high', 'YouTube',
   '["Raised bed transformation", "Beginner tomato guide collab"]'::jsonb,
   'Educational content. Long-form fits PlantPal tutorials.'),
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

INSERT INTO public.creator_partnerships (creator_lead_id, title, idea_type, description, status)
SELECT cl.id, '30-Day Tomato Challenge', 'challenge',
  'Jess documents 30 days growing tomatoes with PlantPal care reminders. Daily TikTok updates.',
  'recommended'
FROM public.creator_leads cl
WHERE cl.handle = '@gardenwithjess'
  AND NOT EXISTS (
    SELECT 1 FROM public.creator_partnerships cp
    WHERE cp.creator_lead_id = cl.id AND cp.title = '30-Day Tomato Challenge'
  );

INSERT INTO public.community_mentions (platform, author, content, url, sentiment)
SELECT v.platform, v.author, v.content, v.url, v.sentiment
FROM (VALUES
  ('Reddit', 'u/plantpanic2024', 'My monstera is dying and I have no idea why. Yellow leaves, brown tips, the whole drama.', 'https://reddit.com/r/plantclinic/example1', 'frustrated'),
  ('X', '@balconygardener', 'Anyone know a good app for tracking plant watering? I keep killing my succulents.', 'https://x.com/example3', 'curious')
) AS v(platform, author, content, url, sentiment)
WHERE NOT EXISTS (
  SELECT 1 FROM public.community_mentions m WHERE m.author = v.author AND m.content = v.content
);

INSERT INTO public.community_opportunities (
  platform, author, post, topic, question, sentiment, urgency_score, opportunity_score,
  opportunity_type, suggested_reply, status
)
SELECT v.platform, v.author, v.post, v.topic, v.question, v.sentiment, v.urgency_score, v.opportunity_score,
       v.opportunity_type, v.suggested_reply, v.status
FROM (VALUES
  ('Reddit', 'u/plantpanic2024',
   'My monstera is dying and I have no idea why. Yellow leaves, brown tips, the whole drama.',
   'Monstera care', 'Why are my monstera leaves turning yellow with brown tips?',
   'frustrated', 92, 88, 'plant_problems',
   'Yellow leaves + brown tips usually means inconsistent watering — often overwatering with poor drainage.',
   'pending'),
  ('X', '@balconygardener',
   'Anyone know a good app for tracking plant watering? I keep killing my succulents.',
   'Plant care apps', 'What app helps track plant watering?',
   'curious', 78, 90, 'beginner_questions',
   'Succulents need way less water than people think — usually every 2-3 weeks.',
   'pending')
) AS v(platform, author, post, topic, question, sentiment, urgency_score, opportunity_score,
       opportunity_type, suggested_reply, status)
WHERE NOT EXISTS (
  SELECT 1 FROM public.community_opportunities o WHERE o.author = v.author AND o.post = v.post
);

INSERT INTO public.competitor_scoreboard (
  name, slug, estimated_growth, app_store_rank, review_trend, review_score,
  social_engagement_score, new_features_count, recent_campaigns, threat_level, opportunity_level, notes
) VALUES
  ('PictureThis', 'picturethis', 72, 14, 'stable', 4.6, 88, 2,
   '["Plant ID TikTok Challenge", "Spring identification push"]', 78, 45,
   'Dominant plant ID brand. Viral social playbook is strong.'),
  ('Planta', 'planta', 65, 22, 'improving', 4.5, 76, 3,
   '["Smart Water weather sync", "Premium trial campaign"]', 82, 52,
   'AI watering reminders gaining traction. Direct PlantPal overlap.'),
  ('Greg', 'greg', 81, 18, 'improving', 4.7, 84, 4,
   '["Community plant swaps", "Influencer garden tours"]', 75, 60,
   'Fast-growing community angle. Strong creator partnerships.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.competitor_intel_alerts (competitor, alert_type, title, description, severity, source, recommended_action)
SELECT v.competitor, v.alert_type, v.title, v.description, v.severity, v.source, v.recommended_action
FROM (VALUES
  ('Planta', 'new_feature', 'Smart Water weather sync launched', 'Planta now adjusts watering schedules based on local weather forecasts.', 'high', 'App Store', 'Highlight PlantPal personalized per-plant scheduling.'),
  ('PictureThis', 'viral_post', 'TikTok ID challenge — 2.1M views', '#WhatPlantIsThis challenge resurfacing with celebrity gardener participation.', 'high', 'TikTok', 'Counter with PlantPal care-after-ID content.')
) AS v(competitor, alert_type, title, description, severity, source, recommended_action)
WHERE NOT EXISTS (
  SELECT 1 FROM public.competitor_intel_alerts a WHERE a.title = v.title AND a.competitor = v.competitor
);

INSERT INTO public.competitor_daily_briefs (
  biggest_threat, biggest_opportunity, recommended_response, alerts_count, competitors_scanned
)
SELECT
  'Planta Smart Water + aggressive Facebook ad spend — direct overlap with PlantPal watering value prop.',
  'Gardenia negative review spike — outdoor gardeners frustrated with inaccurate advice.',
  'Publish care-after-ID content. Launch outdoor gardener landing page. Brief Scout on creator deals.',
  6, 8
WHERE NOT EXISTS (SELECT 1 FROM public.competitor_daily_briefs LIMIT 1);

INSERT INTO public.agent_activity_log (agent_id, action, detail)
SELECT v.agent_id, v.action, v.detail
FROM (VALUES
  ('scout', 'found_creator', 'Scout found creator: @gardenmomdaily — partnership score 91'),
  ('roots', 'found_discussion', 'Roots found discussion: "My monstera is dying."'),
  ('sentinel', 'alert_detected', 'Sentinel alert: Planta Smart Water feature launch — severity high')
) AS v(agent_id, action, detail)
WHERE NOT EXISTS (
  SELECT 1 FROM public.agent_activity_log a WHERE a.agent_id = v.agent_id AND a.detail = v.detail
);
