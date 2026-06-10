-- PlantPal Marketing OS — Phase 28: Pipeline content fix + approval feedback
-- Safe to re-run. Run after 042 (agent_daily_briefs) and 043 (content_calendar).

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- PART 1: pipeline_content (fixes "Could not find the table 'public.pipeline_content'")
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pipeline_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID,
  platform TEXT NOT NULL DEFAULT 'tiktok',
  format TEXT NOT NULL DEFAULT 'video_script',
  hook TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  cta TEXT NOT NULL DEFAULT '',
  viral_score INTEGER NOT NULL DEFAULT 50,
  originality_score INTEGER NOT NULL DEFAULT 0,
  humor_score INTEGER NOT NULL DEFAULT 0,
  emotional_impact_score INTEGER NOT NULL DEFAULT 0,
  shareability_score INTEGER NOT NULL DEFAULT 0,
  educational_score INTEGER NOT NULL DEFAULT 0,
  aggregate_score INTEGER NOT NULL DEFAULT 0,
  director_notes TEXT NOT NULL DEFAULT '',
  rewrite_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending_review',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Upgrade path: every column the code expects
ALTER TABLE public.pipeline_content ADD COLUMN IF NOT EXISTS brief_id UUID;
ALTER TABLE public.pipeline_content ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'tiktok';
ALTER TABLE public.pipeline_content ADD COLUMN IF NOT EXISTS format TEXT NOT NULL DEFAULT 'video_script';
ALTER TABLE public.pipeline_content ADD COLUMN IF NOT EXISTS hook TEXT NOT NULL DEFAULT '';
ALTER TABLE public.pipeline_content ADD COLUMN IF NOT EXISTS caption TEXT NOT NULL DEFAULT '';
ALTER TABLE public.pipeline_content ADD COLUMN IF NOT EXISTS cta TEXT NOT NULL DEFAULT '';
ALTER TABLE public.pipeline_content ADD COLUMN IF NOT EXISTS viral_score INTEGER NOT NULL DEFAULT 50;
ALTER TABLE public.pipeline_content ADD COLUMN IF NOT EXISTS originality_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.pipeline_content ADD COLUMN IF NOT EXISTS humor_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.pipeline_content ADD COLUMN IF NOT EXISTS emotional_impact_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.pipeline_content ADD COLUMN IF NOT EXISTS shareability_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.pipeline_content ADD COLUMN IF NOT EXISTS educational_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.pipeline_content ADD COLUMN IF NOT EXISTS aggregate_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.pipeline_content ADD COLUMN IF NOT EXISTS director_notes TEXT NOT NULL DEFAULT '';
ALTER TABLE public.pipeline_content ADD COLUMN IF NOT EXISTS rewrite_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.pipeline_content ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending_review';
ALTER TABLE public.pipeline_content ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.pipeline_content ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Status check (recreated so re-runs and upgrades stay consistent)
ALTER TABLE public.pipeline_content DROP CONSTRAINT IF EXISTS pipeline_content_status_check;
ALTER TABLE public.pipeline_content
  ADD CONSTRAINT pipeline_content_status_check
  CHECK (status IN ('pending_review', 'approved', 'rejected', 'needs_rewrite'));

