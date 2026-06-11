-- =============================================================
-- Phase 34 — Source links for community opportunities + replies
-- Safe to re-run. Adds full source attribution columns so the UI
-- can always show "Open Original Post", "Open Author", "Copy Link"
-- and a DEMO badge when the row is seeded data.
-- =============================================================

-- ---------- community_opportunities ----------
alter table public.community_opportunities
  add column if not exists source_url text not null default '',
  add column if not exists source_author text not null default '',
  add column if not exists source_author_url text not null default '',
  add column if not exists source_platform text not null default '',
  add column if not exists source_title text not null default '',
  add column if not exists source_subreddit text not null default '',
  add column if not exists source_created_at timestamptz,
  add column if not exists engagement jsonb not null default '{}'::jsonb,
  add column if not exists data_source text not null default 'demo';

-- Backfill obvious values from existing columns.
update public.community_opportunities
set
  source_platform = case when source_platform = '' then platform else source_platform end,
  source_author = case when source_author = '' then coalesce(author, '') else source_author end
where source_platform = '' or source_author = '';

-- ---------- community_reply_drafts ----------
alter table public.community_reply_drafts
  add column if not exists source_url text not null default '',
  add column if not exists source_author text not null default '',
  add column if not exists source_author_url text not null default '',
  add column if not exists source_platform text not null default '',
  add column if not exists source_title text not null default '',
  add column if not exists source_subreddit text not null default '',
  add column if not exists source_created_at timestamptz,
  add column if not exists engagement jsonb not null default '{}'::jsonb,
  add column if not exists data_source text not null default 'demo';

update public.community_reply_drafts
set
  source_platform = case when source_platform = '' then coalesce(platform, '') else source_platform end,
  source_author = case when source_author = '' then coalesce(author, '') else source_author end
where source_platform = '' or source_author = '';

-- ---------- reply_drafts (legacy social reply drafts) ----------
alter table public.reply_drafts
  add column if not exists source_url text not null default '',
  add column if not exists source_author text not null default '',
  add column if not exists source_author_url text not null default '',
  add column if not exists source_platform text not null default '',
  add column if not exists source_title text not null default '',
  add column if not exists source_subreddit text not null default '',
  add column if not exists source_created_at timestamptz,
  add column if not exists engagement jsonb not null default '{}'::jsonb,
  add column if not exists data_source text not null default 'demo';

update public.reply_drafts
set source_platform = case when source_platform = '' then coalesce(platform, '') else source_platform end
where source_platform = '';
