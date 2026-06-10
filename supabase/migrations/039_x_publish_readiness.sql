-- PlantPal Marketing OS — X publish readiness (ready_to_publish status)
-- Safe to re-run. Paste entire file into Supabase SQL Editor.

ALTER TABLE public.x_post_queue DROP CONSTRAINT IF EXISTS x_post_queue_status_check;

ALTER TABLE public.x_post_queue ADD CONSTRAINT x_post_queue_status_check CHECK (
  status IN (
    'draft',
    'sage_review',
    'gate_approval',
    'queued',
    'ready_to_publish',
    'published',
    'failed',
    'rejected'
  )
);

-- Promote gate-approved queued items to ready_to_publish
UPDATE public.x_post_queue
SET status = 'ready_to_publish', updated_at = NOW()
WHERE status = 'queued'
  AND gate_approved = TRUE
  AND sage_approved = TRUE
  AND published_tweet_id IS NULL;

NOTIFY pgrst, 'reload schema';