-- FK to agent_daily_briefs only when that table exists (run 042 first)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_daily_briefs') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'pipeline_content_brief_id_fkey' AND table_name = 'pipeline_content'
    ) THEN
      ALTER TABLE public.pipeline_content
        ADD CONSTRAINT pipeline_content_brief_id_fkey
        FOREIGN KEY (brief_id) REFERENCES public.agent_daily_briefs(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pipeline_brief ON public.pipeline_content(brief_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_status ON public.pipeline_content(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_aggregate ON public.pipeline_content(aggregate_score DESC);

DROP TRIGGER IF EXISTS pipeline_content_updated_at ON public.pipeline_content;
CREATE TRIGGER pipeline_content_updated_at
  BEFORE UPDATE ON public.pipeline_content
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.pipeline_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_pipeline_content" ON public.pipeline_content;
CREATE POLICY "marketing_os_all_pipeline_content" ON public.pipeline_content FOR ALL USING (true) WITH CHECK (true);

-- Seed example (only when empty and a daily brief exists to attach to)
INSERT INTO public.pipeline_content (brief_id, platform, format, hook, caption, cta, viral_score, aggregate_score, status)
SELECT b.id, 'tiktok', 'video_script',
  'POV: your monstera tells you exactly what it needs',
  'Your plant is talking — PlantPal just translates. Scan a leaf, get a diagnosis, save the plant.',
  'Download PlantPal and scan your first plant free.',
  72, 74, 'pending_review'
FROM public.agent_daily_briefs b
WHERE NOT EXISTS (SELECT 1 FROM public.pipeline_content)
ORDER BY b.created_at DESC
LIMIT 1;

-- ---------------------------------------------------------------------------
-- PART 4a: approval feedback columns on approval_queue
-- ---------------------------------------------------------------------------
ALTER TABLE public.approval_queue ADD COLUMN IF NOT EXISTS approval_feedback TEXT NOT NULL DEFAULT '';
ALTER TABLE public.approval_queue ADD COLUMN IF NOT EXISTS rejection_reason TEXT NOT NULL DEFAULT '';
ALTER TABLE public.approval_queue ADD COLUMN IF NOT EXISTS revision_notes TEXT NOT NULL DEFAULT '';
ALTER TABLE public.approval_queue ADD COLUMN IF NOT EXISTS approved_by TEXT NOT NULL DEFAULT '';
ALTER TABLE public.approval_queue ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.approval_queue ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
ALTER TABLE public.approval_queue ADD COLUMN IF NOT EXISTS sent_back_to_agent TEXT NOT NULL DEFAULT '';
ALTER TABLE public.approval_queue ADD COLUMN IF NOT EXISTS feedback_category TEXT NOT NULL DEFAULT '';

-- Allow the new revision_requested status
ALTER TABLE public.approval_queue DROP CONSTRAINT IF EXISTS approval_queue_status_check;
ALTER TABLE public.approval_queue
  ADD CONSTRAINT approval_queue_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'draft', 'revision_requested'));

-- Allow needs_revision on the content calendar
ALTER TABLE public.content_calendar DROP CONSTRAINT IF EXISTS content_calendar_status_check;
ALTER TABLE public.content_calendar
  ADD CONSTRAINT content_calendar_status_check
  CHECK (status IN ('draft', 'sage_review', 'gate_review', 'approved', 'scheduled', 'ready_to_publish', 'published', 'rejected', 'needs_asset', 'needs_revision'));

-- ---------------------------------------------------------------------------
-- PART 4b: content_feedback — agents learn from founder feedback
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table TEXT NOT NULL DEFAULT 'approval_queue',
  source_id UUID,
  calendar_item_id UUID,
  decision TEXT NOT NULL DEFAULT 'approved' CHECK (
    decision IN ('approved', 'approved_with_note', 'rejected', 'revision_requested')
  ),
  feedback_category TEXT NOT NULL DEFAULT 'approved as-is',
  feedback_text TEXT NOT NULL DEFAULT '',
  sent_back_to_agent TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL DEFAULT 'founder',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.content_feedback ADD COLUMN IF NOT EXISTS source_table TEXT NOT NULL DEFAULT 'approval_queue';
ALTER TABLE public.content_feedback ADD COLUMN IF NOT EXISTS source_id UUID;
ALTER TABLE public.content_feedback ADD COLUMN IF NOT EXISTS calendar_item_id UUID;
ALTER TABLE public.content_feedback ADD COLUMN IF NOT EXISTS decision TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE public.content_feedback ADD COLUMN IF NOT EXISTS feedback_category TEXT NOT NULL DEFAULT 'approved as-is';
ALTER TABLE public.content_feedback ADD COLUMN IF NOT EXISTS feedback_text TEXT NOT NULL DEFAULT '';
ALTER TABLE public.content_feedback ADD COLUMN IF NOT EXISTS sent_back_to_agent TEXT NOT NULL DEFAULT '';
ALTER TABLE public.content_feedback ADD COLUMN IF NOT EXISTS created_by TEXT NOT NULL DEFAULT 'founder';
ALTER TABLE public.content_feedback ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_content_feedback_source ON public.content_feedback(source_table, source_id);
CREATE INDEX IF NOT EXISTS idx_content_feedback_agent ON public.content_feedback(sent_back_to_agent, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_feedback_category ON public.content_feedback(feedback_category);

ALTER TABLE public.content_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_content_feedback" ON public.content_feedback;
CREATE POLICY "marketing_os_all_content_feedback" ON public.content_feedback FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
