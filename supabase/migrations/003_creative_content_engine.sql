-- PlantPal Marketing OS — Phase 4: Creative Content Engine
-- Run in Supabase SQL Editor AFTER 001 and 002

CREATE TABLE IF NOT EXISTS public.creative_content_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN (
    'plant_er', 'plant_confessions', 'garden_wins', 'beginner_mistakes',
    'local_gardening', 'plantpal_challenges', 'family_gardening'
  )),
  format TEXT NOT NULL CHECK (format IN (
    'tiktok', 'reels', 'short_form_script', 'carousel', 'x', 'threads',
    'blog', 'push_notification', 'email_subject'
  )),
  hook TEXT NOT NULL DEFAULT '',
  emotional_trigger TEXT NOT NULL DEFAULT '',
  why_it_works TEXT NOT NULL DEFAULT '',
  cta TEXT NOT NULL DEFAULT '',
  difficulty_score INTEGER NOT NULL DEFAULT 5 CHECK (difficulty_score >= 1 AND difficulty_score <= 10),
  viral_score INTEGER NOT NULL DEFAULT 50 CHECK (viral_score >= 1 AND viral_score <= 100),
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'draft')),
  generation_batch_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creative_content_type ON public.creative_content_ideas(content_type);
CREATE INDEX IF NOT EXISTS idx_creative_content_format ON public.creative_content_ideas(format);
CREATE INDEX IF NOT EXISTS idx_creative_content_batch ON public.creative_content_ideas(generation_batch_id);
CREATE INDEX IF NOT EXISTS idx_creative_content_viral ON public.creative_content_ideas(viral_score DESC);

CREATE TRIGGER creative_content_ideas_updated_at
  BEFORE UPDATE ON public.creative_content_ideas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.creative_content_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketing_os_all_creative_content" ON public.creative_content_ideas
  FOR ALL USING (true) WITH CHECK (true);
