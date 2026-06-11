-- PlantPal Marketing OS — Phase 29: Reddit automation (safe, help-first, human-gated)
-- Safe to re-run.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- reddit_accounts — connection status (credentials live in env vars, never here)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reddit_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'not_connected',
  karma INTEGER NOT NULL DEFAULT 0,
  account_age_days INTEGER NOT NULL DEFAULT 0,
  monitored_subreddits TEXT[] NOT NULL DEFAULT '{}',
  rate_limit_remaining INTEGER NOT NULL DEFAULT 0,
  last_checked_at TIMESTAMPTZ,
  notes TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.reddit_accounts DROP CONSTRAINT IF EXISTS reddit_accounts_status_check;
ALTER TABLE public.reddit_accounts
  ADD CONSTRAINT reddit_accounts_status_check
  CHECK (status IN ('not_connected', 'connected', 'warming_up', 'restricted', 'error'));

DROP TRIGGER IF EXISTS reddit_accounts_updated_at ON public.reddit_accounts;
CREATE TRIGGER reddit_accounts_updated_at
  BEFORE UPDATE ON public.reddit_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.reddit_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_reddit_accounts" ON public.reddit_accounts;
CREATE POLICY "marketing_os_all_reddit_accounts" ON public.reddit_accounts FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.reddit_accounts (username, status, monitored_subreddits, notes)
SELECT '', 'not_connected',
  ARRAY['houseplants', 'plantclinic', 'gardening', 'IndoorGarden', 'plants'],
  'Set REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD, REDDIT_USER_AGENT in Vercel, then run a connection check from /reddit.'
WHERE NOT EXISTS (SELECT 1 FROM public.reddit_accounts);

-- ---------------------------------------------------------------------------
-- reddit_opportunities — questions Roots finds worth answering
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reddit_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subreddit TEXT NOT NULL DEFAULT '',
  post_id TEXT NOT NULL DEFAULT '',
  permalink TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  question TEXT NOT NULL DEFAULT '',
  risk_score INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'found',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.reddit_opportunities DROP CONSTRAINT IF EXISTS reddit_opportunities_status_check;
ALTER TABLE public.reddit_opportunities
  ADD CONSTRAINT reddit_opportunities_status_check
  CHECK (status IN ('found', 'drafting', 'drafted', 'skipped', 'answered'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_reddit_opportunities_post ON public.reddit_opportunities(post_id) WHERE post_id <> '';
CREATE INDEX IF NOT EXISTS idx_reddit_opportunities_status ON public.reddit_opportunities(status, created_at DESC);

DROP TRIGGER IF EXISTS reddit_opportunities_updated_at ON public.reddit_opportunities;
CREATE TRIGGER reddit_opportunities_updated_at
  BEFORE UPDATE ON public.reddit_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.reddit_opportunities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_reddit_opportunities" ON public.reddit_opportunities;
CREATE POLICY "marketing_os_all_reddit_opportunities" ON public.reddit_opportunities FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.reddit_opportunities (subreddit, title, question, risk_score, status)
SELECT 'houseplants',
  'Why are my monstera leaves turning yellow?',
  'New leaves keep yellowing even though I water weekly. Bright indirect light. What am I doing wrong?',
  25, 'found'
WHERE NOT EXISTS (SELECT 1 FROM public.reddit_opportunities);

-- ---------------------------------------------------------------------------
-- reddit_reply_drafts — drafted, help-first replies awaiting founder approval
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reddit_reply_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID,
  subreddit TEXT NOT NULL DEFAULT '',
  post_id TEXT NOT NULL DEFAULT '',
  comment_id TEXT NOT NULL DEFAULT '',
  permalink TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT '',
  question TEXT NOT NULL DEFAULT '',
  draft_reply TEXT NOT NULL DEFAULT '',
  approved_reply TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  risk_score INTEGER NOT NULL DEFAULT 50,
  review_feedback TEXT NOT NULL DEFAULT '',
  posted_at TIMESTAMPTZ,
  published_url TEXT NOT NULL DEFAULT '',
  error_message TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.reddit_reply_drafts DROP CONSTRAINT IF EXISTS reddit_reply_drafts_status_check;
ALTER TABLE public.reddit_reply_drafts
  ADD CONSTRAINT reddit_reply_drafts_status_check
  CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'posted', 'failed'));

CREATE INDEX IF NOT EXISTS idx_reddit_reply_drafts_status ON public.reddit_reply_drafts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reddit_reply_drafts_opportunity ON public.reddit_reply_drafts(opportunity_id);

DROP TRIGGER IF EXISTS reddit_reply_drafts_updated_at ON public.reddit_reply_drafts;
CREATE TRIGGER reddit_reply_drafts_updated_at
  BEFORE UPDATE ON public.reddit_reply_drafts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.reddit_reply_drafts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_reddit_reply_drafts" ON public.reddit_reply_drafts;
CREATE POLICY "marketing_os_all_reddit_reply_drafts" ON public.reddit_reply_drafts FOR ALL USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- reddit_publish_logs — every Reddit action is logged
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reddit_publish_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID,
  subreddit TEXT NOT NULL DEFAULT '',
  post_id TEXT NOT NULL DEFAULT '',
  comment_id TEXT NOT NULL DEFAULT '',
  permalink TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL DEFAULT 'post_reply',
  status TEXT NOT NULL DEFAULT 'success',
  published_url TEXT NOT NULL DEFAULT '',
  error_message TEXT NOT NULL DEFAULT '',
  rate_limit_remaining INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reddit_publish_logs_created ON public.reddit_publish_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reddit_publish_logs_subreddit ON public.reddit_publish_logs(subreddit, created_at DESC);

ALTER TABLE public.reddit_publish_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_reddit_publish_logs" ON public.reddit_publish_logs;
CREATE POLICY "marketing_os_all_reddit_publish_logs" ON public.reddit_publish_logs FOR ALL USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- reddit_safety_rules — hard limits enforced server-side before any post
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reddit_safety_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key TEXT NOT NULL UNIQUE,
  rule_label TEXT NOT NULL DEFAULT '',
  rule_value TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS reddit_safety_rules_updated_at ON public.reddit_safety_rules;
CREATE TRIGGER reddit_safety_rules_updated_at
  BEFORE UPDATE ON public.reddit_safety_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.reddit_safety_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_reddit_safety_rules" ON public.reddit_safety_rules;
CREATE POLICY "marketing_os_all_reddit_safety_rules" ON public.reddit_safety_rules FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.reddit_safety_rules (rule_key, rule_label, rule_value, notes) VALUES
  ('max_replies_per_day', 'Max replies per day', '5', 'Hard server-side cap. Raise only after 30+ successful manual approvals.'),
  ('max_replies_per_subreddit_per_day', 'Max replies per subreddit per day', '1', 'Prevents looking like a spam account in any one community.'),
  ('allow_links', 'Allow links in replies', 'false', 'No links until founder explicitly enables. Help-first only.'),
  ('require_founder_approval', 'Founder approval required', 'true', 'Every reply needs a human click before posting. Keep true until trust is proven.'),
  ('skip_no_promo_subreddits', 'Skip strict no-promo subreddits', 'true', 'Respect subreddit rules — skip posts in communities with strict no-promotion rules.'),
  ('must_answer_question', 'Reply must answer the question', 'true', 'Replies are rejected if they do not directly help the poster.'),
  ('min_account_warmup_days', 'Account warm-up days before posting', '7', 'Manual commenting period before any automation posts.')
ON CONFLICT (rule_key) DO NOTHING;

NOTIFY pgrst, 'reload schema';
