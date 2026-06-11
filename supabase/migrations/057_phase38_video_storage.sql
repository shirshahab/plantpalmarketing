-- ============================================================================
-- Phase 38 — video storage repair + generated_not_uploaded status
-- Safe to re-run.
--
-- WHY: video generation succeeds but the storage upload fails. Uploads run
-- with the anon key, and the storage.objects policies from migration 055 can
-- silently fail to apply on hosted Supabase ("must be owner of table
-- objects"), leaving RLS blocking every anon upload to generated-videos.
--
-- The PRIMARY fix is in the app: storage now uses SUPABASE_SERVICE_ROLE_KEY
-- (bypasses storage RLS). Add it to .env.local AND Vercel env vars.
-- This migration is the belt-and-braces: bucket exists, is public, and anon
-- policies are retried for setups without a service-role key.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. generated_videos — widen status check with generated_not_uploaded
--    (video exists at the provider; only the storage upload failed)
-- ----------------------------------------------------------------------------
ALTER TABLE public.generated_videos DROP CONSTRAINT IF EXISTS generated_videos_status_check;
ALTER TABLE public.generated_videos
  ADD CONSTRAINT generated_videos_status_check
  CHECK (status IN (
    'script_draft', 'script_approved',
    'package_ready', 'provider_not_configured',
    'pending_generation', 'generating', 'generated', 'generated_not_uploaded', 'failed',
    'approved', 'rejected', 'needs_revision',
    'attached_to_calendar', 'scheduled', 'published'
  ));

-- ----------------------------------------------------------------------------
-- 2. Storage buckets — ensure they exist and are PUBLIC
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('generated-videos', 'generated-videos', true)
  ON CONFLICT (id) DO UPDATE SET public = true;

  INSERT INTO storage.buckets (id, name, public)
  VALUES ('generated-assets', 'generated-assets', true)
  ON CONFLICT (id) DO UPDATE SET public = true;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Could not create/update storage buckets: % — create them manually: Dashboard > Storage > New bucket (public): generated-videos, generated-assets', SQLERRM;
END $$;

-- ----------------------------------------------------------------------------
-- 3. Storage policies — retried here; on hosted Supabase this may fail with
--    "must be owner of table objects" when run from the SQL editor. That is
--    FINE as long as SUPABASE_SERVICE_ROLE_KEY is set (service role bypasses
--    RLS). Without the key, create these policies in Dashboard > Storage >
--    Policies instead.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  DROP POLICY IF EXISTS "marketing_os_generated_media_read" ON storage.objects;
  CREATE POLICY "marketing_os_generated_media_read" ON storage.objects
    FOR SELECT USING (bucket_id IN ('generated-assets', 'generated-videos'));

  DROP POLICY IF EXISTS "marketing_os_generated_media_write" ON storage.objects;
  CREATE POLICY "marketing_os_generated_media_write" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id IN ('generated-assets', 'generated-videos'));

  DROP POLICY IF EXISTS "marketing_os_generated_media_update" ON storage.objects;
  CREATE POLICY "marketing_os_generated_media_update" ON storage.objects
    FOR UPDATE USING (bucket_id IN ('generated-assets', 'generated-videos'));

  DROP POLICY IF EXISTS "marketing_os_generated_media_delete" ON storage.objects;
  CREATE POLICY "marketing_os_generated_media_delete" ON storage.objects
    FOR DELETE USING (bucket_id IN ('generated-assets', 'generated-videos'));
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Could not create storage policies: % — set SUPABASE_SERVICE_ROLE_KEY in env (recommended) or add the policies via Dashboard > Storage > Policies', SQLERRM;
END $$;

NOTIFY pgrst, 'reload schema';
