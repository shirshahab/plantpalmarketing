-- PlantPal Marketing OS — Phase 25: Content Calendar / Publishing Command Center
-- Tables: content_calendar, content_assets, content_publish_logs. Safe to re-run.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- content_calendar — one row per piece of content on the calendar
-- ============================================================
CREATE TABLE IF NOT EXISTS public.content_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  platform TEXT NOT NULL DEFAULT 'x' CHECK (
    platform IN ('x', 'tiktok', 'instagram', 'youtube_shorts', 'reddit', 'blog', 'email', 'pinterest')
  ),
  channel TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL DEFAULT 'post',
  caption TEXT NOT NULL DEFAULT '',
  hook TEXT NOT NULL DEFAULT '',
  cta TEXT NOT NULL DEFAULT '',
  asset_url TEXT NOT NULL DEFAULT '',
  asset_type TEXT NOT NULL DEFAULT 'none',
  asset_prompt TEXT NOT NULL DEFAULT '',
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'sage_review', 'gate_review', 'approved', 'scheduled', 'ready_to_publish', 'published', 'rejected', 'needs_asset')
  ),
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    approval_status IN ('pending', 'sage_approved', 'approved', 'rejected')
  ),
  source_agent TEXT NOT NULL DEFAULT 'bloom',
  source_table TEXT NOT NULL DEFAULT '',
  source_id UUID,
  copy_text TEXT NOT NULL DEFAULT '',
  platform_url TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_calendar_scheduled ON public.content_calendar(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_content_calendar_status ON public.content_calendar(status);
CREATE INDEX IF NOT EXISTS idx_content_calendar_platform ON public.content_calendar(platform);
CREATE INDEX IF NOT EXISTS idx_content_calendar_created ON public.content_calendar(created_at DESC);
-- One calendar item per source record — enables create-or-update from approval flows
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_calendar_source
  ON public.content_calendar(source_table, source_id)
  WHERE source_id IS NOT NULL;

DROP TRIGGER IF EXISTS content_calendar_updated_at ON public.content_calendar;
CREATE TRIGGER content_calendar_updated_at
  BEFORE UPDATE ON public.content_calendar
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_content_calendar" ON public.content_calendar;
CREATE POLICY "marketing_os_all_content_calendar" ON public.content_calendar
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- content_assets — generated/uploaded assets attached to a calendar item
-- ============================================================
CREATE TABLE IF NOT EXISTS public.content_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_item_id UUID NOT NULL REFERENCES public.content_calendar(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL DEFAULT 'image',
  asset_url TEXT NOT NULL DEFAULT '',
  asset_prompt TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'needed' CHECK (
    status IN ('needed', 'generating', 'ready', 'attached', 'rejected')
  ),
  created_by_agent TEXT NOT NULL DEFAULT 'bloom',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_assets_item ON public.content_assets(calendar_item_id);
CREATE INDEX IF NOT EXISTS idx_content_assets_status ON public.content_assets(status);

ALTER TABLE public.content_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_content_assets" ON public.content_assets;
CREATE POLICY "marketing_os_all_content_assets" ON public.content_assets
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- content_publish_logs — every publish attempt / manual confirmation
-- ============================================================
CREATE TABLE IF NOT EXISTS public.content_publish_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_item_id UUID NOT NULL REFERENCES public.content_calendar(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'x',
  status TEXT NOT NULL DEFAULT 'logged' CHECK (
    status IN ('logged', 'queued', 'published', 'manual_published', 'failed', 'status_change')
  ),
  published_url TEXT NOT NULL DEFAULT '',
  error_message TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_publish_logs_item ON public.content_publish_logs(calendar_item_id);
CREATE INDEX IF NOT EXISTS idx_content_publish_logs_created ON public.content_publish_logs(created_at DESC);

ALTER TABLE public.content_publish_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_content_publish_logs" ON public.content_publish_logs;
CREATE POLICY "marketing_os_all_content_publish_logs" ON public.content_publish_logs
  FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
