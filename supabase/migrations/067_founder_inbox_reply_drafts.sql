-- Founder Inbox: link reply drafts to intelligence / Reddit sources
ALTER TABLE public.reply_drafts
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS source_id uuid,
  ADD COLUMN IF NOT EXISTS suggested_reply text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS edited_reply text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS subreddit text NOT NULL DEFAULT '';

UPDATE public.reply_drafts
SET suggested_reply = draft, edited_reply = draft
WHERE suggested_reply = '' AND draft <> '';

CREATE INDEX IF NOT EXISTS idx_reply_drafts_source ON public.reply_drafts(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_reply_drafts_status ON public.reply_drafts(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reply_drafts_source_unique
  ON public.reply_drafts(source_type, source_id)
  WHERE source_id IS NOT NULL AND source_type <> '';
