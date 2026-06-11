-- PlantPal Marketing OS — Phase 30: SEO Blog Automation
-- Safe to re-run. Creates seo_blog_keywords, seo_blog_posts, seo_blog_publish_logs.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- seo_blog_keywords — topics worth writing about (Roots/Sentinel/SerpAPI/manual)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seo_blog_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  topic_cluster TEXT NOT NULL DEFAULT 'plant care',
  source TEXT NOT NULL DEFAULT 'manual',
  search_volume_estimate INTEGER NOT NULL DEFAULT 0,
  difficulty INTEGER NOT NULL DEFAULT 50,
  priority_score INTEGER NOT NULL DEFAULT 50,
  search_demand_notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.seo_blog_keywords ADD COLUMN IF NOT EXISTS topic_cluster TEXT NOT NULL DEFAULT 'plant care';
ALTER TABLE public.seo_blog_keywords ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE public.seo_blog_keywords ADD COLUMN IF NOT EXISTS search_volume_estimate INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.seo_blog_keywords ADD COLUMN IF NOT EXISTS difficulty INTEGER NOT NULL DEFAULT 50;
ALTER TABLE public.seo_blog_keywords ADD COLUMN IF NOT EXISTS priority_score INTEGER NOT NULL DEFAULT 50;
ALTER TABLE public.seo_blog_keywords ADD COLUMN IF NOT EXISTS search_demand_notes TEXT NOT NULL DEFAULT '';
ALTER TABLE public.seo_blog_keywords ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new';
ALTER TABLE public.seo_blog_keywords ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';

