-- PlantPal Marketing OS — Phase 2 Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL → New query)

-- ---------------------------------------------------------------------------
-- Helper: auto-update updated_at
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- 1. content_ideas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('tiktok', 'reels', 'instagram', 'x', 'carousel', 'blog')),
  hook TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('pending', 'approved', 'rejected', 'draft')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER content_ideas_updated_at
  BEFORE UPDATE ON public.content_ideas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. social_posts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('pending', 'approved', 'rejected', 'draft')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER social_posts_updated_at
  BEFORE UPDATE ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. image_prompts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.image_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('social_graphic', 'app_screenshot', 'educational', 'before_after')),
  prompt TEXT NOT NULL DEFAULT '',
  style TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('pending', 'approved', 'rejected', 'draft')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER image_prompts_updated_at
  BEFORE UPDATE ON public.image_prompts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. video_scripts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.video_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  platform TEXT NOT NULL,
  hook TEXT NOT NULL DEFAULT '',
  scenes JSONB NOT NULL DEFAULT '[]',
  on_screen_text TEXT[] NOT NULL DEFAULT '{}',
  voiceover TEXT NOT NULL DEFAULT '',
  cta TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('pending', 'approved', 'rejected', 'draft')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER video_scripts_updated_at
  BEFORE UPDATE ON public.video_scripts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. community_opportunities
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

CREATE TRIGGER community_opportunities_updated_at
  BEFORE UPDATE ON public.community_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 6. reply_drafts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reply_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  original_post TEXT NOT NULL DEFAULT '',
  draft TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'draft')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER reply_drafts_updated_at
  BEFORE UPDATE ON public.reply_drafts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 7. creators
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  niche TEXT NOT NULL DEFAULT '',
  followers INTEGER NOT NULL DEFAULT 0,
  engagement_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  email TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'prospect' CHECK (status IN ('prospect', 'contacted', 'negotiating', 'partnered', 'declined')),
  notes TEXT NOT NULL DEFAULT '',
  partnership_idea TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER creators_updated_at
  BEFORE UPDATE ON public.creators
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 8. partnerships
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('nursery', 'garden_center', 'landscaper', 'botanical_garden', 'influencer', 'seed_company', 'home_garden_brand')),
  contact TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'in_discussion', 'active', 'paused')),
  notes TEXT NOT NULL DEFAULT '',
  opportunity TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER partnerships_updated_at
  BEFORE UPDATE ON public.partnerships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 9. competitor_alerts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.competitor_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('new_feature', 'app_store_ranking', 'viral_post', 'new_ad', 'negative_reviews')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER competitor_alerts_updated_at
  BEFORE UPDATE ON public.competitor_alerts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 10. approval_queue
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.approval_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('content', 'reply', 'image_prompt', 'video_script', 'social_post')),
  channel TEXT NOT NULL DEFAULT '',
  draft TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'draft')),
  source_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER approval_queue_updated_at
  BEFORE UPDATE ON public.approval_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security (permissive for internal dashboard — tighten in Phase 3)
-- ---------------------------------------------------------------------------
ALTER TABLE public.content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reply_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketing_os_all_content_ideas" ON public.content_ideas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_social_posts" ON public.social_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_image_prompts" ON public.image_prompts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_video_scripts" ON public.video_scripts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_community" ON public.community_opportunities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_reply_drafts" ON public.reply_drafts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_creators" ON public.creators FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_partnerships" ON public.partnerships FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_competitor_alerts" ON public.competitor_alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_os_all_approval_queue" ON public.approval_queue FOR ALL USING (true) WITH CHECK (true);
