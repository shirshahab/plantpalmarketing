-- ============================================================================
-- Phase 39 — Unified Content Workflow
-- Single workflow record per content item with stage, agents, and history.
-- Safe to re-run.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.content_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table TEXT NOT NULL,
  source_id UUID NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'content',
  title TEXT NOT NULL DEFAULT '',
  current_stage TEXT NOT NULL DEFAULT 'IDEA',
  assigned_agent TEXT NOT NULL DEFAULT '',
  next_agent TEXT NOT NULL DEFAULT '',
  next_action TEXT NOT NULL DEFAULT '',
  history_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  calendar_item_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_table, source_id)
);

CREATE INDEX IF NOT EXISTS idx_content_workflows_stage ON public.content_workflows(current_stage);
CREATE INDEX IF NOT EXISTS idx_content_workflows_calendar ON public.content_workflows(calendar_item_id);

ALTER TABLE public.content_workflows DROP CONSTRAINT IF EXISTS content_workflows_stage_check;
ALTER TABLE public.content_workflows
  ADD CONSTRAINT content_workflows_stage_check
  CHECK (current_stage IN (
    'IDEA',
    'PENDING_FOUNDER_IDEA_APPROVAL',
    'IN_PRODUCTION',
    'PENDING_FOUNDER_ASSET_APPROVAL',
    'CALENDAR_READY',
    'SCHEDULED',
    'PUBLISHED',
    'ARCHIVED',
    'REJECTED'
  ));

ALTER TABLE public.content_workflows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_os_all_content_workflows" ON public.content_workflows;
CREATE POLICY "marketing_os_all_content_workflows" ON public.content_workflows
  FOR ALL USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS content_workflows_updated_at ON public.content_workflows;
CREATE TRIGGER content_workflows_updated_at
  BEFORE UPDATE ON public.content_workflows
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

NOTIFY pgrst, 'reload schema';
