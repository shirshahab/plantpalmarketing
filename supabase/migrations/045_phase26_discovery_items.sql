-- PlantPal Marketing OS — Repair discovery_items
-- Fixes: "Could not find the table 'public.discovery_items' in the schema cache"
-- Requires agent_daily_briefs (run 042 first). Safe to re-run.

CREATE TABLE IF NOT EXISTS public.discovery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID NOT NULL REFERENCES public.agent_daily_briefs(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL DEFAULT 'content_opportunity',
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  relevance_score INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Upgrade path for older/partial installs
ALTER TABLE public.discovery_items ADD COLUMN IF NOT EXISTS item_type TEXT NOT NULL DEFAULT 'content_opportunity';
ALTER TABLE public.discovery_items ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
ALTER TABLE public.discovery_items ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE public.discovery_items ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT '';
ALTER TABLE public.discovery_items ADD COLUMN IF NOT EXISTS relevance_score INTEGER NOT NULL DEFAULT 50;
ALTER TABLE public.discovery_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Recreate CHECK constraints idempotently (matches DiscoveryItemType in the code)
ALTER TABLE public.discovery_items DROP CONSTRAINT IF EXISTS discovery_items_item_type_check;
ALTER TABLE public.discovery_items
  ADD CONSTRAINT discovery_items_item_type_check
  CHECK (item_type IN ('trending_topic', 'question', 'content_opportunity'));
ALTER TABLE public.discovery_items DROP CONSTRAINT IF EXISTS discovery_items_relevance_score_check;
ALTER TABLE public.discovery_items
  ADD CONSTRAINT discovery_items_relevance_score_check
  CHECK (relevance_score >= 1 AND relevance_score <= 100);

CREATE INDEX IF NOT EXISTS idx_discovery_brief ON public.discovery_items(brief_id);
CREATE INDEX IF NOT EXISTS idx_discovery_items_relevance ON public.discovery_items(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_discovery_items_created ON public.discovery_items(created_at DESC);

-- No updated_at column on this table, so no set_updated_at trigger is needed.

ALTER TABLE public.discovery_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_discovery_items" ON public.discovery_items;
CREATE POLICY "marketing_os_all_discovery_items" ON public.discovery_items
  FOR ALL USING (true) WITH CHECK (true);

-- Seed examples (only when the table is empty and a daily brief exists to attach to)
INSERT INTO public.discovery_items (brief_id, item_type, title, description, source, relevance_score)
SELECT b.id, s.item_type, s.title, s.description, s.source, s.relevance_score
FROM (
  SELECT id FROM public.agent_daily_briefs ORDER BY created_at DESC LIMIT 1
) b
CROSS JOIN (
  VALUES
    ('trending_topic', 'Winter houseplant dormancy questions spiking', 'Search interest in "why is my plant dying winter" is up — strong fit for a care-guide series.', 'google_trends', 88),
    ('question', 'How often should I water a monstera in low light?', 'Recurring question across r/houseplants this week — good TikTok + blog answer material.', 'reddit', 81),
    ('content_opportunity', 'Propagation station setups are trending on TikTok', 'Creators getting high saves on budget propagation setups — PlantPal angle: track cutting progress in-app.', 'tiktok', 84)
) AS s(item_type, title, description, source, relevance_score)
WHERE NOT EXISTS (SELECT 1 FROM public.discovery_items);

NOTIFY pgrst, 'reload schema';