ALTER TABLE public.seo_blog_keywords DROP CONSTRAINT IF EXISTS seo_blog_keywords_status_check;
ALTER TABLE public.seo_blog_keywords
  ADD CONSTRAINT seo_blog_keywords_status_check
  CHECK (status IN ('new', 'queued', 'drafted', 'published', 'skipped'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_seo_blog_keywords_keyword ON public.seo_blog_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_seo_blog_keywords_status ON public.seo_blog_keywords(status, priority_score DESC);

DROP TRIGGER IF EXISTS seo_blog_keywords_updated_at ON public.seo_blog_keywords;
CREATE TRIGGER seo_blog_keywords_updated_at
  BEFORE UPDATE ON public.seo_blog_keywords
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.seo_blog_keywords ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_seo_blog_keywords" ON public.seo_blog_keywords;
CREATE POLICY "marketing_os_all_seo_blog_keywords" ON public.seo_blog_keywords FOR ALL USING (true) WITH CHECK (true);

-- Seed the starter topic list (skips existing keywords)
INSERT INTO public.seo_blog_keywords (keyword, topic_cluster, source, priority_score, search_demand_notes) VALUES
  ('why are my tomato leaves yellow', 'plant problems', 'roots', 85, 'Evergreen panic search. High intent.'),
  ('how often should I water monstera', 'watering', 'roots', 80, 'Monstera owners overwater constantly.'),
  ('best plants for beginners', 'beginner guides', 'serpapi', 75, 'High volume, listicle-friendly.'),
  ('why is my plant dying', 'plant problems', 'roots', 90, 'Pure panic. PlantPal scan is the perfect CTA.'),
  ('indoor plant care mistakes', 'beginner guides', 'sentinel', 70, 'Competitors rank with bloated 3000-word posts. Beat them with short.'),
  ('plant disease symptoms', 'plant problems', 'sentinel', 72, 'Diagnosis content maps directly to the app.'),
  ('overwatering vs underwatering', 'watering', 'roots', 78, 'The #1 confusion in every plant community.'),
  ('best plants by ZIP code', 'local', 'serpapi', 65, 'Low competition local angle, unique to PlantPal.'),
  ('what to plant this month', 'seasonal', 'serpapi', 68, 'Seasonal recurring traffic.'),
  ('how to save a dying plant', 'plant problems', 'roots', 88, 'Rescue content converts.')
ON CONFLICT (keyword) DO NOTHING;

-- ---------------------------------------------------------------------------
-- seo_blog_posts — drafts through publishing
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seo_blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID,
  keyword TEXT NOT NULL DEFAULT '',
  headline TEXT NOT NULL DEFAULT '',
  seo_title TEXT NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL DEFAULT '',
  intro TEXT NOT NULL DEFAULT '',
  sections JSONB NOT NULL DEFAULT '[]',
  faq JSONB NOT NULL DEFAULT '[]',
  cta TEXT NOT NULL DEFAULT '',
  internal_links JSONB NOT NULL DEFAULT '[]',
  html TEXT NOT NULL DEFAULT '',
  schema_markup JSONB NOT NULL DEFAULT '{}',
  word_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  risk_level TEXT NOT NULL DEFAULT 'low',
  voice_check JSONB NOT NULL DEFAULT '{}',
  voice_check_passed BOOLEAN NOT NULL DEFAULT FALSE,
  review_feedback TEXT NOT NULL DEFAULT '',
  source_agent TEXT NOT NULL DEFAULT 'bloom',
  published_url TEXT NOT NULL DEFAULT '',
  published_at TIMESTAMPTZ,
  backlinks JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.seo_blog_posts ADD COLUMN IF NOT EXISTS keyword_id UUID;
ALTER TABLE public.seo_blog_posts ADD COLUMN IF NOT EXISTS keyword TEXT NOT NULL DEFAULT '';
ALTER TABLE public.seo_blog_posts ADD COLUMN IF NOT EXISTS headline TEXT NOT NULL DEFAULT '';
ALTER TABLE public.seo_blog_posts ADD COLUMN IF NOT EXISTS seo_title TEXT NOT NULL DEFAULT '';
ALTER TABLE public.seo_blog_posts ADD COLUMN IF NOT EXISTS meta_description TEXT NOT NULL DEFAULT '';
ALTER TABLE public.seo_blog_posts ADD COLUMN IF NOT EXISTS slug TEXT NOT NULL DEFAULT '';
ALTER TABLE public.seo_blog_posts ADD COLUMN IF NOT EXISTS intro TEXT NOT NULL DEFAULT '';
ALTER TABLE public.seo_blog_posts ADD COLUMN IF NOT EXISTS sections JSONB NOT NULL DEFAULT '[]';
ALTER TABLE public.seo_blog_posts ADD COLUMN IF NOT EXISTS faq JSONB NOT NULL DEFAULT '[]';
ALTER TABLE public.seo_blog_posts ADD COLUMN IF NOT EXISTS cta TEXT NOT NULL DEFAULT '';
ALTER TABLE public.seo_blog_posts ADD COLUMN IF NOT EXISTS internal_links JSONB NOT NULL DEFAULT '[]';
ALTER TABLE public.seo_blog_posts ADD COLUMN IF NOT EXISTS html TEXT NOT NULL DEFAULT '';
ALTER TABLE public.seo_blog_posts ADD COLUMN IF NOT EXISTS schema_markup JSONB NOT NULL DEFAULT '{}';
ALTER TABLE public.seo_blog_posts ADD COLUMN IF NOT EXISTS word_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.seo_blog_posts ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE public.seo_blog_posts ADD COLUMN IF NOT EXISTS risk_level TEXT NOT NULL DEFAULT 'low';
ALTER TABLE public.seo_blog_posts ADD COLUMN IF NOT EXISTS voice_check JSONB NOT NULL DEFAULT '{}';
ALTER TABLE public.seo_blog_posts ADD COLUMN IF NOT EXISTS voice_check_passed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.seo_blog_posts ADD COLUMN IF NOT EXISTS review_feedback TEXT NOT NULL DEFAULT '';
ALTER TABLE public.seo_blog_posts ADD COLUMN IF NOT EXISTS source_agent TEXT NOT NULL DEFAULT 'bloom';
ALTER TABLE public.seo_blog_posts ADD COLUMN IF NOT EXISTS published_url TEXT NOT NULL DEFAULT '';
ALTER TABLE public.seo_blog_posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE public.seo_blog_posts ADD COLUMN IF NOT EXISTS backlinks JSONB NOT NULL DEFAULT '[]';
ALTER TABLE public.seo_blog_posts ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';

ALTER TABLE public.seo_blog_posts DROP CONSTRAINT IF EXISTS seo_blog_posts_status_check;
ALTER TABLE public.seo_blog_posts
  ADD CONSTRAINT seo_blog_posts_status_check
  CHECK (status IN ('draft', 'voice_check_failed', 'gate_review', 'approved', 'ready_to_publish', 'published', 'rejected', 'needs_revision'));

ALTER TABLE public.seo_blog_posts DROP CONSTRAINT IF EXISTS seo_blog_posts_risk_check;
ALTER TABLE public.seo_blog_posts
  ADD CONSTRAINT seo_blog_posts_risk_check
  CHECK (risk_level IN ('low', 'medium', 'high'));

CREATE INDEX IF NOT EXISTS idx_seo_blog_posts_status ON public.seo_blog_posts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_blog_posts_keyword ON public.seo_blog_posts(keyword_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_seo_blog_posts_slug ON public.seo_blog_posts(slug) WHERE slug <> '';

DROP TRIGGER IF EXISTS seo_blog_posts_updated_at ON public.seo_blog_posts;
CREATE TRIGGER seo_blog_posts_updated_at
  BEFORE UPDATE ON public.seo_blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.seo_blog_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_seo_blog_posts" ON public.seo_blog_posts;
CREATE POLICY "marketing_os_all_seo_blog_posts" ON public.seo_blog_posts FOR ALL USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- seo_blog_publish_logs — every publish action is logged
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seo_blog_publish_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID,
  action TEXT NOT NULL DEFAULT 'publish',
  status TEXT NOT NULL DEFAULT 'success',
  published_url TEXT NOT NULL DEFAULT '',
  error_message TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seo_blog_publish_logs_post ON public.seo_blog_publish_logs(post_id, created_at DESC);

ALTER TABLE public.seo_blog_publish_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_seo_blog_publish_logs" ON public.seo_blog_publish_logs;
CREATE POLICY "marketing_os_all_seo_blog_publish_logs" ON public.seo_blog_publish_logs FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
