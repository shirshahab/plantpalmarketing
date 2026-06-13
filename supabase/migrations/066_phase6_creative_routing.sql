-- Phase 6 — Creative routing: track source + metadata on image_prompts

ALTER TABLE public.image_prompts
  ADD COLUMN IF NOT EXISTS source_table TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS source_id UUID,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_image_prompts_source
  ON public.image_prompts(source_table, status, created_at DESC);

NOTIFY pgrst, 'reload schema';
