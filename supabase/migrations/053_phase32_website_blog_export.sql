-- PlantPal Marketing OS — Phase 32: Website Blog Export
-- Safe to re-run. Adds export fields to seo_blog_posts so approved posts can be
-- exported as TypeScript objects for the public site's src/lib/blog/posts.ts.

ALTER TABLE public.seo_blog_posts ADD COLUMN IF NOT EXISTS author TEXT NOT NULL DEFAULT 'PlantPal Team';
ALTER TABLE public.seo_blog_posts ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Plant Care';
ALTER TABLE public.seo_blog_posts ADD COLUMN IF NOT EXISTS tags JSONB NOT NULL DEFAULT '[]';
ALTER TABLE public.seo_blog_posts ADD COLUMN IF NOT EXISTS featured_image TEXT NOT NULL DEFAULT '';
ALTER TABLE public.seo_blog_posts ADD COLUMN IF NOT EXISTS export_status TEXT NOT NULL DEFAULT 'not_exported';
ALTER TABLE public.seo_blog_posts ADD COLUMN IF NOT EXISTS exported_at TIMESTAMPTZ;

ALTER TABLE public.seo_blog_posts DROP CONSTRAINT IF EXISTS seo_blog_posts_export_status_check;
ALTER TABLE public.seo_blog_posts
  ADD CONSTRAINT seo_blog_posts_export_status_check
  CHECK (export_status IN ('not_exported', 'exported', 'published'));

CREATE INDEX IF NOT EXISTS idx_seo_blog_posts_export_status ON public.seo_blog_posts(export_status, created_at DESC);

NOTIFY pgrst, 'reload schema';
